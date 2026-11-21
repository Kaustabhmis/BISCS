// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

namespace dyncad {

class AddEntitiesCommand final : public UndoCommand {
public:
    AddEntitiesCommand(Document& doc, std::vector<EntityPtr> entities, std::string description)
        : doc_(doc), entities_(std::move(entities)), text_(std::move(description)) {}
    void redo() override;
    void undo() override;
    std::string text() const override { return text_; }

private:
    Document& doc_;
    std::vector<EntityPtr> entities_;
    std::string text_;
};

class EraseEntitiesCommand final : public UndoCommand {
public:
    EraseEntitiesCommand(Document& doc, std::unordered_set<EntityId> ids) : doc_(doc), ids_(std::move(ids)) {}
    void redo() override;
    void undo() override;
    std::string text() const override { return "Erase"; }

private:
    Document& doc_;
    std::unordered_set<EntityId> ids_;
    std::vector<Document::IndexedEntity> removed_;
};

// Replaces entity objects in place (keeps ids and draw order).
class ModifyEntitiesCommand final : public UndoCommand {
public:
    ModifyEntitiesCommand(Document& doc, std::vector<std::pair<EntityId, EntityPtr>> repl, std::string text)
        : doc_(doc), other_(std::move(repl)), text_(std::move(text)) {}
    void redo() override { other_ = doc_.swapEntities(other_); doc_.notifyChanged(); }
    void undo() override { other_ = doc_.swapEntities(other_); doc_.notifyChanged(); }
    std::string text() const override { return text_; }

private:
    Document& doc_;
    std::vector<std::pair<EntityId, EntityPtr>> other_; // the version not currently in the document
    std::string text_;
};

// Several commands applied and undone as one step.
class CompositeCommand final : public UndoCommand {
public:
    CompositeCommand(Document&, std::string text) : text_(std::move(text)) {}
    void add(std::unique_ptr<UndoCommand> c) { parts_.push_back(std::move(c)); }
    void redo() override { for (auto& c : parts_) c->redo(); }
    void undo() override { for (auto it = parts_.rbegin(); it != parts_.rend(); ++it) (*it)->undo(); }
    std::string text() const override { return text_; }

private:
    std::vector<std::unique_ptr<UndoCommand>> parts_;
    std::string text_;
};

} // namespace dyncad
