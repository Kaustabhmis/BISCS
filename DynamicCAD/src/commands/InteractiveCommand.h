// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"
#include "selection/SelectionSet.h"

#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <vector>

namespace dyncad {

enum class CommandStatus { Continue, Done, Cancelled };

struct CommandContext {
    Document& doc;
    SelectionSet& selection;
    std::function<void(const std::string&)> message;
    // Pick-box size in world units (updated by the canvas with the zoom level);
    // used by commands that pick an object with a point (TRIM, BREAK, ...).
    double pickTolerance = 1.0;
    void say(const std::string& m) const { if (message) message(m); }
};

// A multi-step command driven by points, numbers, keywords and Enter.
// Commands are pure logic: the same object is driven by the mouse in the GUI
// and by typed input in automated tests.
class InteractiveCommand {
public:
    virtual ~InteractiveCommand() = default;

    virtual std::string name() const = 0;
    virtual CommandStatus start(CommandContext& ctx) = 0;
    virtual std::string prompt() const = 0;

    virtual CommandStatus point(CommandContext& ctx, const Vec2& p) = 0;
    // Default: "direct distance entry" along the cursor direction from basePoint().
    virtual CommandStatus number(CommandContext& ctx, double value, const std::optional<Vec2>& cursor);
    virtual CommandStatus keyword(CommandContext& ctx, const std::string& kw);
    // Enter / Space / right-click with empty input.
    virtual CommandStatus enter(CommandContext&) { return CommandStatus::Done; }
    virtual void cancel(CommandContext&) {}

    // Point that rubber-band previews, ORTHO and direct distance are relative to.
    virtual std::optional<Vec2> basePoint() const { return std::nullopt; }
    // Temporary geometry drawn while the command runs.
    virtual void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const;
    // True while the command is collecting objects with the pick box.
    virtual bool wantsSelection() const { return false; }
};

} // namespace dyncad
