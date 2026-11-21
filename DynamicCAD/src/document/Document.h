// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/UndoStack.h"
#include "entities/Entity.h"
#include "layers/LayerTable.h"

#include <functional>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

namespace dyncad {

// A drawing: ordered entity list (draw order), id index, undo history and
// drawing-wide settings. All user edits go through the *WithUndo methods.
class Document {
public:
    using Listener = std::function<void()>;
    using IndexedEntity = std::pair<std::size_t, EntityPtr>; // original index + entity

    Document() = default;
    Document(const Document&) = delete;
    Document& operator=(const Document&) = delete;

    // ---- Queries ----
    const std::vector<EntityPtr>& entities() const { return entities_; }
    std::size_t entityCount() const { return entities_.size(); }
    EntityPtr findEntity(EntityId id) const;
    BoundingBox extents() const;

    // ---- Undoable edits ----
    void addWithUndo(std::vector<EntityPtr> entities, const std::string& description);
    // Returns the number of entities actually erased.
    std::size_t eraseWithUndo(const std::vector<EntityId>& ids);
    // Replaces entities in place (same id, same draw order), e.g. MOVE / ROTATE.
    void modifyWithUndo(std::vector<std::pair<EntityId, EntityPtr>> replacements, const std::string& description);
    // Erases some entities and adds others as ONE undo step (TRIM, EXPLODE, JOIN...).
    void changeWithUndo(const std::vector<EntityId>& erase, std::vector<EntityPtr> add, const std::string& description);

    UndoStack& undoStack() { return undo_; }
    const UndoStack& undoStack() const { return undo_; }
    void undo() { undo_.undo(); }
    void redo() { undo_.redo(); }

    bool isModified() const { return !undo_.isClean(); }
    void markSaved() { undo_.setClean(); notifyChanged(); }

    // Replaces the whole drawing (used by New/Open). Clears undo history.
    void reset(std::vector<EntityPtr> entities = {}, std::string units = "mm", StyleTables styles = StyleTables());

    const std::string& units() const { return units_; }

    // ---- Layers, linetypes and effective display properties ----
    const StyleTables& styles() const { return styles_; }
    // Replaces the layer/linetype tables as one undo step (layer manager edits).
    void setStylesWithUndo(StyleTables tables, const std::string& description);
    void setStylesNoUndo(StyleTables tables) { styles_ = std::move(tables); notifyChanged(); }
    // Renames a layer and every object on it (one undo step).
    bool renameLayerWithUndo(const std::string& from, const std::string& to);
    // Deletes an unused layer (not "0", not current). Returns false otherwise.
    bool deleteLayerWithUndo(const std::string& name);
    std::size_t countOnLayer(const std::string& name) const;
    struct Resolved {
        std::uint32_t rgb = 0xFFFFFF;
        bool foreground = true;              // colour 7: drawn in the theme's foreground colour
        const Linetype* linetype = nullptr;  // nullptr = continuous
        double ltscale = 1.0;                // global x entity
        int lineweight = kLwDefaultValue;    // 1/100 mm
        bool visible = true;                 // layer on and thawed
        bool locked = false;
    };
    Resolved resolve(const Entity& e) const;
    bool isVisible(const Entity& e) const;
    bool isSelectable(const Entity& e) const; // visible and not on a locked layer

    // ---- Low level (used by undo commands; do not call from UI) ----
    void appendEntities(const std::vector<EntityPtr>& entities);
    std::vector<IndexedEntity> removeEntities(const std::unordered_set<EntityId>& ids);
    void restoreEntities(const std::vector<IndexedEntity>& removed); // must be sorted by index
    // Swaps entity objects in place; returns the previous objects (same order as input).
    std::vector<std::pair<EntityId, EntityPtr>> swapEntities(const std::vector<std::pair<EntityId, EntityPtr>>& repl);

    // ---- Change notification ----
    int addListener(Listener listener);
    void removeListener(int handle);
    void notifyChanged();

private:
    EntityId assignId(Entity& e);

    std::vector<EntityPtr> entities_;
    std::unordered_map<EntityId, EntityPtr> index_;
    EntityId nextId_ = 1;
    UndoStack undo_;
    std::string units_ = "mm";
    StyleTables styles_;
    std::map<int, Listener> listeners_;
    int nextListener_ = 1;
};

} // namespace dyncad
