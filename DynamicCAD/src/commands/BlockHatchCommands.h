// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InteractiveCommand.h"
#include "entities/HatchEntity.h"

namespace dyncad {

// BLOCK: name, base point, objects -> block definition; the objects are
// replaced by one block reference (one undo step).
class BlockCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "BLOCK"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus text(CommandContext& ctx, const std::string& t) override;
    bool wantsText() const override { return stage_ == Stage::Name; }
    bool wantsSelection() const override { return stage_ == Stage::Objects; }

private:
    CommandStatus create(CommandContext& ctx);
    enum class Stage { Name, Base, Objects };
    Stage stage_ = Stage::Name;
    std::string name_;
    Vec2 base_;
    std::vector<EntityId> pre_;
};

// INSERT: block name, position, scale, rotation.
class InsertCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "INSERT"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus text(CommandContext& ctx, const std::string& t) override;
    bool wantsText() const override { return stage_ == Stage::Name; }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    CommandStatus create(CommandContext& ctx);
    enum class Stage { Name, Position, Scale, Rotation };
    Stage stage_ = Stage::Name;
    BlockDefPtr block_;
    Vec2 pos_;
    double scale_ = 1.0;
};

// HATCH: pick a point inside closed objects (inner closed objects become
// islands) or Select closed objects. [Pattern/Scale/Angle/Select]
class HatchCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "HATCH"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    bool wantsSelection() const override { return stage_ == Stage::Select; }

    // Boundary of the region around p from closed objects (outer + islands).
    static std::vector<HatchLoop> boundaryAt(const Document& doc, const Vec2& p);
    static std::vector<HatchLoop> loopsFromEntities(const std::vector<EntityPtr>& ents);
    static std::optional<HatchLoop> loopOf(const Entity& e);
    static std::string patternName() { return pattern_; }
    static void setDefaults(const std::string& p, double s, double a) { pattern_ = p; scale_ = s; angle_ = a; }

private:
    enum class Stage { Main, Pattern, Scale, Angle, Select };
    CommandStatus create(CommandContext& ctx, std::vector<HatchLoop> loops);
    Stage stage_ = Stage::Main;
    int created_ = 0;
    static std::string pattern_;
    static double scale_, angle_;
};

} // namespace dyncad
