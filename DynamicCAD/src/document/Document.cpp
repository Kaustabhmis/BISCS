// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "document/Document.h"

#include "document/EditCommands.h"

#include <set>

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

void Document::reset(std::vector<EntityPtr> entities, std::string units, StyleTables styles, BlockTable blocks) {
    blocks_ = std::move(blocks);
    entities_.clear();
    index_.clear();
    nextId_ = 1;
    undo_.clear();
    units_ = std::move(units);
    styles_ = std::move(styles);
    for (auto& e : entities) {
        if (!e) continue;
        if (e->layer().empty()) e->setLayer("0");
        if (!styles_.hasLayer(e->layer())) { Layer l; l.name = e->layer(); styles_.addLayer(l); }
        e->setId(kInvalidEntityId);
        assignId(*e);
        index_[e->id()] = e;
        entities_.push_back(std::move(e));
    }
    notifyChanged();
}

void Document::appendEntities(const std::vector<EntityPtr>& entities) {
    for (const auto& e : entities) {
        // New geometry goes on the current layer; foreign layers are created.
        if (e->layer().empty()) e->setLayer(styles_.currentLayer());
        if (!styles_.hasLayer(e->layer())) {
            Layer l;
            l.name = e->layer();
            if (!styles_.addLayer(l)) e->setLayer("0");
        }
        if (e->type() == EntityType::Insert) { // pasted/imported block references bring their definition
            const auto& b = static_cast<const InsertEntity&>(*e).block();
            if (b && !blocks_.count(upperName(b->name))) blocks_[upperName(b->name)] = b;
        }
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

namespace {
class StylesCommand final : public UndoCommand {
public:
    StylesCommand(Document& doc, StyleTables t, std::string text) : doc_(doc), other_(std::move(t)), text_(std::move(text)) {}
    void redo() override { swap(); }
    void undo() override { swap(); }
    std::string text() const override { return text_; }

private:
    void swap() {
        StyleTables cur = doc_.styles();
        doc_.setStylesNoUndo(other_);
        other_ = std::move(cur);
    }
    Document& doc_;
    StyleTables other_;
    std::string text_;
};
} // namespace

void Document::setStylesWithUndo(StyleTables tables, const std::string& description) {
    if (tables == styles_) return;
    undo_.push(std::make_unique<StylesCommand>(*this, std::move(tables), description));
}

std::size_t Document::countOnLayer(const std::string& name) const {
    std::size_t n = 0;
    for (const auto& e : entities_)
        if (sameName(e->layer(), name.c_str())) ++n;
    return n;
}

bool Document::renameLayerWithUndo(const std::string& from, const std::string& to) {
    StyleTables t = styles_;
    if (!t.renameLayer(from, to)) return false;
    std::vector<std::pair<EntityId, EntityPtr>> repl;
    for (const auto& e : entities_)
        if (sameName(e->layer(), from.c_str())) {
            EntityPtr c(e->clone());
            c->setLayer(to);
            repl.emplace_back(e->id(), c);
        }
    auto group = std::make_unique<CompositeCommand>(*this, "Rename layer");
    group->add(std::make_unique<StylesCommand>(*this, std::move(t), "Rename layer"));
    if (!repl.empty()) group->add(std::make_unique<ModifyEntitiesCommand>(*this, std::move(repl), "Rename layer"));
    undo_.push(std::move(group));
    return true;
}

bool Document::deleteLayerWithUndo(const std::string& name) {
    if (countOnLayer(name) > 0) return false;
    StyleTables t = styles_;
    if (!t.removeLayer(name)) return false;
    setStylesWithUndo(std::move(t), "Delete layer");
    return true;
}

namespace {
class BlocksCommand final : public UndoCommand {
public:
    BlocksCommand(Document& doc, Document::BlockTable t, std::string text) : doc_(doc), other_(std::move(t)), text_(std::move(text)) {}
    void redo() override { swap(); }
    void undo() override { swap(); }
    std::string text() const override { return text_; }

private:
    void swap() {
        Document::BlockTable cur = doc_.blocks();
        doc_.setBlocksNoUndo(other_);
        other_ = std::move(cur);
    }
    Document& doc_;
    Document::BlockTable other_;
    std::string text_;
};

void collectUsedBlocks(const Entity& e, std::set<std::string>& used) {
    if (e.type() != EntityType::Insert) return;
    const auto& ins = static_cast<const InsertEntity&>(e);
    if (!ins.block() || !used.insert(upperName(ins.block()->name)).second) return;
    for (const auto& sub : ins.block()->entities) collectUsedBlocks(*sub, used);
}
} // namespace

BlockDefPtr Document::findBlock(const std::string& name) const {
    auto it = blocks_.find(upperName(name));
    return it == blocks_.end() ? nullptr : it->second;
}

void Document::defineBlockWithUndo(BlockDefPtr block, const std::vector<EntityId>& erase, std::vector<EntityPtr> add) {
    BlockTable t = blocks_;
    t[upperName(block->name)] = block;
    auto group = std::make_unique<CompositeCommand>(*this, "Block");
    group->add(std::make_unique<BlocksCommand>(*this, std::move(t), "Block"));
    std::unordered_set<EntityId> existing;
    for (EntityId id : erase) if (index_.count(id)) existing.insert(id);
    if (!existing.empty()) group->add(std::make_unique<EraseEntitiesCommand>(*this, std::move(existing)));
    if (!add.empty()) group->add(std::make_unique<AddEntitiesCommand>(*this, std::move(add), "Block"));
    undo_.push(std::move(group));
}

std::vector<std::string> Document::purgeBlocksWithUndo() {
    std::set<std::string> used;
    for (const auto& e : entities_) collectUsedBlocks(*e, used);
    BlockTable t;
    std::vector<std::string> removed;
    for (const auto& [k, b] : blocks_) {
        if (used.count(k)) t[k] = b;
        else removed.push_back(b->name);
    }
    if (!removed.empty()) undo_.push(std::make_unique<BlocksCommand>(*this, std::move(t), "Purge"));
    return removed;
}

Document::Resolved Document::resolve(const Entity& e) const {
    Resolved r;
    const Layer* layer = styles_.layer(e.layer().empty() ? styles_.currentLayer() : e.layer());
    static const Layer kDefault{"0"};
    if (!layer) layer = &kDefault;
    r.visible = layer->visible();
    r.locked = layer->locked;
    CadColor c = e.color();
    if (c.kind == CadColor::Kind::ByLayer) c = layer->color;
    if (c.kind == CadColor::Kind::ByBlock || c.kind == CadColor::Kind::ByLayer) c = CadColor::fromIndex(7);
    r.foreground = c.isForeground();
    r.rgb = c.kind == CadColor::Kind::Rgb ? c.rgb : colorIndexToRgb(c.index);
    const std::string& lt = sameName(e.linetype(), "BYLAYER") ? layer->linetype : e.linetype();
    if (sameName(lt, "BYBLOCK") || sameName(lt, "CONTINUOUS")) r.linetype = nullptr;
    else {
        r.linetype = styles_.linetype(lt);
        if (r.linetype && r.linetype->pattern.empty()) r.linetype = nullptr;
    }
    r.ltscale = styles_.ltscale() * e.ltscale();
    int lw = e.lineweight();
    if (lw == kLwByLayer) lw = layer->lineweight;
    if (lw < 0) lw = kLwDefaultValue;
    r.lineweight = lw;
    return r;
}

bool Document::isVisible(const Entity& e) const {
    const Layer* l = styles_.layer(e.layer());
    return !l || l->visible();
}

bool Document::isSelectable(const Entity& e) const {
    const Layer* l = styles_.layer(e.layer());
    return !l || (l->visible() && !l->locked);
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
