// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "fileio/DynFormat.h"

#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "version.h"

#include <QFile>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSaveFile>

#include <cmath>

namespace dyncad {

namespace {

constexpr const char* kFormatId = "DynamicCAD-Drawing";
constexpr qint64 kMaxFileSize = 512LL * 1024 * 1024;

QJsonArray toJson(const Vec2& v) { return QJsonArray{v.x, v.y}; }

bool fromJson(const QJsonValue& val, Vec2& out) {
    if (!val.isArray()) return false;
    const QJsonArray a = val.toArray();
    if (a.size() != 2 || !a[0].isDouble() || !a[1].isDouble()) return false;
    out = {a[0].toDouble(), a[1].toDouble()};
    return out.isFinite();
}

QJsonObject entityToJson(const Entity& e) {
    QJsonObject o;
    o["layer"] = QString::fromStdString(e.layer());
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        o["type"] = "LINE";
        o["start"] = toJson(l.start());
        o["end"] = toJson(l.end());
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(e);
        o["type"] = "CIRCLE";
        o["center"] = toJson(c.center());
        o["radius"] = c.radius();
        break;
    }
    case EntityType::Polyline: {
        const auto& p = static_cast<const PolylineEntity&>(e);
        o["type"] = "POLYLINE";
        o["closed"] = p.isClosed();
        QJsonArray verts;
        for (const Vec2& v : p.vertices()) verts.append(toJson(v));
        o["vertices"] = verts;
        break;
    }
    }
    return o;
}

// Returns nullptr and fills reason if the object is not a valid entity.
EntityPtr entityFromJson(const QJsonObject& o, std::string& reason) {
    const QString type = o.value("type").toString();
    EntityPtr e;
    if (type == "LINE") {
        Vec2 a, b;
        if (!fromJson(o.value("start"), a) || !fromJson(o.value("end"), b)) { reason = "LINE has invalid start/end"; return nullptr; }
        e = std::make_shared<LineEntity>(a, b);
    } else if (type == "CIRCLE") {
        Vec2 c;
        const double r = o.value("radius").toDouble(-1.0);
        if (!fromJson(o.value("center"), c) || !(r > 0.0) || !std::isfinite(r)) { reason = "CIRCLE has invalid center/radius"; return nullptr; }
        e = std::make_shared<CircleEntity>(c, r);
    } else if (type == "POLYLINE") {
        const QJsonArray va = o.value("vertices").toArray();
        std::vector<Vec2> verts;
        verts.reserve(static_cast<std::size_t>(va.size()));
        for (const auto& v : va) {
            Vec2 p;
            if (!fromJson(v, p)) { reason = "POLYLINE has an invalid vertex"; return nullptr; }
            verts.push_back(p);
        }
        if (verts.size() < 2) { reason = "POLYLINE needs at least 2 vertices"; return nullptr; }
        e = std::make_shared<PolylineEntity>(std::move(verts), o.value("closed").toBool(false));
    } else {
        reason = "unsupported entity type \"" + type.toStdString() + "\"";
        return nullptr;
    }
    const QString layer = o.value("layer").toString("0");
    e->setLayer(layer.isEmpty() ? "0" : layer.toStdString());
    return e;
}

} // namespace

QByteArray serializeDyn(const Document& doc) {
    QJsonObject root;
    root["format"] = kFormatId;
    root["formatVersion"] = kDynFormatVersion;
    root["application"] = QStringLiteral("DYNAMIC CAD %1").arg(DYNCAD_VERSION_STRING);
    root["units"] = QString::fromStdString(doc.units());
    QJsonArray ents;
    for (const auto& e : doc.entities()) ents.append(entityToJson(*e));
    root["entities"] = ents;
    return QJsonDocument(root).toJson(QJsonDocument::Indented);
}

FileResult deserializeDyn(const QByteArray& data, Document& doc) {
    FileResult r;
    QJsonParseError perr{};
    const QJsonDocument jd = QJsonDocument::fromJson(data, &perr);
    if (perr.error != QJsonParseError::NoError) {
        r.error = "Not a valid DYNAMIC CAD drawing (JSON error at offset " + std::to_string(perr.offset) + ": " +
                  perr.errorString().toStdString() + ").";
        return r;
    }
    if (!jd.isObject()) { r.error = "Not a valid DYNAMIC CAD drawing (root is not an object)."; return r; }
    const QJsonObject root = jd.object();
    if (root.value("format").toString() != kFormatId) { r.error = "Not a DYNAMIC CAD drawing (missing format identifier)."; return r; }
    const int version = root.value("formatVersion").toInt(-1);
    if (version < 1) { r.error = "Drawing has an invalid format version."; return r; }
    if (version > kDynFormatVersion) {
        r.error = "This drawing was created by a newer version of DYNAMIC CAD (format " + std::to_string(version) +
                  "). Please update the application.";
        return r;
    }
    if (!root.value("entities").isArray()) { r.error = "Drawing has no entity list."; return r; }

    std::vector<EntityPtr> entities;
    const QJsonArray arr = root.value("entities").toArray();
    entities.reserve(static_cast<std::size_t>(arr.size()));
    int index = 0;
    for (const auto& v : arr) {
        std::string reason;
        EntityPtr e = v.isObject() ? entityFromJson(v.toObject(), reason) : nullptr;
        if (!v.isObject()) reason = "entry is not an object";
        if (e) entities.push_back(std::move(e));
        else r.warnings.push_back("Entity #" + std::to_string(index) + " skipped: " + reason + ".");
        ++index;
    }
    QString units = root.value("units").toString("mm");
    doc.reset(std::move(entities), units.isEmpty() ? "mm" : units.toStdString());
    r.ok = true;
    return r;
}

FileResult saveDynFile(const Document& doc, const QString& path) {
    FileResult r;
    QSaveFile f(path);
    if (!f.open(QIODevice::WriteOnly)) { r.error = "Cannot write \"" + path.toStdString() + "\": " + f.errorString().toStdString(); return r; }
    const QByteArray data = serializeDyn(doc);
    if (f.write(data) != data.size() || !f.commit()) {
        r.error = "Failed to save \"" + path.toStdString() + "\": " + f.errorString().toStdString();
        return r;
    }
    r.ok = true;
    return r;
}

FileResult loadDynFile(Document& doc, const QString& path) {
    FileResult r;
    QFile f(path);
    if (!f.open(QIODevice::ReadOnly)) { r.error = "Cannot open \"" + path.toStdString() + "\": " + f.errorString().toStdString(); return r; }
    if (f.size() > kMaxFileSize) { r.error = "File is too large to be a DYNAMIC CAD drawing."; return r; }
    return deserializeDyn(f.readAll(), doc);
}

} // namespace dyncad
