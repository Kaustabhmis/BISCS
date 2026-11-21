// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

#include <cstdint>
#include <optional>
#include <string>

namespace dyncad {

enum SnapMode : std::uint32_t {
    SnapEndpoint = 1u << 0,
    SnapMidpoint = 1u << 1,
    SnapCenter = 1u << 2,
    SnapQuadrant = 1u << 3,
    SnapIntersection = 1u << 4,
    SnapPerpendicular = 1u << 5,
    SnapTangent = 1u << 6,
    SnapNearest = 1u << 7,
    SnapNode = 1u << 8,
    SnapAll = (1u << 9) - 1,
};

// Default running snaps: endpoint, midpoint, centre, quadrant, intersection, node.
inline constexpr std::uint32_t kDefaultSnapModes =
    SnapEndpoint | SnapMidpoint | SnapCenter | SnapQuadrant | SnapIntersection | SnapNode;

struct SnapResult {
    Vec2 point;
    SnapMode mode;
    EntityId entity = kInvalidEntityId;
};

const char* snapModeName(SnapMode m);
// "END", "MID", ... -> mode (one-shot override typed at a point prompt).
std::optional<SnapMode> snapModeFromKeyword(const std::string& kw);

// Finds the best object snap near the cursor.
//   aperture : search radius in world units (pixels / scale)
//   base     : current base point (enables PERpendicular and TANgent)
class SnapEngine {
public:
    std::optional<SnapResult> find(const Document& doc, const Vec2& cursor, double aperture, std::uint32_t modes,
                                   const std::optional<Vec2>& base = std::nullopt) const;
};

// Polar tracking: if the direction base->cursor is within tolPixels-equivalent
// (tolWorld perpendicular distance) of a multiple of incrementDeg, returns the
// cursor projected onto that ray and the angle in degrees.
struct PolarResult {
    Vec2 point;
    double angleDeg;
};
std::optional<PolarResult> polarTrack(const Vec2& base, const Vec2& cursor, double incrementDeg, double tolWorld);

} // namespace dyncad
