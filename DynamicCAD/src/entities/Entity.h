// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/Affine2D.h"
#include "geometry/BoundingBox.h"
#include "geometry/Vec2.h"

#include <cstdint>
#include <memory>
#include <string>
#include <vector>

namespace dyncad {

using EntityId = std::uint64_t;
inline constexpr EntityId kInvalidEntityId = 0;

enum class EntityType { Line, Circle, Arc, Polyline, Point };

// Base class for every drawing object. Entities hold geometry in world units
// (double precision) and know how to answer the hit-testing questions used by
// selection. Rendering lives in the canvas layer so entities stay GUI-free.
class Entity {
public:
    virtual ~Entity() = default;

    virtual EntityType type() const = 0;
    virtual const char* typeName() const = 0;
    virtual BoundingBox bounds() const = 0;
    // Shortest distance from p to the entity's curve.
    virtual double distanceTo(const Vec2& p) const = 0;
    // True if any part of the curve lies within rect (crossing selection).
    virtual bool crossesRect(const BoundingBox& rect) const = 0;
    // Characteristic points (endpoints, centres, vertices) shown as grips.
    virtual std::vector<Vec2> gripPoints() const = 0;
    virtual std::unique_ptr<Entity> clone() const = 0;
    // Copy of the entity mapped through xf, or nullptr if the result cannot be
    // represented exactly by this entity type (e.g. a circle under non-uniform
    // scaling, which would become an ellipse).
    virtual std::unique_ptr<Entity> transformed(const Affine2D& xf) const = 0;

    // True if the entity lies entirely within rect (window selection).
    bool insideRect(const BoundingBox& rect) const { return rect.contains(bounds()); }

    EntityId id() const { return id_; }
    void setId(EntityId id) { id_ = id; }
    const std::string& layer() const { return layer_; }
    void setLayer(std::string layer) { layer_ = std::move(layer); }

protected:
    Entity() = default;
    Entity(const Entity&) = default;
    Entity& operator=(const Entity&) = default;

private:
    EntityId id_ = kInvalidEntityId;
    std::string layer_ = "0";
};

using EntityPtr = std::shared_ptr<Entity>;

} // namespace dyncad
