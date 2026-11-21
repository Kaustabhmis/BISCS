// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InteractiveCommand.h"
#include "geometry/Ellipse.h"

namespace dyncad {

// PLINE: one polyline of straight and arc segments. [Arc/Line/Close/Undo]
class PlineCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "PLINE"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    void cancel(CommandContext& ctx) override { commit(ctx, false); }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    Vec2 currentTangent() const;
    double bulgeTo(const Vec2& p) const;
    CommandStatus commit(CommandContext& ctx, bool closed);
    std::vector<Vec2> pts_;
    std::vector<double> bulges_;
    bool arcMode_ = false;
    bool askingWidth_ = false;
    static double width_;
public:
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    static void setWidth(double w) { width_ = w; }
    static double width() { return width_; }
};

// ARC: 3 points (default) or Center, start, end / included angle.
class ArcCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "ARC"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    enum class Stage { Start, Second, End, Center, CStart, CEnd };
    Stage stage_ = Stage::Start;
    Vec2 a_, b_, c_;
};

// POLYGON: n sides about a centre (Inscribed/Circumscribed) or by Edge.
class PolygonCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "POLYGON"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

    static std::vector<Vec2> verticesAround(const Vec2& c, int sides, double radius, bool inscribed, double angle);
    static std::vector<Vec2> verticesFromEdge(const Vec2& a, const Vec2& b, int sides);

private:
    enum class Stage { Sides, Center, Mode, Radius, Edge1, Edge2 };
    Stage stage_ = Stage::Sides;
    Vec2 center_, e1_;
    bool inscribed_ = true;
    static int lastSides_;
    int sides_ = 4;
};

// ELLIPSE: axis end points + other half-axis, or Center.
class EllipseCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "ELLIPSE"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

    // Ellipse from centre, one major-axis end and the other half-axis length.
    static std::optional<EllipseGeom> make(const Vec2& center, const Vec2& axisEnd, double otherHalf);

private:
    enum class Stage { Axis1, Axis2, Center, AxisEnd, Other, StartAngle, EndAngle };
    double otherFromPoint(const Vec2& p) const;
    CommandStatus create(CommandContext& ctx, double other);
    CommandStatus finishArc(CommandContext& ctx, double endTheta);
    double thetaOf(const Vec2& p) const; // angle from the major axis, in ellipse space
    Stage stage_ = Stage::Axis1;
    Vec2 a_, center_, axisEnd_;
    bool arc_ = false;
    EllipseGeom pending_;
    double startTheta_ = 0;
public:
    // Ellipse parameter of the point at polar angle theta (from the major axis).
    static double paramFromTheta(double ratio, double theta);
};

// SPLINE: smooth curve through fit points (default) or by control vertices.
class SplineCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "SPLINE"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override { return commit(ctx, false); }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    std::unique_ptr<Entity> build(std::vector<Vec2> pts, bool closed) const;
    CommandStatus commit(CommandContext& ctx, bool closed);
    std::vector<Vec2> pts_;
    bool cv_ = false;
};

// POINT
class PointCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "POINT"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override { return "POINT  Specify a point:"; }
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
};

// SQUARE: corner + opposite corner (forced square) or typed side length.
class SquareCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "SQUARE"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    std::optional<Vec2> basePoint() const override { return corner_; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    std::vector<Vec2> squareFor(const Vec2& p, std::optional<double> side) const;
    std::optional<Vec2> corner_;
};

// ARROW: shaft + filled head(s). [Size/Double]
class ArrowCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "ARROW"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext&) override {
        if (askingSize_) { askingSize_ = false; return CommandStatus::Continue; } // keep current size
        return CommandStatus::Cancelled;
    }
    std::optional<Vec2> basePoint() const override { return askingSize_ ? std::nullopt : tail_; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

    static double headSize() { return headSize_; }
    static void setHeadSize(double s) { headSize_ = s; }
    // Builds shaft + head(s); empty if the arrow is shorter than its head(s).
    static std::vector<std::unique_ptr<Entity>> build(const Vec2& tail, const Vec2& tip, double size, bool doubleHead);

private:
    std::optional<Vec2> tail_;
    bool askingSize_ = false;
    static double headSize_;
    static bool double_;
};

} // namespace dyncad

namespace dyncad {

// XLINE: infinite lines through a base point. [Hor/Ver/Ang]
class XLineCommand final : public InteractiveCommand {
public:
    explicit XLineCommand(bool ray = false) : ray_(ray) {}
    std::string name() const override { return ray_ ? "RAY" : "XLINE"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Done; }
    std::optional<Vec2> basePoint() const override { return base_; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    enum class Mode { Through, Fixed, AskAngle };
    bool ray_;
    Mode mode_ = Mode::Through;
    std::optional<Vec2> base_;
    Vec2 fixedDir_{1, 0};
};

// DONUT: filled ring (or disc when the inside diameter is 0), repeated centres.
class DonutCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "DONUT"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus enter(CommandContext& ctx) override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;
    static std::unique_ptr<Entity> make(const Vec2& c, double inside, double outside);

private:
    enum class Stage { Inside, Outside, Center };
    Stage stage_ = Stage::Inside;
    static double inside_, outside_;
};

// REVCLOUD: rectangular revision cloud of arcs. [Arc length]
class RevcloudCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "REVCLOUD"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    std::optional<Vec2> basePoint() const override { return corner_; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;
    static std::unique_ptr<Entity> make(const Vec2& a, const Vec2& b, double arcLength);

private:
    std::optional<Vec2> corner_;
    bool askingLength_ = false;
    static double arcLength_;
};

} // namespace dyncad
