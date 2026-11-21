// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/DrawCommands.h"

#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad {

// ---------------------------------------------------------------- LINE

CommandStatus LineCommand::start(CommandContext&) { return CommandStatus::Continue; }

std::string LineCommand::prompt() const {
    if (points_.empty()) return "LINE  Specify first point:";
    if (segments_ >= 2) return "LINE  Specify next point or [Close/Undo]:";
    return "LINE  Specify next point or [Undo]:";
}

std::optional<Vec2> LineCommand::basePoint() const {
    if (points_.empty()) return std::nullopt;
    return points_.back();
}

CommandStatus LineCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!p.isFinite()) { ctx.say("Invalid point."); return CommandStatus::Continue; }
    if (points_.empty()) {
        points_.push_back(p);
        return CommandStatus::Continue;
    }
    if (nearlyEqual(p, points_.back(), 0.0)) {
        ctx.say("Zero-length segment ignored.");
        return CommandStatus::Continue;
    }
    ctx.doc.addWithUndo({std::make_shared<LineEntity>(points_.back(), p)}, "Line");
    points_.push_back(p);
    ++segments_;
    return CommandStatus::Continue;
}

CommandStatus LineCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (kw == "U" || kw == "UNDO") {
        if (segments_ > 0) {
            ctx.doc.undo();
            --segments_;
            points_.pop_back();
        } else if (!points_.empty()) {
            points_.clear();
        } else {
            ctx.say("Nothing to undo.");
        }
        return CommandStatus::Continue;
    }
    if (kw == "C" || kw == "CLOSE") {
        if (segments_ < 2) {
            ctx.say("At least two segments are needed to close.");
            return CommandStatus::Continue;
        }
        ctx.doc.addWithUndo({std::make_shared<LineEntity>(points_.back(), points_.front())}, "Line");
        return CommandStatus::Done;
    }
    return InteractiveCommand::keyword(ctx, kw);
}

void LineCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (!points_.empty()) out.push_back(std::make_unique<LineEntity>(points_.back(), cursor));
}

// ---------------------------------------------------------------- CIRCLE

CommandStatus CircleCommand::start(CommandContext&) { return CommandStatus::Continue; }

std::string CircleCommand::prompt() const {
    switch (stage_) {
    case Stage::Center: return "CIRCLE  Specify center point or [3P/2P]:";
    case Stage::Radius: return "CIRCLE  Specify radius or [Diameter]:";
    case Stage::Diameter: return "CIRCLE  Specify diameter:";
    case Stage::TwoP1: return "CIRCLE  Specify first end point of diameter:";
    case Stage::TwoP2: return "CIRCLE  Specify second end point of diameter:";
    case Stage::ThreeP1: return "CIRCLE  Specify first point on circle:";
    case Stage::ThreeP2: return "CIRCLE  Specify second point on circle:";
    case Stage::ThreeP3: return "CIRCLE  Specify third point on circle:";
    }
    return {};
}

std::optional<Vec2> CircleCommand::basePoint() const {
    switch (stage_) {
    case Stage::Radius:
    case Stage::Diameter: return center_;
    case Stage::TwoP2:
    case Stage::ThreeP2: return p1_;
    case Stage::ThreeP3: return p2_;
    default: return std::nullopt;
    }
}

CommandStatus CircleCommand::create(CommandContext& ctx, const Vec2& c, double r) {
    if (!(r > 0.0) || !std::isfinite(r)) {
        ctx.say("Radius must be greater than zero.");
        return CommandStatus::Continue;
    }
    ctx.doc.addWithUndo({std::make_shared<CircleEntity>(c, r)}, "Circle");
    return CommandStatus::Done;
}

CommandStatus CircleCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!p.isFinite()) { ctx.say("Invalid point."); return CommandStatus::Continue; }
    switch (stage_) {
    case Stage::Center: center_ = p; stage_ = Stage::Radius; return CommandStatus::Continue;
    case Stage::Radius: return create(ctx, center_, distance(center_, p));
    case Stage::Diameter: return create(ctx, center_, distance(center_, p) * 0.5);
    case Stage::TwoP1: p1_ = p; stage_ = Stage::TwoP2; return CommandStatus::Continue;
    case Stage::TwoP2: return create(ctx, (p1_ + p) * 0.5, distance(p1_, p) * 0.5);
    case Stage::ThreeP1: p1_ = p; stage_ = Stage::ThreeP2; return CommandStatus::Continue;
    case Stage::ThreeP2:
        if (nearlyEqual(p, p1_, 0.0)) { ctx.say("Points must be different."); return CommandStatus::Continue; }
        p2_ = p; stage_ = Stage::ThreeP3; return CommandStatus::Continue;
    case Stage::ThreeP3: {
        auto c = geom::circleFrom3Points(p1_, p2_, p);
        if (!c) { ctx.say("The three points are collinear; no circle passes through them."); return CommandStatus::Continue; }
        return create(ctx, c->first, c->second);
    }
    }
    return CommandStatus::Continue;
}

CommandStatus CircleCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Radius) return create(ctx, center_, v);
    if (stage_ == Stage::Diameter) return create(ctx, center_, v * 0.5);
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus CircleCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Center && kw == "3P") { stage_ = Stage::ThreeP1; return CommandStatus::Continue; }
    if (stage_ == Stage::Center && kw == "2P") { stage_ = Stage::TwoP1; return CommandStatus::Continue; }
    if (stage_ == Stage::Radius && (kw == "D" || kw == "DIAMETER")) { stage_ = Stage::Diameter; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus CircleCommand::enter(CommandContext&) { return CommandStatus::Cancelled; }

void CircleCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    switch (stage_) {
    case Stage::Radius: {
        const double r = distance(center_, cursor);
        if (r > 0) out.push_back(std::make_unique<CircleEntity>(center_, r));
        out.push_back(std::make_unique<LineEntity>(center_, cursor));
        break;
    }
    case Stage::Diameter: {
        const double r = distance(center_, cursor) * 0.5;
        if (r > 0) out.push_back(std::make_unique<CircleEntity>(center_, r));
        out.push_back(std::make_unique<LineEntity>(center_, cursor));
        break;
    }
    case Stage::TwoP2: {
        const double r = distance(p1_, cursor) * 0.5;
        if (r > 0) out.push_back(std::make_unique<CircleEntity>((p1_ + cursor) * 0.5, r));
        break;
    }
    case Stage::ThreeP2: out.push_back(std::make_unique<LineEntity>(p1_, cursor)); break;
    case Stage::ThreeP3:
        if (auto c = geom::circleFrom3Points(p1_, p2_, cursor)) out.push_back(std::make_unique<CircleEntity>(c->first, c->second));
        break;
    default: break;
    }
}

// ---------------------------------------------------------------- RECTANGLE

std::vector<Vec2> rectangleVertices(const Vec2& a, const Vec2& b) {
    // Counter-clockwise starting at the first picked corner's x/y extremes.
    return {a, {b.x, a.y}, b, {a.x, b.y}};
}

double RectangleCommand::fillet_ = 0.0;
double RectangleCommand::chamfer_ = 0.0;

std::unique_ptr<Entity> RectangleCommand::make(const Vec2& a, const Vec2& b, double fillet, double chamfer) {
    const double w = std::abs(b.x - a.x), h = std::abs(b.y - a.y);
    const double r = fillet > 0 ? fillet : chamfer;
    if (r <= 0 || 2 * r > std::min(w, h) + 1e-12)
        return std::make_unique<PolylineEntity>(rectangleVertices(a, b), true);
    const double x0 = std::min(a.x, b.x), x1 = std::max(a.x, b.x), y0 = std::min(a.y, b.y), y1 = std::max(a.y, b.y);
    const double bulge = fillet > 0 ? std::tan(kPi / 8.0) : 0.0; // quarter circle, counter-clockwise
    std::vector<Vec2> v{{x0 + r, y0}, {x1 - r, y0}, {x1, y0 + r}, {x1, y1 - r},
                        {x1 - r, y1}, {x0 + r, y1}, {x0, y1 - r}, {x0, y0 + r}};
    std::vector<double> bl{0, bulge, 0, bulge, 0, bulge, 0, bulge};
    return std::make_unique<PolylineEntity>(std::move(v), std::move(bl), true);
}

CommandStatus RectangleCommand::start(CommandContext& ctx) {
    if (fillet_ > 0) ctx.say("Current rectangle mode: Fillet=" + std::to_string(fillet_));
    else if (chamfer_ > 0) ctx.say("Current rectangle mode: Chamfer=" + std::to_string(chamfer_));
    return CommandStatus::Continue;
}

std::string RectangleCommand::prompt() const {
    switch (stage_) {
    case Stage::Corner1: return "RECTANGLE  Specify first corner point or [Fillet/Chamfer]:";
    case Stage::Corner2: return "RECTANGLE  Specify other corner (or @width,height) or [Dimensions]:";
    case Stage::FilletR: return "RECTANGLE  Specify fillet radius for rectangles (0 = sharp corners):";
    case Stage::ChamferD: return "RECTANGLE  Specify chamfer distance for rectangles (0 = sharp corners):";
    case Stage::Length: return "RECTANGLE  Specify length (X) for rectangles:";
    case Stage::Width: return "RECTANGLE  Specify width (Y) for rectangles:";
    case Stage::Side: return "RECTANGLE  Click on the side to place the rectangle (Enter = up-right):";
    }
    return {};
}

CommandStatus RectangleCommand::create(CommandContext& ctx, const Vec2& b) {
    if (b.x == corner_.x || b.y == corner_.y) {
        ctx.say("Rectangle width and height must both be non-zero.");
        return CommandStatus::Continue;
    }
    const double r = std::max(fillet_, chamfer_);
    if (r > 0 && 2 * r > std::min(std::abs(b.x - corner_.x), std::abs(b.y - corner_.y)) + 1e-12)
        ctx.say("Rectangle is too small for the fillet/chamfer; drawn with sharp corners.");
    ctx.doc.addWithUndo({EntityPtr(make(corner_, b, fillet_, chamfer_))}, "Rectangle");
    return CommandStatus::Done;
}

CommandStatus RectangleCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!p.isFinite()) { ctx.say("Invalid point."); return CommandStatus::Continue; }
    switch (stage_) {
    case Stage::Corner1: corner_ = p; stage_ = Stage::Corner2; return CommandStatus::Continue;
    case Stage::Corner2: return create(ctx, p);
    case Stage::Side: {
        const double sx = p.x < corner_.x ? -1 : 1, sy = p.y < corner_.y ? -1 : 1;
        return create(ctx, corner_ + Vec2{sx * length_, sy * width_});
    }
    default: ctx.say("Please type a value."); return CommandStatus::Continue;
    }
}

CommandStatus RectangleCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>&) {
    switch (stage_) {
    case Stage::FilletR:
    case Stage::ChamferD:
        if (v < 0) { ctx.say("Value cannot be negative."); return CommandStatus::Continue; }
        if (stage_ == Stage::FilletR) { fillet_ = v; chamfer_ = 0; } else { chamfer_ = v; fillet_ = 0; }
        stage_ = Stage::Corner1;
        return CommandStatus::Continue;
    case Stage::Length:
        if (!(v > 0)) { ctx.say("Length must be greater than zero."); return CommandStatus::Continue; }
        length_ = v; stage_ = Stage::Width; return CommandStatus::Continue;
    case Stage::Width:
        if (!(v > 0)) { ctx.say("Width must be greater than zero."); return CommandStatus::Continue; }
        width_ = v; stage_ = Stage::Side; return CommandStatus::Continue;
    default:
        ctx.say(stage_ == Stage::Corner2 ? "Enter the other corner as x,y or @width,height, or D for dimensions."
                                         : "Enter the corner as x,y.");
        return CommandStatus::Continue;
    }
}

CommandStatus RectangleCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Corner1 && (kw == "F" || kw == "FILLET")) { stage_ = Stage::FilletR; return CommandStatus::Continue; }
    if (stage_ == Stage::Corner1 && (kw == "C" || kw == "CHAMFER")) { stage_ = Stage::ChamferD; return CommandStatus::Continue; }
    if (stage_ == Stage::Corner2 && (kw == "D" || kw == "DIMENSIONS")) { stage_ = Stage::Length; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus RectangleCommand::enter(CommandContext& ctx) {
    if (stage_ == Stage::Side) return create(ctx, corner_ + Vec2{length_, width_});
    return CommandStatus::Cancelled;
}

void RectangleCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ == Stage::Corner2 && cursor.x != corner_.x && cursor.y != corner_.y)
        out.push_back(make(corner_, cursor, fillet_, chamfer_));
    if (stage_ == Stage::Side) {
        const double sx = cursor.x < corner_.x ? -1 : 1, sy = cursor.y < corner_.y ? -1 : 1;
        out.push_back(make(corner_, corner_ + Vec2{sx * length_, sy * width_}, fillet_, chamfer_));
    }
}

// ---------------------------------------------------------------- ERASE

CommandStatus EraseCommand::eraseSelection(CommandContext& ctx) {
    const auto ids = ctx.selection.ids();
    const std::size_t n = ctx.doc.eraseWithUndo(ids);
    ctx.selection.clear();
    ctx.say(std::to_string(n) + (n == 1 ? " object erased." : " objects erased."));
    return CommandStatus::Done;
}

CommandStatus EraseCommand::start(CommandContext& ctx) {
    if (!ctx.selection.empty()) return eraseSelection(ctx);
    return CommandStatus::Continue;
}

CommandStatus EraseCommand::point(CommandContext& ctx, const Vec2&) {
    // Points are consumed by the canvas selection logic while wantsSelection().
    ctx.say("Pick objects with the cursor, then press Enter.");
    return CommandStatus::Continue;
}

CommandStatus EraseCommand::enter(CommandContext& ctx) {
    if (ctx.selection.empty()) return CommandStatus::Cancelled;
    return eraseSelection(ctx);
}

} // namespace dyncad
