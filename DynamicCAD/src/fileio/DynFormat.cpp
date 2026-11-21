// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "fileio/DynFormat.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/XLineEntity.h"
#include "entities/Annotation.h"
#include "entities/BlockEntities.h"
#include "entities/HatchEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "version.h"

#include <QFile>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSaveFile>

#include <algorithm>
#include <cmath>
#include <functional>
#include <map>
#include <set>

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

QJsonObject dimStyleToJson(const DimStyle& s) {
    QJsonObject o;
    o["textHeight"] = s.textHeight;
    o["arrowSize"] = s.arrowSize;
    o["extOffset"] = s.extOffset;
    o["extBeyond"] = s.extBeyond;
    o["textGap"] = s.textGap;
    o["precision"] = s.precision;
    o["suppressZeros"] = s.suppressZeros;
    o["font"] = QString::fromStdString(s.font);
    return o;
}

DimStyle dimStyleFromJson(const QJsonObject& o) {
    DimStyle s;
    auto pos = [&](const char* k, double& v) { const double x = o.value(k).toDouble(v); if (x > 0 && std::isfinite(x)) v = x; };
    pos("textHeight", s.textHeight);
    pos("arrowSize", s.arrowSize);
    auto nonneg = [&](const char* k, double& v) { const double x = o.value(k).toDouble(v); if (x >= 0 && std::isfinite(x)) v = x; };
    nonneg("extOffset", s.extOffset);
    nonneg("extBeyond", s.extBeyond);
    nonneg("textGap", s.textGap);
    s.precision = std::clamp(o.value("precision").toInt(s.precision), 0, 8);
    s.suppressZeros = o.value("suppressZeros").toBool(s.suppressZeros);
    const QString f = o.value("font").toString();
    if (!f.isEmpty()) s.font = f.toStdString();
    return s;
}

QJsonObject entityToJson(const Entity& e) {
    QJsonObject o;
    o["layer"] = QString::fromStdString(e.layer().empty() ? std::string("0") : e.layer());
    // Display properties are written only when not ByLayer (keeps files small).
    if (e.color().kind != CadColor::Kind::ByLayer) o["color"] = QString::fromStdString(e.color().toString());
    if (upperName(e.linetype()) != "BYLAYER") o["linetype"] = QString::fromStdString(e.linetype());
    if (e.lineweight() != kLwByLayer) o["lineweight"] = e.lineweight();
    if (e.ltscale() != 1.0) o["ltscale"] = e.ltscale();
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
    case EntityType::Text: {
        const auto& t = static_cast<const TextEntity&>(e);
        o["type"] = t.multiline() ? "MTEXT" : "TEXT";
        o["insert"] = toJson(t.insert());
        o["text"] = QString::fromStdString(t.text());
        o["height"] = t.height();
        if (t.rotationDeg() != 0) o["rotation"] = t.rotationDeg();
        o["justify"] = justifyName(t.justify());
        if (t.font() != "Arial") o["font"] = QString::fromStdString(t.font());
        if (t.wrapWidth() > 0) o["wrapWidth"] = t.wrapWidth();
        break;
    }
    case EntityType::Dimension: {
        const auto& d = static_cast<const DimensionEntity&>(e);
        o["type"] = "DIMENSION";
        o["kind"] = dimKindName(d.kind());
        o["a"] = toJson(d.a());
        o["b"] = toJson(d.b());
        if (d.kind() == DimKind::Angular) o["c"] = toJson(d.c());
        o["location"] = toJson(d.location());
        if (d.kind() == DimKind::Linear) o["angle"] = d.angleDeg();
        if (!d.textOverride().empty()) o["textOverride"] = QString::fromStdString(d.textOverride());
        o["style"] = dimStyleToJson(d.dimStyle());
        break;
    }
    case EntityType::Leader: {
        const auto& l = static_cast<const LeaderEntity&>(e);
        o["type"] = "LEADER";
        QJsonArray pts;
        for (const Vec2& p : l.points()) pts.append(toJson(p));
        o["points"] = pts;
        o["text"] = QString::fromStdString(l.text());
        o["style"] = dimStyleToJson(l.dimStyle());
        break;
    }
    case EntityType::Insert: {
        const auto& ins = static_cast<const InsertEntity&>(e);
        o["type"] = "INSERT";
        o["block"] = QString::fromStdString(ins.blockName());
        o["position"] = toJson(ins.position());
        if (ins.scaleX() != 1.0 || ins.scaleY() != 1.0) o["scale"] = QJsonArray{ins.scaleX(), ins.scaleY()};
        if (ins.rotationDeg() != 0) o["rotation"] = ins.rotationDeg();
        break;
    }
    case EntityType::Hatch: {
        const auto& h = static_cast<const HatchEntity&>(e);
        o["type"] = "HATCH";
        QJsonArray loops;
        for (const auto& l : h.loops()) {
            QJsonObject lo;
            QJsonArray v, b;
            for (const Vec2& p : l.vertices) v.append(toJson(p));
            bool arcs = false;
            for (double x : l.bulges) { b.append(x); arcs |= x != 0; }
            lo["vertices"] = v;
            if (arcs) lo["bulges"] = b;
            loops.append(lo);
        }
        o["loops"] = loops;
        const HatchPattern& pat = h.pattern();
        QJsonObject po;
        po["name"] = QString::fromStdString(pat.name);
        po["solid"] = pat.solid;
        po["scale"] = pat.scale;
        po["angle"] = pat.angle;
        QJsonArray fams;
        for (const auto& f : pat.families) {
            QJsonObject fo;
            fo["angle"] = f.angleDeg;
            fo["origin"] = toJson(f.origin);
            fo["offset"] = toJson(f.offset);
            QJsonArray d;
            for (double x : f.dashes) d.append(x);
            if (!d.isEmpty()) fo["dashes"] = d;
            fams.append(fo);
        }
        if (!pat.solid) po["families"] = fams;
        o["pattern"] = po;
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
using BlockResolver = std::function<BlockDefPtr(const std::string&)>;

EntityPtr entityFromJson(const QJsonObject& o, std::string& reason, const BlockResolver& blocks = nullptr) {
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
    } else if (type == "INSERT") {
        Vec2 pos;
        const std::string name = o.value("block").toString().toStdString();
        BlockDefPtr def = blocks ? blocks(name) : nullptr;
        if (!def) { reason = "INSERT refers to an unknown block \"" + name + "\""; return nullptr; }
        if (!fromJson(o.value("position"), pos)) { reason = "INSERT has an invalid position"; return nullptr; }
        double sx = 1, sy = 1;
        if (o.contains("scale")) {
            const QJsonArray sc = o.value("scale").toArray();
            if (sc.size() != 2 || !sc[0].isDouble() || !sc[1].isDouble() || sc[0].toDouble() == 0 || sc[1].toDouble() == 0) {
                reason = "INSERT has an invalid scale";
                return nullptr;
            }
            sx = sc[0].toDouble();
            sy = sc[1].toDouble();
        }
        e = std::make_shared<InsertEntity>(def, pos, sx, sy, o.value("rotation").toDouble(0));
    } else if (type == "HATCH") {
        std::vector<HatchLoop> loops;
        for (const auto& lv : o.value("loops").toArray()) {
            HatchLoop l;
            for (const auto& v : lv.toObject().value("vertices").toArray()) {
                Vec2 p;
                if (!fromJson(v, p)) { reason = "HATCH has an invalid vertex"; return nullptr; }
                l.vertices.push_back(p);
            }
            for (const auto& b : lv.toObject().value("bulges").toArray()) l.bulges.push_back(b.toDouble(0));
            if (l.vertices.size() < 3 && !(l.vertices.size() == 2 && l.bulges.size() == 2)) { reason = "HATCH loop needs 3 vertices"; return nullptr; }
            loops.push_back(std::move(l));
        }
        if (loops.empty()) { reason = "HATCH has no boundary"; return nullptr; }
        const QJsonObject po = o.value("pattern").toObject();
        HatchPattern pat;
        pat.name = po.value("name").toString("SOLID").toStdString();
        pat.solid = po.value("solid").toBool(true);
        pat.scale = po.value("scale").toDouble(1.0);
        pat.angle = po.value("angle").toDouble(0.0);
        for (const auto& fv : po.value("families").toArray()) {
            const QJsonObject fo = fv.toObject();
            HatchLineFamily f;
            f.angleDeg = fo.value("angle").toDouble(0);
            if (!fromJson(fo.value("origin"), f.origin) || !fromJson(fo.value("offset"), f.offset)) { reason = "HATCH pattern is invalid"; return nullptr; }
            for (const auto& d : fo.value("dashes").toArray()) f.dashes.push_back(d.toDouble(0));
            pat.families.push_back(f);
        }
        if (!pat.solid && pat.families.empty()) pat = makeHatchPattern(pat.name, pat.scale, pat.angle);
        e = std::make_shared<HatchEntity>(std::move(loops), std::move(pat));
    } else if (type == "TEXT" || type == "MTEXT") {
        Vec2 ins;
        const double h = o.value("height").toDouble(-1);
        if (!fromJson(o.value("insert"), ins) || !(h > 0) || !std::isfinite(h)) { reason = "TEXT has invalid insert/height"; return nullptr; }
        TextJustify j = TextJustify::Left;
        parseJustify(upperName(o.value("justify").toString("Left").toStdString()), j);
        auto t = std::make_shared<TextEntity>(ins, o.value("text").toString().toStdString(), h, o.value("rotation").toDouble(0), j);
        if (o.contains("font")) t->setFont(o.value("font").toString().toStdString());
        t->setWrapWidth(o.value("wrapWidth").toDouble(0));
        e = t;
    } else if (type == "DIMENSION") {
        static const std::map<QString, DimKind> kinds = {{"Linear", DimKind::Linear}, {"Aligned", DimKind::Aligned},
                                                         {"Angular", DimKind::Angular}, {"Radius", DimKind::Radius},
                                                         {"Diameter", DimKind::Diameter}};
        auto k = kinds.find(o.value("kind").toString());
        Vec2 a, b, loc, c;
        if (k == kinds.end() || !fromJson(o.value("a"), a) || !fromJson(o.value("b"), b) || !fromJson(o.value("location"), loc)) {
            reason = "DIMENSION has an invalid kind or points";
            return nullptr;
        }
        auto d = std::make_shared<DimensionEntity>(k->second, a, b, loc, o.value("angle").toDouble(0));
        if (k->second == DimKind::Angular) {
            if (!fromJson(o.value("c"), c)) { reason = "angular DIMENSION needs point c"; return nullptr; }
            d->setC(c);
        }
        d->setTextOverride(o.value("textOverride").toString().toStdString());
        d->setDimStyle(dimStyleFromJson(o.value("style").toObject()));
        e = d;
    } else if (type == "LEADER") {
        std::vector<Vec2> pts;
        for (const auto& v : o.value("points").toArray()) {
            Vec2 p;
            if (!fromJson(v, p)) { reason = "LEADER has an invalid point"; return nullptr; }
            pts.push_back(p);
        }
        if (pts.size() < 2) { reason = "LEADER needs at least 2 points"; return nullptr; }
        auto l = std::make_shared<LeaderEntity>(std::move(pts), o.value("text").toString().toStdString());
        l->setDimStyle(dimStyleFromJson(o.value("style").toObject()));
        e = l;
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
    if (o.contains("color")) {
        CadColor c;
        if (CadColor::parse(o.value("color").toString().toStdString(), c)) e->setColor(c);
    }
    if (o.contains("linetype")) e->setLinetype(o.value("linetype").toString().toStdString());
    if (o.contains("lineweight")) {
        const int lw = o.value("lineweight").toInt(kLwByLayer);
        if (lw >= kLwDefault && lw <= 211) e->setLineweight(lw);
    }
    if (o.contains("ltscale")) e->setLtscale(o.value("ltscale").toDouble(1.0));
    return e;
}

} // namespace

namespace {
QJsonObject tablesToJson(const StyleTables& t, QJsonObject root) {
    QJsonArray layers;
    for (const Layer& l : t.layers()) {
        QJsonObject o;
        o["name"] = QString::fromStdString(l.name);
        o["color"] = QString::fromStdString(l.color.toString());
        o["linetype"] = QString::fromStdString(l.linetype);
        o["lineweight"] = l.lineweight;
        o["on"] = l.on;
        o["frozen"] = l.frozen;
        o["locked"] = l.locked;
        o["plot"] = l.plot;
        layers.append(o);
    }
    root["layers"] = layers;
    root["currentLayer"] = QString::fromStdString(t.currentLayer());
    root["ltscale"] = t.ltscale();
    QJsonArray lts;
    const auto& builtin = builtinLinetypes();
    for (const Linetype& lt : t.linetypes()) {
        bool isBuiltin = false;
        for (const auto& b : builtin) isBuiltin |= (upperName(b.name) == upperName(lt.name) && b.pattern == lt.pattern);
        if (isBuiltin) continue;
        QJsonObject o;
        o["name"] = QString::fromStdString(lt.name);
        o["description"] = QString::fromStdString(lt.description);
        QJsonArray pat;
        for (double d : lt.pattern) pat.append(d);
        o["pattern"] = pat;
        lts.append(o);
    }
    if (!lts.isEmpty()) root["linetypes"] = lts;
    return root;
}

StyleTables tablesFromJson(const QJsonObject& root, std::vector<std::string>& warnings) {
    StyleTables t;
    for (const auto& v : root.value("linetypes").toArray()) {
        const QJsonObject o = v.toObject();
        Linetype lt;
        lt.name = o.value("name").toString().toStdString();
        lt.description = o.value("description").toString().toStdString();
        bool ok = !lt.name.empty();
        for (const auto& d : o.value("pattern").toArray()) {
            ok &= d.isDouble() && std::isfinite(d.toDouble());
            lt.pattern.push_back(d.toDouble());
        }
        if (ok) t.addLinetype(lt);
        else warnings.push_back("A linetype definition is invalid and was skipped.");
    }
    for (const auto& v : root.value("layers").toArray()) {
        const QJsonObject o = v.toObject();
        Layer l;
        l.name = o.value("name").toString().toStdString();
        if (!StyleTables::validName(l.name)) { warnings.push_back("Layer with an invalid name skipped."); continue; }
        CadColor c;
        if (CadColor::parse(o.value("color").toString("7").toStdString(), c) && c.kind != CadColor::Kind::ByLayer &&
            c.kind != CadColor::Kind::ByBlock)
            l.color = c;
        l.linetype = o.value("linetype").toString(kContinuous).toStdString();
        l.lineweight = o.value("lineweight").toInt(kLwDefault);
        if (l.lineweight < kLwDefault || l.lineweight > 211) l.lineweight = kLwDefault;
        l.on = o.value("on").toBool(true);
        l.frozen = o.value("frozen").toBool(false);
        l.locked = o.value("locked").toBool(false);
        l.plot = o.value("plot").toBool(true);
        if (Layer* existing = t.layer(l.name)) *existing = l;
        else t.addLayer(l);
    }
    t.setLtscale(root.value("ltscale").toDouble(1.0));
    t.setCurrentLayer(root.value("currentLayer").toString("0").toStdString());
    return t;
}
} // namespace

namespace {
// Every block definition used by the entities, including blocks nested
// inside other blocks.
void collectBlocks(const Entity& e, std::map<std::string, BlockDefPtr>& out) {
    if (e.type() != EntityType::Insert) return;
    const auto& b = static_cast<const InsertEntity&>(e).block();
    if (!b || out.count(upperName(b->name))) return;
    out[upperName(b->name)] = b;
    for (const auto& sub : b->entities) collectBlocks(*sub, out);
}

// Completes a block map with the definitions its blocks refer to.
void closeOverNested(std::map<std::string, BlockDefPtr>& blocks) {
    std::vector<BlockDefPtr> todo;
    for (const auto& kv : blocks) todo.push_back(kv.second);
    for (const auto& b : todo)
        for (const auto& sub : b->entities) collectBlocks(*sub, blocks);
}

QJsonArray blocksToJson(const std::map<std::string, BlockDefPtr>& blocks) {
    QJsonArray arr;
    for (const auto& [k, b] : blocks) {
        QJsonObject o;
        o["name"] = QString::fromStdString(b->name);
        if (!b->description.empty()) o["description"] = QString::fromStdString(b->description);
        QJsonArray ents;
        for (const auto& e : b->entities) ents.append(entityToJson(*e));
        o["entities"] = ents;
        arr.append(o);
    }
    return arr;
}

// Parses block definitions (nested references in any order, cycles rejected).
std::map<std::string, BlockDefPtr> blocksFromJson(const QJsonArray& arr, std::vector<std::string>& warnings) {
    std::map<std::string, QJsonObject> raw;
    for (const auto& v : arr) {
        const QJsonObject o = v.toObject();
        const std::string n = o.value("name").toString().toStdString();
        if (!n.empty()) raw[upperName(n)] = o;
    }
    std::map<std::string, BlockDefPtr> done;
    std::set<std::string> building;
    std::function<BlockDefPtr(const std::string&)> get = [&](const std::string& name) -> BlockDefPtr {
        const std::string k = upperName(name);
        if (auto it = done.find(k); it != done.end()) return it->second;
        auto it = raw.find(k);
        if (it == raw.end() || building.count(k)) return nullptr; // missing or circular
        building.insert(k);
        auto def = std::make_shared<BlockDef>();
        def->name = it->second.value("name").toString().toStdString();
        def->description = it->second.value("description").toString().toStdString();
        for (const auto& ev : it->second.value("entities").toArray()) {
            std::string why;
            if (auto e = ev.isObject() ? entityFromJson(ev.toObject(), why, get) : nullptr) def->entities.push_back(e);
            else warnings.push_back("Block \"" + def->name + "\": entity skipped (" + why + ").");
        }
        building.erase(k);
        done[k] = def;
        return def;
    };
    for (const auto& [k, o] : raw) get(k);
    return done;
}
} // namespace

QByteArray serializeDyn(const Document& doc) {
    QJsonObject root;
    root["format"] = kFormatId;
    root["formatVersion"] = kDynFormatVersion;
    root["application"] = QStringLiteral("DYNAMIC CAD %1").arg(DYNCAD_VERSION_STRING);
    root["units"] = QString::fromStdString(doc.units());
    root = tablesToJson(doc.styles(), root);
    std::map<std::string, BlockDefPtr> blocks = doc.blocks();
    closeOverNested(blocks);
    for (const auto& e : doc.entities()) collectBlocks(*e, blocks);
    if (!blocks.empty()) root["blocks"] = blocksToJson(blocks);
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

    std::map<std::string, BlockDefPtr> blocks = blocksFromJson(root.value("blocks").toArray(), r.warnings);
    const BlockResolver resolver = [&](const std::string& n) -> BlockDefPtr {
        auto it = blocks.find(upperName(n));
        return it == blocks.end() ? nullptr : it->second;
    };
    std::vector<EntityPtr> entities;
    const QJsonArray arr = root.value("entities").toArray();
    entities.reserve(static_cast<std::size_t>(arr.size()));
    int index = 0;
    for (const auto& v : arr) {
        std::string reason;
        EntityPtr e = v.isObject() ? entityFromJson(v.toObject(), reason, resolver) : nullptr;
        if (!v.isObject()) reason = "entry is not an object";
        if (e) entities.push_back(std::move(e));
        else r.warnings.push_back("Entity #" + std::to_string(index) + " skipped: " + reason + ".");
        ++index;
    }
    QString units = root.value("units").toString("mm");
    StyleTables tables = tablesFromJson(root, r.warnings);
    doc.reset(std::move(entities), units.isEmpty() ? "mm" : units.toStdString(), std::move(tables), std::move(blocks));
    r.ok = true;
    return r;
}

QByteArray serializeEntities(const std::vector<EntityPtr>& entities) {
    QJsonObject root;
    root["format"] = "DynamicCAD-Clipboard";
    root["formatVersion"] = kDynFormatVersion;
    std::map<std::string, BlockDefPtr> blocks;
    for (const auto& e : entities) collectBlocks(*e, blocks);
    if (!blocks.empty()) root["blocks"] = blocksToJson(blocks);
    QJsonArray ents;
    for (const auto& e : entities) ents.append(entityToJson(*e));
    root["entities"] = ents;
    return QJsonDocument(root).toJson(QJsonDocument::Compact);
}

std::vector<EntityPtr> deserializeEntities(const QByteArray& data, std::vector<std::string>* warnings) {
    std::vector<EntityPtr> out;
    const QJsonDocument jd = QJsonDocument::fromJson(data);
    if (!jd.isObject() || jd.object().value("format").toString() != "DynamicCAD-Clipboard") return out;
    std::vector<std::string> w;
    auto blocks = blocksFromJson(jd.object().value("blocks").toArray(), w);
    const BlockResolver resolver = [&](const std::string& n) -> BlockDefPtr {
        auto it = blocks.find(upperName(n));
        return it == blocks.end() ? nullptr : it->second;
    };
    for (const auto& v : jd.object().value("entities").toArray()) {
        std::string why;
        if (auto e = v.isObject() ? entityFromJson(v.toObject(), why, resolver) : nullptr) out.push_back(e);
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
