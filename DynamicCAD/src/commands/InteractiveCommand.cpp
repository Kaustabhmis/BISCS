// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/InteractiveCommand.h"

namespace dyncad {

CommandStatus InteractiveCommand::number(CommandContext& ctx, double value, const std::optional<Vec2>& cursor) {
    const auto base = basePoint();
    if (!base || !cursor) {
        ctx.say("A point is required. Enter x,y or pick a point.");
        return CommandStatus::Continue;
    }
    const Vec2 dir = (*cursor - *base).normalized();
    if (dir.lengthSquared() == 0.0) {
        ctx.say("Move the cursor to show the direction, then type the distance.");
        return CommandStatus::Continue;
    }
    return point(ctx, *base + dir * value);
}

CommandStatus InteractiveCommand::keyword(CommandContext& ctx, const std::string& kw) {
    ctx.say("Invalid option: " + kw);
    return CommandStatus::Continue;
}

void InteractiveCommand::preview(const Vec2&, std::vector<std::unique_ptr<Entity>>&) const {}

} // namespace dyncad
