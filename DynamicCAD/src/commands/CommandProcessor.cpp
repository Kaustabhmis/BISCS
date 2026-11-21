// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/CommandProcessor.h"

#include "commands/DrawCommands.h"
#include "commands/ShapeCommands.h"
#include "commands/ModifyCommands.h"
#include "commands/CurveEdit.h"
#include "geometry/Geometry.h"

#include <sstream>

namespace dyncad {

CommandProcessor::CommandProcessor(Document& doc, SelectionSet& selection)
    : doc_(doc), selection_(selection), ctx_{doc, selection, [this](const std::string& m) { say(m); }} {}

CommandProcessor::~CommandProcessor() = default;

void CommandProcessor::registerCommand(const std::string& name, const std::vector<std::string>& aliases, Factory factory) {
    const std::string n = toUpper(name);
    entries_[n] = Entry{n, std::move(factory), nullptr, false};
    for (const auto& a : aliases) aliases_[toUpper(a)] = n;
}

void CommandProcessor::registerAction(const std::string& name, const std::vector<std::string>& aliases, Action action,
                                      bool transparent) {
    const std::string n = toUpper(name);
    entries_[n] = Entry{n, nullptr, std::move(action), transparent};
    for (const auto& a : aliases) aliases_[toUpper(a)] = n;
}

const CommandProcessor::Entry* CommandProcessor::lookup(const std::string& nameOrAlias) const {
    std::string key = toUpper(trim(nameOrAlias));
    if (auto a = aliases_.find(key); a != aliases_.end()) key = a->second;
    auto it = entries_.find(key);
    return it == entries_.end() ? nullptr : &it->second;
}

bool CommandProcessor::isKnownCommand(const std::string& nameOrAlias) const { return lookup(nameOrAlias) != nullptr; }

std::vector<std::string> CommandProcessor::commandNames() const {
    std::vector<std::string> names;
    for (const auto& [n, e] : entries_) names.push_back(n);
    return names;
}

std::string CommandProcessor::prompt() const { return active_ ? active_->prompt() : "Command:"; }

Vec2 CommandProcessor::constrainedCursor(const Vec2& raw) const {
    if (ortho_ && active_) {
        if (auto base = active_->basePoint()) return geom::orthoConstrain(*base, raw);
    }
    return raw;
}

std::vector<std::unique_ptr<Entity>> CommandProcessor::previewEntities() const {
    std::vector<std::unique_ptr<Entity>> out;
    if (active_ && tracked_) active_->preview(*tracked_, out);
    else if (active_ && cursor_) active_->preview(constrainedCursor(*cursor_), out);
    return out;
}

bool CommandProcessor::runCommand(const std::string& nameOrAlias) {
    const Entry* e = lookup(nameOrAlias);
    if (!e) {
        say("Unknown command \"" + toUpper(trim(nameOrAlias)) + "\". Type HELP for a list of commands.");
        return false;
    }
    if (active_) cancel();
    lastCommand_ = e->name;
    if (e->action) {
        e->action({});
        stateChanged();
        return true;
    }
    active_ = e->factory();
    finishIf(active_->start(ctx_));
    stateChanged();
    return true;
}

void CommandProcessor::runCommandInstance(std::unique_ptr<InteractiveCommand> cmd) {
    if (!cmd) return;
    if (active_) cancel();
    active_ = std::move(cmd);
    finishIf(active_->start(ctx_));
    stateChanged();
}

void CommandProcessor::finishIf(CommandStatus st) {
    if (st != CommandStatus::Continue) { active_.reset(); snapOverride_.reset(); }
}

void CommandProcessor::deliverPoint(const Vec2& p) {
    if (!active_) return;
    lastPoint_ = p;
    snapOverride_.reset();
    finishIf(active_->point(ctx_, p));
    stateChanged();
}

void CommandProcessor::pointInput(const Vec2& world) {
    if (!active_) return;
    deliverPoint(constrainedCursor(world));
}

void CommandProcessor::pointInputExact(const Vec2& world) { deliverPoint(world); }

void CommandProcessor::cancel() {
    snapOverride_.reset();
    if (!active_) return;
    active_->cancel(ctx_);
    active_.reset();
    say("*Cancel*");
    stateChanged();
}

bool CommandProcessor::tryTransparent(const std::string& text) {
    std::string t = text;
    const bool apostrophe = !t.empty() && t[0] == '\'';
    if (apostrophe) t = trim(t.substr(1));
    std::istringstream iss(t);
    std::string word;
    iss >> word;
    std::vector<std::string> args;
    for (std::string a; iss >> a;) args.push_back(a);
    const Entry* e = lookup(word);
    // Plain names only for full words (>= 3 letters) so command options such
    // as "C" or "U" are never captured.
    if (!e || !e->action || !e->transparent || (!apostrophe && toUpper(word) != e->name)) return false;
    e->action(args);
    stateChanged();
    return true;
}

bool CommandProcessor::submit(const std::string& rawText) {
    const std::string text = trim(rawText);

    if (!active_) {
        if (text.empty()) {
            if (lastCommand_.empty()) return true;
            return runCommand(lastCommand_); // Enter repeats the last command
        }
        std::istringstream iss(text);
        std::string word;
        iss >> word;
        std::vector<std::string> args;
        for (std::string a; iss >> a;) args.push_back(a);
        const Entry* e = lookup(word);
        if (e && e->action) {
            lastCommand_ = e->name;
            e->action(args);
            stateChanged();
            return true;
        }
        return runCommand(word);
    }

    if (tryTransparent(text)) return true;
    if (wantsPoint()) {
        if (auto m = snapModeFromKeyword(toUpper(text))) {
            snapOverride_ = *m;
            say(std::string("Snap override: ") + snapModeName(*m) + " (next point only)");
            stateChanged();
            return true;
        }
    }

    // Relative input (@) is measured from the command's current base point
    // (e.g. the end of the line chain after an in-command Undo), else last point.
    std::optional<Vec2> relBase = active_->basePoint();
    if (!relBase) relBase = lastPoint_;
    const ParsedInput in = parseInput(text, relBase);
    switch (in.kind) {
    case ParsedInput::Kind::Empty:
        finishIf(active_->enter(ctx_));
        stateChanged();
        return true;
    case ParsedInput::Kind::Point:
        deliverPoint(in.point); // typed coordinates are exact: no ORTHO
        return true;
    case ParsedInput::Kind::Number: {
        std::optional<Vec2> cur;
        if (tracked_) cur = tracked_;
        else if (cursor_) cur = constrainedCursor(*cursor_);
        finishIf(active_->number(ctx_, in.number, cur));
        stateChanged();
        return true;
    }
    case ParsedInput::Kind::Keyword:
        finishIf(active_->keyword(ctx_, in.keyword));
        stateChanged();
        return true;
    case ParsedInput::Kind::Invalid:
        say("Invalid input \"" + text + "\". Use x,y  @dx,dy  @dist<angle  or a number.");
        return false;
    }
    return false;
}

void registerCoreCommands(CommandProcessor& proc, Document& doc) {
    proc.registerCommand("LINE", {"L"}, [] { return std::make_unique<LineCommand>(); });
    proc.registerCommand("CIRCLE", {"C"}, [] { return std::make_unique<CircleCommand>(); });
    proc.registerCommand("RECTANGLE", {"REC", "RECTANG"}, [] { return std::make_unique<RectangleCommand>(); });
    proc.registerCommand("PLINE", {"PL"}, [] { return std::make_unique<PlineCommand>(); });
    proc.registerCommand("ARC", {"A"}, [] { return std::make_unique<ArcCommand>(); });
    proc.registerCommand("POLYGON", {"POL"}, [] { return std::make_unique<PolygonCommand>(); });
    proc.registerCommand("ELLIPSE", {"EL"}, [] { return std::make_unique<EllipseCommand>(); });
    proc.registerCommand("SPLINE", {"SPL"}, [] { return std::make_unique<SplineCommand>(); });
    proc.registerCommand("POINT", {"PO"}, [] { return std::make_unique<PointCommand>(); });
    proc.registerCommand("SQUARE", {"SQ"}, [] { return std::make_unique<SquareCommand>(); });
    proc.registerCommand("ARROW", {"ARW"}, [] { return std::make_unique<ArrowCommand>(); });
    proc.registerCommand("XLINE", {"XL"}, [] { return std::make_unique<XLineCommand>(false); });
    proc.registerCommand("RAY", {}, [] { return std::make_unique<XLineCommand>(true); });
    proc.registerCommand("DONUT", {"DO"}, [] { return std::make_unique<DonutCommand>(); });
    proc.registerCommand("REVCLOUD", {"RC"}, [] { return std::make_unique<RevcloudCommand>(); });
    proc.registerCommand("MOVE", {"M"}, [] { return std::make_unique<MoveCommand>(false); });
    proc.registerCommand("COPY", {"CO", "CP"}, [] { return std::make_unique<MoveCommand>(true); });
    proc.registerCommand("ROTATE", {"RO"}, [] { return std::make_unique<RotateCommand>(); });
    proc.registerCommand("SCALE", {"SC"}, [] { return std::make_unique<ScaleCommand>(); });
    proc.registerCommand("MIRROR", {"MI"}, [] { return std::make_unique<MirrorCommand>(); });
    proc.registerCommand("ARRAY", {"AR"}, [] { return std::make_unique<ArrayCommand>(); });
    proc.registerCommand("EXPLODE", {"X"}, [] { return std::make_unique<ExplodeCommand>(); });
    proc.registerCommand("JOIN", {"J"}, [] { return std::make_unique<JoinCommand>(); });
    proc.registerCommand("OFFSET", {"O"}, [] { return std::make_unique<OffsetCommand>(); });
    proc.registerCommand("TRIM", {"TR"}, [] { return std::make_unique<TrimCommand>(false); });
    proc.registerCommand("EXTEND", {"EX"}, [] { return std::make_unique<TrimCommand>(true); });
    proc.registerCommand("BREAK", {"BR"}, [] { return std::make_unique<BreakCommand>(); });
    proc.registerCommand("FILLET", {"F"}, [] { return std::make_unique<CornerCommand>(false); });
    proc.registerCommand("CHAMFER", {"CHA"}, [] { return std::make_unique<CornerCommand>(true); });
    proc.registerCommand("STRETCH", {"S"}, [] { return std::make_unique<StretchCommand>(); });
    proc.registerCommand("MATCHPROP", {"MA"}, [] { return std::make_unique<MatchPropCommand>(); });
    proc.registerCommand("ERASE", {"E", "DELETE"}, [] { return std::make_unique<EraseCommand>(); });
    proc.registerAction("UNDO", {"U"}, [&doc, &proc](const std::vector<std::string>&) {
        if (!doc.undoStack().canUndo()) { if (proc.onMessage) proc.onMessage("Nothing to undo."); return; }
        const std::string t = doc.undoStack().undoText();
        doc.undo();
        if (proc.onMessage) proc.onMessage("Undo: " + t);
    });
    proc.registerAction("REDO", {}, [&doc, &proc](const std::vector<std::string>&) {
        if (!doc.undoStack().canRedo()) { if (proc.onMessage) proc.onMessage("Nothing to redo."); return; }
        const std::string t = doc.undoStack().redoText();
        doc.redo();
        if (proc.onMessage) proc.onMessage("Redo: " + t);
    });
}

} // namespace dyncad
