// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/Affine2D.h"
#include "geometry/BoundingBox.h"
#include "layers/Style.h"
#include "geometry/Vec2.h"

#include <cstdint>
#include <memory>
#include <string>
#include <vector>

namespace dyncad {

using EntityId = std::uint64_t;
inline constexpr EntityId kInvalidEntityId = 0;

// Display properties of an entity. An empty layer means "the current layer"
// and is filled in when the entity is added to a drawing.
struct EntityStyle {
    std::string layer;
    CadColor color = CadColor::byLayer();
    std::string linetype = kByLayer;
    int lineweight = kLwByLayer;
    double ltscale = 1.0;
    bool operator==(const EntityStyle& o) const {
        return layer == o.layer && color == o.color && upperName(linetype) == upperName(o.linetype) &&
               lineweight == o.lineweight && ltscale == o.ltscale;
    }
};

enum class EntityType { Line, Circle, Arc, Polyline, Point, Ellipse, Spline, XLine, Text, Dimension, Leader };

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
    virtual bool insideRect(const BoundingBox& rect) const { return rect.contains(bounds()); }
    // Infinite entities (XLINE/RAY) are drawn without view culling and their
    // bounds() cover only their base point (used for zoom extents).
    virtual bool isInfinite() const { return false; }

    EntityId id() const { return id_; }
    void setId(EntityId id) { id_ = id; }
    const std::string& layer() const { return style_.layer; }
    void setLayer(std::string layer) { style_.layer = std::move(layer); }
    const EntityStyle& style() const { return style_; }
    void setStyle(const EntityStyle& s) { style_ = s; }
    // Copies layer, colour, linetype, lineweight and linetype scale.
    void copyStyleFrom(const Entity& o) { style_ = o.style_; }
    const CadColor& color() const { return style_.color; }
    void setColor(const CadColor& c) { style_.color = c; }
    const std::string& linetype() const { return style_.linetype; }
    void setLinetype(std::string lt) { style_.linetype = std::move(lt); }
    int lineweight() const { return style_.lineweight; }
    void setLineweight(int lw) { style_.lineweight = lw; }
    double ltscale() const { return style_.ltscale; }
    void setLtscale(double s) { if (s > 0) style_.ltscale = s; }

protected:
    Entity() = default;
    Entity(const Entity&) = default;
    Entity& operator=(const Entity&) = default;

private:
    EntityId id_ = kInvalidEntityId;
    EntityStyle style_;
};

using EntityPtr = std::shared_ptr<Entity>;

} // namespace dyncad
