// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "document/Document.h"

#include "document/EditCommands.h"

namespace dyncad {

EntityPtr Document::findEntity(EntityId id) const {
    auto it = index_.find(id);
    return it == index_.end() ? nullptr : it->second;
}

BoundingBox Document::extents() const {
    BoundingBox box;
    for (const auto& e : entities_) box.expand(e->bounds());
    return box;
}

EntityId Document::assignId(Entity& e) {
    if (e.id() == kInvalidEntityId || index_.count(e.id())) e.setId(nextId_++);
    else if (e.id() >= nextId_) nextId_ = e.id() + 1;
    return e.id();
}

void Document::addWithUndo(std::vector<EntityPtr> entities, const std::string& description) {
    if (entities.empty()) return;
    undo_.push(std::make_unique<AddEntitiesCommand>(*this, std::move(entities), description));
}

std::size_t Document::eraseWithUndo(const std::vector<EntityId>& ids) {
    std::unordered_set<EntityId> existing;
    for (EntityId id : ids)
        if (index_.count(id)) existing.insert(id);
    if (existing.empty()) return 0;
    const std::size_t n = existing.size();
    undo_.push(std::make_unique<EraseEntitiesCommand>(*this, std::move(existing)));
    return n;
}

void Document::modifyWithUndo(std::vector<std::pair<EntityId, EntityPtr>> repl, const std::string& description) {
    std::vector<std::pair<EntityId, EntityPtr>> valid;
    for (auto& r : repl)
        if (r.second && index_.count(r.first)) valid.push_back(std::move(r));
    if (valid.empty()) return;
    undo_.push(std::make_unique<ModifyEntitiesCommand>(*this, std::move(valid), description));
}

void Document::changeWithUndo(const std::vector<EntityId>& erase, std::vector<EntityPtr> add, const std::string& description) {
    std::unordered_set<EntityId> existing;
    for (EntityId id : erase)
        if (index_.count(id)) existing.insert(id);
    if (existing.empty() && add.empty()) return;
    auto group = std::make_unique<CompositeCommand>(*this, description);
    if (!existing.empty()) group->add(std::make_unique<EraseEntitiesCommand>(*this, std::move(existing)));
    if (!add.empty()) group->add(std::make_unique<AddEntitiesCommand>(*this, std::move(add), description));
    undo_.push(std::move(group));
}

std::vector<std::pair<EntityId, EntityPtr>> Document::swapEntities(const std::vector<std::pair<EntityId, EntityPtr>>& repl) {
    std::unordered_map<EntityId, EntityPtr> next;
    for (const auto& [id, e] : repl) next[id] = e;
    std::unordered_map<EntityId, EntityPtr> prev;
    for (auto& slot : entities_) { // one pass: O(n) for any number of replacements
        auto it = next.find(slot->id());
        if (it == next.end()) continue;
        prev[slot->id()] = slot;
        it->second->setId(slot->id());
        slot = it->second;
        index_[slot->id()] = slot;
    }
    std::vector<std::pair<EntityId, EntityPtr>> out;
    for (const auto& [id, e] : repl) {
        auto it = prev.find(id);
        if (it != prev.end()) out.emplace_back(id, it->second);
    }
    return out;
}

void Document::reset(std::vector<EntityPtr> entities, std::string units) {
    entities_.clear();
    index_.clear();
    nextId_ = 1;
    undo_.clear();
    units_ = std::move(units);
    for (auto& e : entities) {
        if (!e) continue;
        e->setId(kInvalidEntityId);
        assignId(*e);
        index_[e->id()] = e;
        entities_.push_back(std::move(e));
    }
    notifyChanged();
}

void Document::appendEntities(const std::vector<EntityPtr>& entities) {
    for (const auto& e : entities) {
        assignId(*e);
        index_[e->id()] = e;
        entities_.push_back(e);
    }
}

std::vector<Document::IndexedEntity> Document::removeEntities(const std::unordered_set<EntityId>& ids) {
    std::vector<IndexedEntity> removed;
    std::vector<EntityPtr> kept;
    kept.reserve(entities_.size());
    for (std::size_t i = 0; i < entities_.size(); ++i) {
        if (ids.count(entities_[i]->id())) {
            index_.erase(entities_[i]->id());
            removed.emplace_back(i, entities_[i]);
        } else {
            kept.push_back(entities_[i]);
        }
    }
    entities_.swap(kept);
    return removed;
}

void Document::restoreEntities(const std::vector<IndexedEntity>& removed) {
    // Linear merge: restores the original draw order in O(n + k).
    std::vector<EntityPtr> merged;
    merged.reserve(entities_.size() + removed.size());
    std::size_t src = 0;
    for (const auto& [idx, ent] : removed) {
        while (merged.size() < idx && src < entities_.size()) merged.push_back(entities_[src++]);
        merged.push_back(ent);
        index_[ent->id()] = ent;
    }
    while (src < entities_.size()) merged.push_back(entities_[src++]);
    entities_.swap(merged);
}

int Document::addListener(Listener listener) {
    const int h = nextListener_++;
    listeners_[h] = std::move(listener);
    return h;
}

void Document::removeListener(int handle) { listeners_.erase(handle); }

void Document::notifyChanged() {
    // Copy so listeners may add/remove listeners while being notified.
    const auto copy = listeners_;
    for (const auto& [h, fn] : copy)
        if (fn) fn();
}

} // namespace dyncad
