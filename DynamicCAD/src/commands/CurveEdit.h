// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/ModifyCommands.h"
#include "geometry/Intersections.h"

namespace dyncad {

// An entity seen as a chain of segments/arcs with parameter u in [0, n]
// (u = primitive index + fraction along it). Lines, arcs, circles and
// polylines are supported; this drives TRIM, EXTEND, BREAK and OFFSET.
struct EditPath {
    std::vector<Primitive> prims;
    bool closed = false;
    EntityType sourceType = EntityType::Line;
    std::string layer;
    double width = 0.0;

    double length() const { return static_cast<double>(prims.size()); } // parameter range
    Vec2 pointAt(double u) const;
    double paramOf(const Vec2& p) const;                                 // closest point
    std::vector<double> paramsOnPrim(std::size_t i, const std::vector<Vec2>& pts) const;
    // Piece from u0 to u1 (u0 < u1; for closed paths u1 may exceed length()).
    EntityPtr piece(double u0, double u1) const;
};

std::optional<EditPath> editPathOf(const Entity& e);
// Parameters where the path crosses any other entity in the document.
std::vector<double> cuttingParams(const EditPath& path, const Document& doc, EntityId self);

// Offset of an entity by distance d towards 'side' (nullptr if not possible).
EntityPtr offsetEntity(const Entity& e, double d, const Vec2& side, std::string* why = nullptr);
// Fillet / chamfer of two lines. Returns {line1', line2', joint (may be null)}.
struct CornerResult {
    EntityPtr first, second, joint;
};
std::optional<CornerResult> filletLines(const Entity& l1, const Vec2& pick1, const Entity& l2, const Vec2& pick2,
                                        double radius, std::string* why);
std::optional<CornerResult> chamferLines(const Entity& l1, const Vec2& pick1, const Entity& l2, const Vec2& pick2,
                                         double d1, double d2, std::string* why);
// Fillet / chamfer every corner of a straight polyline.
EntityPtr filletPolyline(const Entity& pl, double radius, bool chamfer, int* corners, std::string* why);

class OffsetCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "OFFSET"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;
    static double distanceSetting() { return dist_; }

private:
    enum class Stage { Distance, Pick, Side };
    Stage stage_ = Stage::Distance;
    bool through_ = false;
    EntityId target_ = kInvalidEntityId;
    const Document* doc_ = nullptr;
    static double dist_;
};

// TRIM (quick mode): every object is a cutting edge; pick the parts to remove.
class TrimCommand final : public InteractiveCommand {
public:
    explicit TrimCommand(bool extend = false) : extend_(extend) {}
    std::string name() const override { return extend_ ? "EXTEND" : "TRIM"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Done; }
    static bool trimAt(CommandContext& ctx, const Vec2& p);
    static bool extendAt(CommandContext& ctx, const Vec2& p);

private:
    bool extend_;
};

// BREAK: pick the object at the first break point, then the second point
// ("@" = same point: split without a gap).
class BreakCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "BREAK"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    std::optional<Vec2> basePoint() const override { return first_; }

private:
    EntityId target_ = kInvalidEntityId;
    std::optional<Vec2> first_;
};

// FILLET / CHAMFER two lines, or all corners of a polyline. [Radius|Distance/Polyline]
class CornerCommand final : public InteractiveCommand {
public:
    explicit CornerCommand(bool chamfer) : chamfer_(chamfer) {}
    std::string name() const override { return chamfer_ ? "CHAMFER" : "FILLET"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    CommandStatus enter(CommandContext& ctx) override;
    static double radius() { return radius_; }
    static void setRadius(double r) { radius_ = r; }
    static void setChamferDistances(double a, double b) { d1_ = a; d2_ = b; }

private:
    enum class Stage { First, Second, Radius, Dist1, Dist2, Polyline };
    bool chamfer_;
    Stage stage_ = Stage::First;
    EntityId first_ = kInvalidEntityId;
    Vec2 pick1_;
    static double radius_, d1_, d2_;
};

// STRETCH: crossing window, base point, second point. Objects fully inside
// move; vertices inside the window of partly-crossing objects move.
class StretchCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "STRETCH"; }
    CommandStatus start(CommandContext& ctx) override { doc_ = &ctx.doc; return CommandStatus::Continue; }
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext&) override { return CommandStatus::Cancelled; }
    std::optional<Vec2> basePoint() const override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;
    // Stretched copy of e (nullptr if unchanged).
    static EntityPtr stretched(const Entity& e, const BoundingBox& window, const Vec2& delta);

private:
    std::optional<Vec2> c1_, c2_, base_;
    const Document* doc_ = nullptr;
};

} // namespace dyncad
