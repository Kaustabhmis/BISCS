// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/GripAndClipboard.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "entities/XLineEntity.h"
#include "entities/Annotation.h"
#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad {

EntityPtr withGripMoved(const Entity& e, std::size_t i, const Vec2& to) {
    const auto grips = e.gripPoints();
    if (i >= grips.size() || !to.isFinite()) return nullptr;
    const Vec2 delta = to - grips[i];
    auto translateAll = [&]() { return EntityPtr(e.transformed(Affine2D::translation(delta))); };
    EntityPtr out;
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        if (i == 1) return translateAll();
        out = std::make_shared<LineEntity>(i == 0 ? to : l.start(), i == 2 ? to : l.end());
        if (distance(static_cast<LineEntity&>(*out).start(), static_cast<LineEntity&>(*out).end()) == 0) return nullptr;
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(e);
        if (i == 0) return translateAll();
        const double r = distance(c.center(), to);
        if (!(r > 0)) return nullptr;
        out = std::make_shared<CircleEntity>(c.center(), r);
        break;
    }
    case EntityType::Arc: {
        if (i == 3) return translateAll();
        std::vector<Vec2> pts = {grips[0], grips[1], grips[2]};
        pts[i] = to;
        auto circ = geom::circleFrom3Points(pts[0], pts[1], pts[2]);
        if (!circ) return nullptr;
        const bool ccw = (pts[1] - pts[0]).cross(pts[2] - pts[1]) > 0;
        const double a0 = geom::angleDeg(circ->first, pts[0]), a2 = geom::angleDeg(circ->first, pts[2]);
        out = ccw ? std::make_shared<ArcEntity>(circ->first, circ->second, a0, a2)
                  : std::make_shared<ArcEntity>(circ->first, circ->second, a2, a0);
        break;
    }
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        std::vector<Vec2> v = pl.vertices();
        v[i] = to;
        auto np = std::make_shared<PolylineEntity>(std::move(v), pl.bulges(), pl.isClosed());
        np->setWidth(pl.width());
        np->setFilled(pl.isFilled());
        out = np;
        break;
    }
    case EntityType::Ellipse: {
        EllipseGeom g = static_cast<const EllipseEntity&>(e).geom();
        if (i == 0) return translateAll();
        if (!g.isFull()) return nullptr;
        if (i <= 2) { // major axis end: new direction and length, minor length kept
            const double minorR = g.minorRadius();
            const Vec2 axis = (i == 1) ? to - g.center : g.center - to;
            if (!(axis.length() > 0)) return nullptr;
            if (axis.length() >= minorR) { g.major = axis; g.ratio = minorR / axis.length(); }
            else { g.major = Vec2{-axis.y, axis.x}.normalized() * minorR; g.ratio = axis.length() / minorR; }
        } else { // minor axis end: new minor length
            const double m = distance(g.center, to), a = g.majorRadius();
            if (!(m > 0)) return nullptr;
            if (m <= a) g.ratio = m / a;
            else { g.major = Vec2{-g.major.y, g.major.x}.normalized() * m; g.ratio = a / m; }
        }
        out = std::make_shared<EllipseEntity>(g);
        break;
    }
    case EntityType::Spline: {
        NurbsCurve c = static_cast<const SplineEntity&>(e).curve();
        c.ctrl[i] = to;
        out = std::make_shared<SplineEntity>(std::move(c));
        break;
    }
    case EntityType::Point:
    case EntityType::XLine:
    case EntityType::Text:
    case EntityType::Insert:
    case EntityType::Hatch:
        return translateAll();
    case EntityType::Dimension: {
        auto d = std::make_shared<DimensionEntity>(static_cast<const DimensionEntity&>(e));
        d->setPoint(i, to);
        out = d;
        break;
    }
    case EntityType::Leader: {
        auto l = std::make_shared<LeaderEntity>(static_cast<const LeaderEntity&>(e));
        l->setPoint(i, to);
        out = l;
        break;
    }
    }
    if (out) out->copyStyleFrom(e);
    return out;
}

CommandStatus GripCommand::point(CommandContext& ctx, const Vec2& p) {
    auto e = ctx.doc.findEntity(id_);
    if (!e) return CommandStatus::Cancelled;
    auto moved = withGripMoved(*e, grip_, p);
    if (!moved) { ctx.say("That grip cannot be moved there."); return CommandStatus::Continue; }
    ctx.doc.modifyWithUndo({{id_, moved}}, "Grip edit");
    return CommandStatus::Done;
}

void GripCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (!doc_) return;
    if (auto e = doc_->findEntity(id_))
        if (auto m = withGripMoved(*e, grip_, cursor)) out.push_back(m->clone());
}

PasteCommand::PasteCommand(std::vector<EntityPtr> ents) : ents_(std::move(ents)) {
    BoundingBox b;
    for (const auto& e : ents_) b.expand(e->bounds());
    ref_ = b.isValid() ? b.min : Vec2{};
}

CommandStatus PasteCommand::start(CommandContext& ctx) {
    if (ents_.empty()) { ctx.say("The clipboard has no DYNAMIC CAD objects."); return CommandStatus::Cancelled; }
    return CommandStatus::Continue;
}

CommandStatus PasteCommand::point(CommandContext& ctx, const Vec2& p) {
    std::vector<EntityPtr> placed;
    for (const auto& e : ents_)
        if (auto t = e->transformed(Affine2D::translation(p - ref_))) placed.push_back(EntityPtr(std::move(t)));
    const std::size_t n = placed.size();
    ctx.doc.addWithUndo(std::move(placed), "Paste");
    ctx.selection.clear();
    ctx.say(std::to_string(n) + (n == 1 ? " object pasted." : " objects pasted."));
    return CommandStatus::Done;
}

void PasteCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    std::size_t n = 0;
    for (const auto& e : ents_) {
        if (++n > 300) break;
        if (auto t = e->transformed(Affine2D::translation(cursor - ref_))) out.push_back(std::move(t));
    }
}

} // namespace dyncad
