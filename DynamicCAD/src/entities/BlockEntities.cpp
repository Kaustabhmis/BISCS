// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/BlockEntities.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"

#include <cmath>
#include <limits>

namespace dyncad {

std::unique_ptr<Entity> transformedOrEllipse(const Entity& e, const Affine2D& xf) {
    auto t = e.transformed(xf);
    if (t) return t;
    std::optional<EllipseGeom> g;
    if (e.type() == EntityType::Circle) {
        const auto& c = static_cast<const CircleEntity&>(e);
        g = EllipseGeom{c.center(), {c.radius(), 0}, 1.0, 0.0, 2.0 * kPi};
    } else if (e.type() == EntityType::Arc) {
        const auto& a = static_cast<const ArcEntity&>(e);
        const ArcGeom ag = a.geom();
        g = EllipseGeom{a.center(), {a.radius(), 0}, 1.0, ag.startAngle, ag.startAngle + ag.sweep};
    }
    if (!g) return nullptr;
    EllipseEntity el(*g);
    el.copyStyleFrom(e);
    return el.transformed(xf);
}

InsertEntity::InsertEntity(BlockDefPtr block, const Vec2& position, double sx, double sy, double rotationDeg)
    : block_(std::move(block)), pos_(position), sx_(sx != 0 ? sx : 1.0), sy_(sy != 0 ? sy : 1.0), rot_(rotationDeg) {}

// The cache is never copied: a clone may get different properties.
InsertEntity::InsertEntity(const InsertEntity& o)
    : Entity(o), block_(o.block_), pos_(o.pos_), sx_(o.sx_), sy_(o.sy_), rot_(o.rot_) {}

const std::string& InsertEntity::blockName() const {
    static const std::string empty;
    return block_ ? block_->name : empty;
}

Affine2D InsertEntity::transform() const {
    return Affine2D::translation(pos_) * Affine2D::rotationDeg(rot_) * Affine2D::scaling(sx_, sy_);
}

const std::vector<EntityPtr>& InsertEntity::worldEntities() const {
    if (cacheValid_ && cacheStyle_ == style()) return cache_;
    cache_.clear();
    if (block_) {
        const Affine2D xf = transform();
        const EntityStyle& ins = style();
        for (const auto& e : block_->entities) {
            auto t = transformedOrEllipse(*e, xf);
            if (!t) continue;
            EntityStyle st = e->style();
            if (st.layer.empty() || st.layer == "0") st.layer = ins.layer;
            if (st.color.kind == CadColor::Kind::ByBlock) st.color = ins.color;
            if (sameName(st.linetype, "BYBLOCK")) st.linetype = ins.linetype;
            if (st.lineweight == kLwByBlock) st.lineweight = ins.lineweight;
            t->setStyle(st);
            cache_.push_back(EntityPtr(std::move(t)));
        }
    }
    cacheStyle_ = style();
    cacheValid_ = true;
    return cache_;
}

std::vector<EntityPtr> InsertEntity::explode() const {
    std::vector<EntityPtr> out;
    if (!block_) return out;
    const Affine2D xf = transform();
    for (const auto& e : block_->entities)
        if (auto t = transformedOrEllipse(*e, xf)) {
            if (t->layer().empty()) t->setLayer("0");
            out.push_back(EntityPtr(std::move(t)));
        }
    return out;
}

BoundingBox InsertEntity::bounds() const {
    BoundingBox b;
    for (const auto& e : worldEntities())
        if (!e->isInfinite()) b.expand(e->bounds());
    if (!b.isValid()) b.expand(pos_);
    return b;
}

double InsertEntity::distanceTo(const Vec2& p) const {
    double d = std::numeric_limits<double>::infinity();
    for (const auto& e : worldEntities()) d = std::min(d, e->distanceTo(p));
    return d;
}

bool InsertEntity::crossesRect(const BoundingBox& r) const {
    for (const auto& e : worldEntities())
        if (e->crossesRect(r)) return true;
    return false;
}

std::unique_ptr<Entity> InsertEntity::transformed(const Affine2D& xf) const {
    // New transform = xf * current; decompose into position, rotation, scale.
    const Affine2D m = xf * transform();
    const double sx = std::hypot(m.a, m.b);
    double sy = std::hypot(m.c, m.d);
    if (!(sx > 0) || !(sy > 0)) return nullptr;
    if (std::abs(m.a * m.c + m.b * m.d) > 1e-9 * sx * sy) return nullptr; // shear: not representable
    if (m.det() < 0) sy = -sy;                                              // mirrored: negative Y scale
    auto out = std::make_unique<InsertEntity>(*this);
    out->pos_ = {m.tx, m.ty};
    out->rot_ = radToDeg(std::atan2(m.b, m.a));
    if (std::abs(out->rot_ - std::round(out->rot_)) < 1e-9) out->rot_ = std::round(out->rot_);
    out->sx_ = sx;
    out->sy_ = sy;
    return out;
}

} // namespace dyncad
