// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "selection/SelectionSet.h"

#include <algorithm>
#include <limits>

namespace dyncad {

void SelectionSet::add(EntityId id) {
    if (set_.insert(id).second) {
        order_.push_back(id);
        changed();
    }
}

void SelectionSet::add(const std::vector<EntityId>& ids) {
    bool any = false;
    for (EntityId id : ids)
        if (set_.insert(id).second) { order_.push_back(id); any = true; }
    if (any) changed();
}

void SelectionSet::remove(EntityId id) { remove(std::vector<EntityId>{id}); }

void SelectionSet::remove(const std::vector<EntityId>& ids) {
    bool any = false;
    for (EntityId id : ids) any |= set_.erase(id) > 0;
    if (!any) return;
    order_.erase(std::remove_if(order_.begin(), order_.end(), [this](EntityId id) { return !set_.count(id); }),
                 order_.end());
    changed();
}

void SelectionSet::clear() {
    if (order_.empty()) return;
    order_.clear();
    set_.clear();
    changed();
}

void SelectionSet::prune(const Document& doc) {
    std::vector<EntityId> gone;
    for (EntityId id : order_)
        if (!doc.findEntity(id)) gone.push_back(id);
    remove(gone);
}

EntityId pickEntity(const Document& doc, const Vec2& p, double tolerance) {
    EntityId best = kInvalidEntityId;
    double bestDist = std::numeric_limits<double>::infinity();
    const BoundingBox probe(p - Vec2{tolerance, tolerance}, p + Vec2{tolerance, tolerance});
    const auto& ents = doc.entities();
    for (auto it = ents.rbegin(); it != ents.rend(); ++it) {
        const Entity& e = **it;
        if (!probe.intersects(e.bounds())) continue; // cheap rejection
        const double d = e.distanceTo(p);
        if (d <= tolerance && d < bestDist) {
            bestDist = d;
            best = e.id();
        }
    }
    return best;
}

std::vector<EntityId> selectInRect(const Document& doc, const BoundingBox& rect, RectSelectMode mode) {
    std::vector<EntityId> out;
    if (!rect.isValid()) return out;
    for (const auto& e : doc.entities()) {
        const bool hit = mode == RectSelectMode::Window ? e->insideRect(rect) : e->crossesRect(rect);
        if (hit) out.push_back(e->id());
    }
    return out;
}

} // namespace dyncad
