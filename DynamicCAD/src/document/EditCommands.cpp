// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "document/EditCommands.h"

namespace dyncad {

void AddEntitiesCommand::redo() {
    doc_.appendEntities(entities_);
    doc_.notifyChanged();
}

void AddEntitiesCommand::undo() {
    std::unordered_set<EntityId> ids;
    for (const auto& e : entities_) ids.insert(e->id());
    doc_.removeEntities(ids);
    doc_.notifyChanged();
}

void EraseEntitiesCommand::redo() {
    removed_ = doc_.removeEntities(ids_);
    doc_.notifyChanged();
}

void EraseEntitiesCommand::undo() {
    doc_.restoreEntities(removed_);
    removed_.clear();
    doc_.notifyChanged();
}

} // namespace dyncad
