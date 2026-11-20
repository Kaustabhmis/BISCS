// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "canvas/ViewTransform.h"

#include <algorithm>

namespace dyncad {

void ViewTransform::setView(const Vec2& center, double scale) {
    center_ = center;
    scale_ = std::clamp(scale, kMinScale, kMaxScale);
}

Vec2 ViewTransform::worldToScreen(const Vec2& p) const {
    return {(p.x - center_.x) * scale_ + w_ * 0.5, h_ * 0.5 - (p.y - center_.y) * scale_};
}

Vec2 ViewTransform::screenToWorld(const Vec2& s) const {
    return {center_.x + (s.x - w_ * 0.5) / scale_, center_.y + (h_ * 0.5 - s.y) / scale_};
}

void ViewTransform::zoomAt(const Vec2& screenPt, double factor) {
    if (!(factor > 0.0)) return;
    const Vec2 anchor = screenToWorld(screenPt);
    scale_ = std::clamp(scale_ * factor, kMinScale, kMaxScale);
    center_ = {anchor.x - (screenPt.x - w_ * 0.5) / scale_, anchor.y + (screenPt.y - h_ * 0.5) / scale_};
}

void ViewTransform::panByPixels(double dx, double dy) {
    center_.x -= dx / scale_;
    center_.y += dy / scale_;
}

void ViewTransform::fitTo(const BoundingBox& box, double marginFraction) {
    if (!box.isValid()) return;
    center_ = box.center();
    const double usableW = w_ * (1.0 - 2.0 * marginFraction);
    const double usableH = h_ * (1.0 - 2.0 * marginFraction);
    const double bw = box.width(), bh = box.height();
    double s;
    if (bw <= 0.0 && bh <= 0.0) s = scale_;
    else if (bw <= 0.0) s = usableH / bh;
    else if (bh <= 0.0) s = usableW / bw;
    else s = std::min(usableW / bw, usableH / bh);
    scale_ = std::clamp(s, kMinScale, kMaxScale);
}

BoundingBox ViewTransform::visibleWorldRect() const {
    return {screenToWorld({0.0, h_}), screenToWorld({w_, 0.0})};
}

} // namespace dyncad
