// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"

#include <string>
#include <vector>

namespace dyncad {

// One family of parallel pattern lines (the DXF hatch pattern model):
// lines at 'angleDeg' through 'origin', repeated by 'offset', each line
// dashed by 'dashes' (positive dash, negative gap, 0 dot; empty = solid).
struct HatchLineFamily {
    double angleDeg = 0;
    Vec2 origin;
    Vec2 offset{0, 1};
    std::vector<double> dashes;
};

struct HatchPattern {
    std::string name = "SOLID";
    bool solid = true;
    double scale = 1.0;  // for regenerating built-in patterns
    double angle = 0.0;
    std::vector<HatchLineFamily> families; // world units (scale/angle applied)
};

// Built-in patterns (original definitions; names follow common CAD usage):
// SOLID, ANSI31 (general / iron), ANSI32 (steel), ANSI37 (cross), NET, LINE, DASH.
std::vector<std::string> builtinHatchNames();
HatchPattern makeHatchPattern(const std::string& name, double scale, double angleDeg);

// A closed boundary loop: polyline vertices with bulges (DXF convention).
struct HatchLoop {
    std::vector<Vec2> vertices;
    std::vector<double> bulges;
};

// Filled area bounded by loops (even-odd rule: inner loops are holes).
class HatchEntity final : public Entity {
public:
    HatchEntity(std::vector<HatchLoop> loops, HatchPattern pattern);

    EntityType type() const override { return EntityType::Hatch; }
    const char* typeName() const override { return "Hatch"; }
    BoundingBox bounds() const override;
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    std::vector<Vec2> gripPoints() const override;
    std::unique_ptr<Entity> clone() const override { return std::make_unique<HatchEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const std::vector<HatchLoop>& loops() const { return loops_; }
    const HatchPattern& pattern() const { return pattern_; }
    void setPattern(HatchPattern p) { pattern_ = std::move(p); cacheValid_ = false; }
    // Loops as closed point lists (arcs tessellated to tolerance).
    std::vector<std::vector<Vec2>> loopPolygons(double tolerance) const;
    bool contains(const Vec2& p) const; // even-odd
    double area() const;                // outer minus holes
    // Pattern line segments clipped to the boundary (empty for SOLID).
    // 'limit' caps the number of lines; truncated is set if it was hit.
    std::vector<std::pair<Vec2, Vec2>> patternSegments(std::size_t limit = 20000, bool* truncated = nullptr) const;

    // Cached pattern segments (geometry only; independent of the view).
    const std::vector<std::pair<Vec2, Vec2>>& cachedSegments(bool* truncated = nullptr) const;

private:
    std::vector<HatchLoop> loops_;
    HatchPattern pattern_;
    mutable std::vector<std::pair<Vec2, Vec2>> cache_;
    mutable bool cacheValid_ = false, cacheTruncated_ = false;
};

} // namespace dyncad
