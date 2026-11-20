// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "document/UndoStack.h"

namespace dyncad {

void UndoStack::push(std::unique_ptr<UndoCommand> cmd) {
    if (!cmd) return;
    if (index_ < commands_.size()) {
        commands_.erase(commands_.begin() + static_cast<std::ptrdiff_t>(index_), commands_.end());
        if (cleanIndex_ > static_cast<long long>(index_)) cleanIndex_ = -1;
    }
    cmd->redo();
    commands_.push_back(std::move(cmd));
    index_ = commands_.size();
}

void UndoStack::undo() {
    if (!canUndo()) return;
    --index_;
    commands_[index_]->undo();
}

void UndoStack::redo() {
    if (!canRedo()) return;
    commands_[index_]->redo();
    ++index_;
}

std::string UndoStack::undoText() const { return canUndo() ? commands_[index_ - 1]->text() : std::string(); }
std::string UndoStack::redoText() const { return canRedo() ? commands_[index_]->text() : std::string(); }

void UndoStack::clear() {
    commands_.clear();
    index_ = 0;
    cleanIndex_ = 0;
}

} // namespace dyncad
