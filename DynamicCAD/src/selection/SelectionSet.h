// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

#include <functional>
#include <unordered_set>
#include <vector>

namespace dyncad {

// Set of selected entity ids, preserving selection order.
class SelectionSet {
public:
    bool contains(EntityId id) const { return set_.count(id) != 0; }
    bool empty() const { return order_.empty(); }
    std::size_t size() const { return order_.size(); }
    const std::vector<EntityId>& ids() const { return order_; }

    void add(EntityId id);
    void add(const std::vector<EntityId>& ids);
    void remove(EntityId id);
    void remove(const std::vector<EntityId>& ids);
    void clear();
    // Drops ids that no longer exist in the document (e.g. after undo).
    void prune(const Document& doc);

    std::function<void()> onChanged;

private:
    void changed() { if (onChanged) onChanged(); }
    std::vector<EntityId> order_;
    std::unordered_set<EntityId> set_;
};

enum class RectSelectMode {
    Window,   // entity must lie completely inside (drag left-to-right)
    Crossing  // entity touching the rectangle is enough (drag right-to-left)
};

// Returns the entity closest to p within tolerance (world units), or 0.
// Ties resolve to the most recently drawn (top-most) entity.
EntityId pickEntity(const Document& doc, const Vec2& p, double tolerance);
std::vector<EntityId> selectInRect(const Document& doc, const BoundingBox& rect, RectSelectMode mode);

} // namespace dyncad
