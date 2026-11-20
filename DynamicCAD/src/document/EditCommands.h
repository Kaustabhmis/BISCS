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

} // namespace dyncad
