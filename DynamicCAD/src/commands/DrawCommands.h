// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InteractiveCommand.h"

namespace dyncad {

// LINE: chain of independent line segments. Options: Undo, Close.
class LineCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "LINE"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    std::vector<Vec2> points_;
    std::size_t segments_ = 0; // segments committed by this command
};

// CIRCLE: centre + radius / diameter, 2P (diameter end points), 3P.
class CircleCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "CIRCLE"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    enum class Stage { Center, Radius, Diameter, TwoP1, TwoP2, ThreeP1, ThreeP2, ThreeP3 };
    CommandStatus create(CommandContext& ctx, const Vec2& c, double r);
    Stage stage_ = Stage::Center;
    Vec2 center_, p1_, p2_;
};

// RECTANGLE: two opposite corners -> closed 4-vertex polyline.
class RectangleCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "RECTANGLE"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus enter(CommandContext& ctx) override;
    std::optional<Vec2> basePoint() const override { return corner_; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    std::optional<Vec2> corner_;
};

// ERASE: erases the pre-selection immediately, otherwise prompts to select.
class EraseCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "ERASE"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override { return "Select objects (Enter to erase, Esc to cancel):"; }
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext& ctx) override;
    bool wantsSelection() const override { return true; }

private:
    static CommandStatus eraseSelection(CommandContext& ctx);
};

std::vector<Vec2> rectangleVertices(const Vec2& a, const Vec2& b);

} // namespace dyncad
