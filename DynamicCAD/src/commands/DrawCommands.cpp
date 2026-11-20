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

CommandStatus RectangleCommand::start(CommandContext&) { return CommandStatus::Continue; }

std::string RectangleCommand::prompt() const {
    return corner_ ? "RECTANGLE  Specify other corner (or @width,height):" : "RECTANGLE  Specify first corner point:";
}

CommandStatus RectangleCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!p.isFinite()) { ctx.say("Invalid point."); return CommandStatus::Continue; }
    if (!corner_) { corner_ = p; return CommandStatus::Continue; }
    if (p.x == corner_->x || p.y == corner_->y) {
        ctx.say("Rectangle width and height must both be non-zero.");
        return CommandStatus::Continue;
    }
    ctx.doc.addWithUndo({std::make_shared<PolylineEntity>(rectangleVertices(*corner_, p), true)}, "Rectangle");
    return CommandStatus::Done;
}

CommandStatus RectangleCommand::number(CommandContext& ctx, double, const std::optional<Vec2>&) {
    ctx.say(corner_ ? "Enter the other corner as x,y or @width,height." : "Enter the corner as x,y.");
    return CommandStatus::Continue;
}

CommandStatus RectangleCommand::enter(CommandContext&) { return CommandStatus::Cancelled; }

void RectangleCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (corner_ && cursor.x != corner_->x && cursor.y != corner_->y)
        out.push_back(std::make_unique<PolylineEntity>(rectangleVertices(*corner_, cursor), true));
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
