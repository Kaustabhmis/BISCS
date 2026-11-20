// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include <memory>
#include <string>
#include <vector>

namespace dyncad {

// Command pattern: every document modification is an UndoCommand.
class UndoCommand {
public:
    virtual ~UndoCommand() = default;
    virtual void redo() = 0;
    virtual void undo() = 0;
    virtual std::string text() const = 0;
};

class UndoStack {
public:
    // Executes cmd->redo() and records it. Discards any redoable commands.
    void push(std::unique_ptr<UndoCommand> cmd);

    bool canUndo() const { return index_ > 0; }
    bool canRedo() const { return index_ < commands_.size(); }
    void undo();
    void redo();
    std::string undoText() const;
    std::string redoText() const;

    // "Clean" = matches the last saved state. Used for the modified flag.
    bool isClean() const { return cleanIndex_ >= 0 && static_cast<std::size_t>(cleanIndex_) == index_; }
    void setClean() { cleanIndex_ = static_cast<long long>(index_); }
    void clear();

    std::size_t count() const { return commands_.size(); }
    std::size_t index() const { return index_; }

private:
    std::vector<std::unique_ptr<UndoCommand>> commands_;
    std::size_t index_ = 0;    // number of commands currently applied
    long long cleanIndex_ = 0; // -1 when the saved state is unreachable
};

} // namespace dyncad
