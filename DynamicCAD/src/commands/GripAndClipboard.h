// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InteractiveCommand.h"

namespace dyncad {

// Entity with grip 'index' (as listed by gripPoints()) moved to 'to', or
// nullptr if that grip cannot be edited.
EntityPtr withGripMoved(const Entity& e, std::size_t index, const Vec2& to);

// Grip editing: started by the canvas when a grip of a selected object is
// clicked; the next point is the new grip position.
class GripCommand final : public InteractiveCommand {
public:
    GripCommand(EntityId id, std::size_t grip, const Vec2& at) : id_(id), grip_(grip), at_(at) {}
    std::string name() const override { return "GRIP"; }
    CommandStatus start(CommandContext& ctx) override { doc_ = &ctx.doc; return CommandStatus::Continue; }
    std::string prompt() const override { return "GRIP  Specify stretch point (Esc to cancel):"; }
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    std::optional<Vec2> basePoint() const override { return at_; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    EntityId id_;
    std::size_t grip_;
    Vec2 at_;
    const Document* doc_ = nullptr;
};

// PASTECLIP: places clipboard entities with their lower-left corner at the
// picked insertion point.
class PasteCommand final : public InteractiveCommand {
public:
    explicit PasteCommand(std::vector<EntityPtr> ents);
    std::string name() const override { return "PASTECLIP"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override { return "PASTECLIP  Specify insertion point:"; }
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    std::vector<EntityPtr> ents_;
    Vec2 ref_;
};

} // namespace dyncad
