// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/BoundingBox.h"

namespace dyncad {

// Maps world coordinates (Y up, drawing units) to screen pixels (Y down).
// Pure math with no Qt dependency so zoom/pan accuracy is unit-tested.
class ViewTransform {
public:
    static constexpr double kMinScale = 1e-6; // pixels per unit
    static constexpr double kMaxScale = 1e8;

    void setViewportSize(double width, double height) { w_ = width; h_ = height; }
    double viewportWidth() const { return w_; }
    double viewportHeight() const { return h_; }

    double scale() const { return scale_; }
    const Vec2& center() const { return center_; }
    void setView(const Vec2& center, double scale);

    Vec2 worldToScreen(const Vec2& w) const;
    Vec2 screenToWorld(const Vec2& s) const;
    double pixelsToWorld(double px) const { return px / scale_; }

    // Zooms by factor keeping the world point under screenPt fixed on screen.
    void zoomAt(const Vec2& screenPt, double factor);
    void panByPixels(double dx, double dy);
    // Fits box into the viewport leaving marginFraction free on each side.
    void fitTo(const BoundingBox& box, double marginFraction = 0.05);
    BoundingBox visibleWorldRect() const;

private:
    double w_ = 800.0, h_ = 600.0;
    double scale_ = 1.0;
    Vec2 center_;
};

} // namespace dyncad
