// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"

#include <map>
#include <memory>
#include <string>
#include <vector>

namespace dyncad {

// A block definition: named group of entities in block-local coordinates
// (the base point is the local origin). Immutable once created: redefining a
// block creates a new definition.
struct BlockDef {
    std::string name;
    std::string description;
    std::vector<EntityPtr> entities;
};
using BlockDefPtr = std::shared_ptr<const BlockDef>;

// Block reference (INSERT). Draws the block's entities transformed by
// position, scale and rotation. Entities on layer "0" take the insert's layer
// and ByBlock properties take the insert's properties (CAD convention).
class InsertEntity final : public Entity {
public:
    InsertEntity(BlockDefPtr block, const Vec2& position, double sx = 1.0, double sy = 1.0, double rotationDeg = 0.0);
    InsertEntity(const InsertEntity& o);

    EntityType type() const override { return EntityType::Insert; }
    const char* typeName() const override { return "Block reference"; }
    BoundingBox bounds() const override;
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    std::vector<Vec2> gripPoints() const override { return {pos_}; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<InsertEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const BlockDefPtr& block() const { return block_; }
    void setBlock(BlockDefPtr b) { block_ = std::move(b); cache_.clear(); }
    const std::string& blockName() const;
    const Vec2& position() const { return pos_; }
    double scaleX() const { return sx_; }
    double scaleY() const { return sy_; }
    double rotationDeg() const { return rot_; }
    void setPosition(const Vec2& p) { pos_ = p; cache_.clear(); }
    void setScale(double sx, double sy) { if (sx != 0 && sy != 0) { sx_ = sx; sy_ = sy; cache_.clear(); } }
    void setRotation(double deg) { rot_ = deg; cache_.clear(); }
    Affine2D transform() const;

    // The block's entities in world coordinates with inherited properties
    // resolved (layer 0 -> insert layer, ByBlock -> insert values).
    const std::vector<EntityPtr>& worldEntities() const;
    // EXPLODE: world entities with their own (unresolved) properties.
    std::vector<EntityPtr> explode() const;

private:
    BlockDefPtr block_;
    Vec2 pos_;
    double sx_, sy_, rot_;
    mutable std::vector<EntityPtr> cache_;
    mutable EntityStyle cacheStyle_;
    mutable bool cacheValid_ = false;
};

// Entity mapped through xf; circles and arcs under non-uniform scaling become
// exact ellipses. nullptr if impossible.
std::unique_ptr<Entity> transformedOrEllipse(const Entity& e, const Affine2D& xf);

} // namespace dyncad
