// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InputParser.h"
#include "commands/InteractiveCommand.h"

#include <functional>
#include <map>
#include <memory>
#include <string>
#include <vector>

namespace dyncad {

// Routes command-line text and mouse points to the active command.
// Owns command registration (names + aliases), repeat-last-command,
// last-point tracking for relative coordinates, and ORTHO.
class CommandProcessor {
public:
    using Factory = std::function<std::unique_ptr<InteractiveCommand>()>;
    using Action = std::function<void(const std::vector<std::string>& args)>;

    CommandProcessor(Document& doc, SelectionSet& selection);
    ~CommandProcessor();

    // Interactive multi-step command (LINE, CIRCLE, ...).
    void registerCommand(const std::string& name, const std::vector<std::string>& aliases, Factory factory);
    // Immediate action (UNDO, ZOOM, ...). Extra words on the line become args.
    void registerAction(const std::string& name, const std::vector<std::string>& aliases, Action action);
    bool isKnownCommand(const std::string& nameOrAlias) const;
    std::vector<std::string> commandNames() const;

    // One line typed on the command line. Empty = Enter. Returns false if the
    // input was rejected (unknown command, invalid syntax).
    bool submit(const std::string& text);
    bool runCommand(const std::string& nameOrAlias);
    // A point picked with the mouse (already grid-snapped). ORTHO is applied here.
    void pointInput(const Vec2& world);
    void cancel();

    void setCursor(const Vec2& world) { cursor_ = world; }
    // Cursor position after ORTHO, used for previews and direct distance.
    Vec2 constrainedCursor(const Vec2& raw) const;

    bool isActive() const { return active_ != nullptr; }
    bool isSelecting() const { return active_ && active_->wantsSelection(); }
    std::string activeName() const { return active_ ? active_->name() : std::string(); }
    std::string prompt() const;
    std::optional<Vec2> basePoint() const { return active_ ? active_->basePoint() : std::nullopt; }
    std::vector<std::unique_ptr<Entity>> previewEntities() const;

    void setOrtho(bool on) { ortho_ = on; }
    bool ortho() const { return ortho_; }
    const std::optional<Vec2>& lastPoint() const { return lastPoint_; }
    const std::string& lastCommand() const { return lastCommand_; }

    std::function<void(const std::string&)> onMessage;
    std::function<void()> onStateChanged;

private:
    struct Entry {
        std::string name;
        Factory factory;
        Action action;
    };
    void say(const std::string& m) const { if (onMessage) onMessage(m); }
    void finishIf(CommandStatus st);
    void deliverPoint(const Vec2& p);
    void stateChanged() const { if (onStateChanged) onStateChanged(); }
    const Entry* lookup(const std::string& nameOrAlias) const;

    Document& doc_;
    SelectionSet& selection_;
    CommandContext ctx_;
    std::map<std::string, Entry> entries_;         // by canonical name
    std::map<std::string, std::string> aliases_;   // alias -> canonical name
    std::unique_ptr<InteractiveCommand> active_;
    std::optional<Vec2> lastPoint_;
    std::optional<Vec2> cursor_;
    std::string lastCommand_;
    bool ortho_ = false;
};

// Registers LINE, CIRCLE, RECTANGLE, ERASE, UNDO, REDO.
void registerCoreCommands(CommandProcessor& proc, Document& doc);

} // namespace dyncad
