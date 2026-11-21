// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InteractiveCommand.h"
#include "entities/Annotation.h"

namespace dyncad {

// Defaults used by new text, dimensions and leaders.
struct AnnotationDefaults {
    static double textHeight;
    static DimStyle dimStyle;
};

// TEXT (DTEXT): start point [Justify], height, rotation, then lines of text;
// each Enter starts a new line below, an empty line finishes.
class TextCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "TEXT"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus text(CommandContext& ctx, const std::string& t) override;
    bool wantsText() const override { return stage_ == Stage::Text; }
    std::optional<Vec2> basePoint() const override;

private:
    enum class Stage { Start, Justify, Height, Rotation, Text };
    Stage stage_ = Stage::Start;
    TextJustify justify_ = TextJustify::Left;
    Vec2 pos_;
    double height_ = 0, rotation_ = 0;
    int lines_ = 0;
};

// MTEXT: two corners (width, top-left), [Height], then paragraphs; an empty
// line creates one multiline text object wrapped to the box width.
class MTextCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "MTEXT"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus text(CommandContext& ctx, const std::string& t) override;
    bool wantsText() const override { return stage_ == Stage::Text; }
    std::optional<Vec2> basePoint() const override { return stage_ == Stage::Corner2 ? std::optional<Vec2>(c1_) : std::nullopt; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    enum class Stage { Corner1, Corner2, Height, Text };
    Stage stage_ = Stage::Corner1;
    Vec2 c1_, c2_;
    double height_ = 0;
    std::string body_;
};

// DIMLINEAR / DIMALIGNED: two extension origins (or Enter + pick a line),
// then the dimension line location. DIMLINEAR: [Horizontal/Vertical/Rotated];
// both: [Text] override.
class DimLinearCommand final : public InteractiveCommand {
public:
    explicit DimLinearCommand(bool aligned) : aligned_(aligned) {}
    std::string name() const override { return aligned_ ? "DIMALIGNED" : "DIMLINEAR"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus text(CommandContext& ctx, const std::string& t) override;
    bool wantsText() const override { return stage_ == Stage::TextOverride; }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;
    // Horizontal (0) or vertical (90) depending on where the location lies.
    static double autoAngle(const Vec2& a, const Vec2& b, const Vec2& loc);

private:
    enum class Stage { First, PickLine, Second, Location, RotAngle, TextOverride };
    std::unique_ptr<DimensionEntity> make(const Vec2& loc) const;
    bool aligned_;
    Stage stage_ = Stage::First;
    Vec2 a_, b_;
    std::optional<double> forced_;
    std::string override_;
};

// DIMANGULAR: pick two lines, or an arc, or Enter for vertex + two points;
// then the arc location.
class DimAngularCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "DIMANGULAR"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext& ctx) override;
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    enum class Stage { First, SecondLine, Vertex, P1, P2, Location };
    Stage stage_ = Stage::First;
    Vec2 v_, p1_, p2_;
    Vec2 l1a_, l1b_;
};

// DIMRADIUS / DIMDIAMETER: pick a circle or arc, then the text location.
class DimRadialCommand final : public InteractiveCommand {
public:
    explicit DimRadialCommand(bool diameter) : diameter_(diameter) {}
    std::string name() const override { return diameter_ ? "DIMDIAMETER" : "DIMRADIUS"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    std::optional<Vec2> basePoint() const override { return picked_ ? std::optional<Vec2>(center_) : std::nullopt; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    bool diameter_;
    bool picked_ = false;
    Vec2 center_;
    double radius_ = 0;
};

// LEADER: arrow point, more points, Enter, then text lines (empty = done).
class LeaderCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "LEADER"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus text(CommandContext& ctx, const std::string& t) override;
    bool wantsText() const override { return textStage_; }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    CommandStatus create(CommandContext& ctx);
    std::vector<Vec2> pts_;
    bool textStage_ = false;
    std::string body_;
};

// DIST: distance, angle and deltas between two points.
class DistCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "DIST"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override { return first_ ? "DIST  Specify second point:" : "DIST  Specify first point:"; }
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    std::optional<Vec2> basePoint() const override { return first_; }
private:
    std::optional<Vec2> first_;
};

// AREA: area and perimeter of picked points, or of an Object (closed shape).
class AreaCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "AREA"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;
private:
    std::vector<Vec2> pts_;
    bool object_ = false;
};

// ID: coordinates of a point.
class IdCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "ID"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override { return "ID  Specify point:"; }
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
};

} // namespace dyncad
