// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "fileio/DynFormat.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/XLineEntity.h"
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
    case EntityType::Arc: {
        const auto& a = static_cast<const ArcEntity&>(e);
        o["type"] = "ARC";
        o["center"] = toJson(a.center());
        o["radius"] = a.radius();
        o["startAngle"] = a.startDeg();
        o["endAngle"] = a.endDeg();
        break;
    }
    case EntityType::Ellipse: {
        const EllipseGeom& g = static_cast<const EllipseEntity&>(e).geom();
        o["type"] = "ELLIPSE";
        o["center"] = toJson(g.center);
        o["majorAxis"] = toJson(g.major);
        o["ratio"] = g.ratio;
        if (!g.isFull()) {
            o["startParam"] = g.startParam;
            o["endParam"] = g.endParam;
        }
        break;
    }
    case EntityType::Spline: {
        const NurbsCurve& c = static_cast<const SplineEntity&>(e).curve();
        o["type"] = "SPLINE";
        o["degree"] = c.degree;
        QJsonArray knots, ctrl, weights;
        for (double k : c.knots) knots.append(k);
        for (const Vec2& p : c.ctrl) ctrl.append(toJson(p));
        o["knots"] = knots;
        o["controlPoints"] = ctrl;
        if (!c.weights.empty()) {
            for (double w : c.weights) weights.append(w);
            o["weights"] = weights;
        }
        break;
    }
    case EntityType::XLine: {
        const auto& x = static_cast<const XLineEntity&>(e);
        o["type"] = x.isRay() ? "RAY" : "XLINE";
        o["base"] = toJson(x.base());
        o["direction"] = toJson(x.direction());
        break;
    }
    case EntityType::Point: {
        o["type"] = "POINT";
        o["position"] = toJson(static_cast<const PointEntity&>(e).position());
        break;
    }
    case EntityType::Polyline: {
        const auto& p = static_cast<const PolylineEntity&>(e);
        o["type"] = "POLYLINE";
        o["closed"] = p.isClosed();
        QJsonArray verts;
        for (const Vec2& v : p.vertices()) verts.append(toJson(v));
        o["vertices"] = verts;
        if (p.hasArcs()) {
            QJsonArray bulges;
            for (double b : p.bulges()) bulges.append(b);
            o["bulges"] = bulges;
        }
        if (p.isFilled()) o["filled"] = true;
        if (p.width() > 0) o["width"] = p.width();
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
        std::vector<double> bulges;
        if (o.contains("bulges")) {
            const QJsonArray ba = o.value("bulges").toArray();
            if (ba.size() != va.size()) { reason = "POLYLINE bulge count does not match vertex count"; return nullptr; }
            for (const auto& b : ba) {
                if (!b.isDouble() || !std::isfinite(b.toDouble())) { reason = "POLYLINE has an invalid bulge"; return nullptr; }
                bulges.push_back(b.toDouble());
            }
        }
        auto pl = std::make_shared<PolylineEntity>(std::move(verts), std::move(bulges), o.value("closed").toBool(false));
        pl->setFilled(o.value("filled").toBool(false));
        const double w = o.value("width").toDouble(0.0);
        if (!std::isfinite(w) || w < 0) { reason = "POLYLINE has an invalid width"; return nullptr; }
        pl->setWidth(w);
        e = pl;
    } else if (type == "ARC") {
        Vec2 c;
        const double r = o.value("radius").toDouble(-1.0);
        const QJsonValue a0 = o.value("startAngle"), a1 = o.value("endAngle");
        if (!fromJson(o.value("center"), c) || !(r > 0.0) || !std::isfinite(r) || !a0.isDouble() || !a1.isDouble() ||
            !std::isfinite(a0.toDouble()) || !std::isfinite(a1.toDouble())) {
            reason = "ARC has invalid center/radius/angles";
            return nullptr;
        }
        e = std::make_shared<ArcEntity>(c, r, a0.toDouble(), a1.toDouble());
    } else if (type == "XLINE" || type == "RAY") {
        Vec2 b, d;
        if (!fromJson(o.value("base"), b) || !fromJson(o.value("direction"), d) || !(d.length() > 0)) {
            reason = type.toStdString() + " has invalid base/direction";
            return nullptr;
        }
        e = std::make_shared<XLineEntity>(b, d, type == "RAY");
    } else if (type == "ELLIPSE") {
        EllipseGeom g;
        g.ratio = o.value("ratio").toDouble(-1.0);
        if (!fromJson(o.value("center"), g.center) || !fromJson(o.value("majorAxis"), g.major) || !(g.ratio > 0.0) ||
            g.ratio > 1.0 || !(g.major.length() > 0.0)) {
            reason = "ELLIPSE has invalid center/axis/ratio";
            return nullptr;
        }
        if (o.contains("startParam") || o.contains("endParam")) {
            g.startParam = o.value("startParam").toDouble(NAN);
            g.endParam = o.value("endParam").toDouble(NAN);
            if (!std::isfinite(g.startParam) || !std::isfinite(g.endParam)) { reason = "ELLIPSE has invalid parameters"; return nullptr; }
        }
        e = std::make_shared<EllipseEntity>(g);
    } else if (type == "SPLINE") {
        NurbsCurve c;
        c.degree = o.value("degree").toInt(-1);
        for (const auto& k : o.value("knots").toArray()) c.knots.push_back(k.isDouble() ? k.toDouble() : NAN);
        for (const auto& v : o.value("controlPoints").toArray()) {
            Vec2 p;
            if (!fromJson(v, p)) { reason = "SPLINE has an invalid control point"; return nullptr; }
            c.ctrl.push_back(p);
        }
        for (const auto& w : o.value("weights").toArray()) c.weights.push_back(w.isDouble() ? w.toDouble() : NAN);
        std::string why;
        if (!c.isValid(&why)) { reason = "SPLINE is invalid (" + why + ")"; return nullptr; }
        e = std::make_shared<SplineEntity>(std::move(c));
    } else if (type == "POINT") {
        Vec2 p;
        if (!fromJson(o.value("position"), p)) { reason = "POINT has invalid position"; return nullptr; }
        e = std::make_shared<PointEntity>(p);
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

QByteArray serializeEntities(const std::vector<EntityPtr>& entities) {
    QJsonObject root;
    root["format"] = "DynamicCAD-Clipboard";
    root["formatVersion"] = kDynFormatVersion;
    QJsonArray ents;
    for (const auto& e : entities) ents.append(entityToJson(*e));
    root["entities"] = ents;
    return QJsonDocument(root).toJson(QJsonDocument::Compact);
}

std::vector<EntityPtr> deserializeEntities(const QByteArray& data, std::vector<std::string>* warnings) {
    std::vector<EntityPtr> out;
    const QJsonDocument jd = QJsonDocument::fromJson(data);
    if (!jd.isObject() || jd.object().value("format").toString() != "DynamicCAD-Clipboard") return out;
    for (const auto& v : jd.object().value("entities").toArray()) {
        std::string why;
        if (auto e = v.isObject() ? entityFromJson(v.toObject(), why) : nullptr) out.push_back(e);
        else if (warnings) warnings->push_back(why);
    }
    return out;
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
