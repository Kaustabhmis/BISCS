// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/ArcEntity.h"

#include "geometry/Geometry.h"

namespace dyncad {

std::vector<Vec2> ArcEntity::gripPoints() const {
    const ArcGeom g = geom();
    return {g.startPoint(), g.pointAtAngle(g.startAngle + g.sweep / 2.0), g.endPoint(), center_};
}

std::unique_ptr<Entity> ArcEntity::transformed(const Affine2D& xf) const {
    if (!xf.isSimilarity()) return nullptr;
    const ArcGeom g = geom();
    const Vec2 c = xf.apply(center_);
    const Vec2 s = xf.apply(g.startPoint()), e = xf.apply(g.endPoint());
    double a0 = geom::angleDeg(c, s), a1 = geom::angleDeg(c, e);
    if (xf.det() < 0) std::swap(a0, a1); // mirroring reverses direction; keep CCW
    auto out = std::make_unique<ArcEntity>(c, radius_ * xf.uniformScale(), a0, a1);
    out->setLayer(layer());
    return out;
}

std::unique_ptr<Entity> PointEntity::transformed(const Affine2D& xf) const {
    auto out = std::make_unique<PointEntity>(xf.apply(pos_));
    out->setLayer(layer());
    return out;
}

} // namespace dyncad
