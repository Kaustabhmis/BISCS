// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/ShapeCommands.h"

#include "entities/ArcEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad {

namespace {
std::string fmtNum(double v) {
    char b[32];
    std::snprintf(b, sizeof b, "%g", v);
    return b;
}
bool validPoint(CommandContext& ctx, const Vec2& p) {
    if (p.isFinite()) return true;
    ctx.say("Invalid point.");
    return false;
}
} // namespace

// ================================================================ PLINE

std::string PlineCommand::prompt() const {
    if (pts_.empty()) return "PLINE  Specify start point:";
    const std::string close = pts_.size() >= 3 || (arcMode_ && pts_.size() >= 2) ? "Close/" : "";
    if (arcMode_) return "PLINE  Specify end point of arc or [Line/" + close + "Undo]:";
    return "PLINE  Specify next point or [Arc/" + close + "Undo]:";
}

std::optional<Vec2> PlineCommand::basePoint() const {
    if (pts_.empty()) return std::nullopt;
    return pts_.back();
}

Vec2 PlineCommand::currentTangent() const {
    // Direction at the end of the last segment (east if there is none).
    if (pts_.size() < 2) return {1, 0};
    const Vec2 a = pts_[pts_.size() - 2], b = pts_.back();
    const double bulge = bulges_[bulges_.size() - 2];
    const Vec2 chord = (b - a).normalized();
    if (bulge == 0.0) return chord;
    const double half = 2.0 * std::atan(bulge); // sweep / 2
    const double c = std::cos(half), s = std::sin(half);
    return {chord.x * c - chord.y * s, chord.x * s + chord.y * c};
}

double PlineCommand::bulgeTo(const Vec2& p) const {
    // Arc tangent to the previous segment: sweep = 2 * angle(tangent, chord).
    const Vec2 t = currentTangent(), d = p - pts_.back();
    const double alpha = std::atan2(t.cross(d), t.dot(d));
    return std::tan(alpha / 2.0);
}

CommandStatus PlineCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    if (!pts_.empty() && nearlyEqual(p, pts_.back(), 0.0)) {
        ctx.say("Zero-length segment ignored.");
        return CommandStatus::Continue;
    }
    if (!pts_.empty() && arcMode_) {
        const double b = bulgeTo(p);
        if (!std::isfinite(b) || std::abs(b) > 1e6) {
            ctx.say("The end point is directly behind the arc's start direction; pick another point.");
            return CommandStatus::Continue;
        }
        bulges_.back() = b;
    }
    pts_.push_back(p);
    bulges_.push_back(0.0);
    return CommandStatus::Continue;
}

CommandStatus PlineCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (kw == "A" || kw == "ARC") { arcMode_ = true; return CommandStatus::Continue; }
    if (kw == "L" || kw == "LINE") { arcMode_ = false; return CommandStatus::Continue; }
    if (kw == "U" || kw == "UNDO") {
        if (pts_.empty()) { ctx.say("Nothing to undo."); return CommandStatus::Continue; }
        pts_.pop_back();
        bulges_.pop_back();
        if (!bulges_.empty()) bulges_.back() = 0.0;
        return CommandStatus::Continue;
    }
    if (kw == "C" || kw == "CL" || kw == "CLOSE") {
        if (pts_.size() < 2 || (!arcMode_ && pts_.size() < 3)) {
            ctx.say("Not enough segments to close.");
            return CommandStatus::Continue;
        }
        if (arcMode_) bulges_.back() = bulgeTo(pts_.front());
        return commit(ctx, true);
    }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus PlineCommand::enter(CommandContext& ctx) { return commit(ctx, false); }

CommandStatus PlineCommand::commit(CommandContext& ctx, bool closed) {
    if (pts_.size() >= 2) {
        std::vector<double> b = bulges_;
        if (!closed) b.back() = 0.0;
        ctx.doc.addWithUndo({std::make_shared<PolylineEntity>(pts_, std::move(b), closed)}, "Polyline");
    }
    pts_.clear();
    bulges_.clear();
    return CommandStatus::Done;
}

void PlineCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (pts_.empty()) return;
    std::vector<Vec2> v = pts_;
    std::vector<double> b = bulges_;
    if (!nearlyEqual(cursor, pts_.back(), 0.0)) {
        if (arcMode_) {
            const double bl = bulgeTo(cursor);
            if (std::isfinite(bl) && std::abs(bl) < 1e6) b.back() = bl;
        }
        v.push_back(cursor);
        b.push_back(0.0);
    }
    if (v.size() >= 2) out.push_back(std::make_unique<PolylineEntity>(std::move(v), std::move(b), false));
}

// ================================================================ ARC

std::string ArcCommand::prompt() const {
    switch (stage_) {
    case Stage::Start: return "ARC  Specify start point of arc or [Center]:";
    case Stage::Second: return "ARC  Specify second point of arc:";
    case Stage::End: return "ARC  Specify end point of arc:";
    case Stage::Center: return "ARC  Specify center point of arc:";
    case Stage::CStart: return "ARC  Specify start point of arc:";
    case Stage::CEnd: return "ARC  Specify end point of arc (or included angle in degrees, + = counter-clockwise):";
    }
    return {};
}

std::optional<Vec2> ArcCommand::basePoint() const {
    switch (stage_) {
    case Stage::Second: return a_;
    case Stage::End: return b_;
    case Stage::CStart:
    case Stage::CEnd: return c_;
    default: return std::nullopt;
    }
}

namespace {
std::unique_ptr<ArcEntity> arc3p(const Vec2& a, const Vec2& b, const Vec2& c) {
    auto circ = geom::circleFrom3Points(a, b, c);
    if (!circ) return nullptr;
    const Vec2 o = circ->first;
    const double r = circ->second;
    const bool ccw = (b - a).cross(c - b) > 0;
    const double sa = geom::angleDeg(o, a), ea = geom::angleDeg(o, c);
    return ccw ? std::make_unique<ArcEntity>(o, r, sa, ea) : std::make_unique<ArcEntity>(o, r, ea, sa);
}
} // namespace

CommandStatus ArcCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    switch (stage_) {
    case Stage::Start: a_ = p; stage_ = Stage::Second; return CommandStatus::Continue;
    case Stage::Second:
        if (nearlyEqual(p, a_, 0.0)) { ctx.say("Points must be different."); return CommandStatus::Continue; }
        b_ = p; stage_ = Stage::End; return CommandStatus::Continue;
    case Stage::End: {
        auto arc = arc3p(a_, b_, p);
        if (!arc) { ctx.say("The three points are collinear or repeated; no arc passes through them."); return CommandStatus::Continue; }
        ctx.doc.addWithUndo({EntityPtr(std::move(arc))}, "Arc");
        return CommandStatus::Done;
    }
    case Stage::Center: c_ = p; stage_ = Stage::CStart; return CommandStatus::Continue;
    case Stage::CStart:
        if (nearlyEqual(p, c_, 0.0)) { ctx.say("Start point cannot be the center."); return CommandStatus::Continue; }
        a_ = p; stage_ = Stage::CEnd; return CommandStatus::Continue;
    case Stage::CEnd: {
        if (nearlyEqual(p, c_, 0.0)) { ctx.say("End point cannot be the center."); return CommandStatus::Continue; }
        const double sa = geom::angleDeg(c_, a_), ea = geom::angleDeg(c_, p);
        if (sa == ea) { ctx.say("End direction equals start direction; use CIRCLE for a full circle."); return CommandStatus::Continue; }
        ctx.doc.addWithUndo({std::make_shared<ArcEntity>(c_, distance(c_, a_), sa, ea)}, "Arc");
        return CommandStatus::Done;
    }
    }
    return CommandStatus::Continue;
}

CommandStatus ArcCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::CEnd) {
        if (v == 0.0 || std::abs(v) >= 360.0) { ctx.say("Included angle must be between -360 and 360 (not 0)."); return CommandStatus::Continue; }
        const double sa = geom::angleDeg(c_, a_);
        const double r = distance(c_, a_);
        if (v > 0) ctx.doc.addWithUndo({std::make_shared<ArcEntity>(c_, r, sa, sa + v)}, "Arc");
        else ctx.doc.addWithUndo({std::make_shared<ArcEntity>(c_, r, sa + v, sa)}, "Arc");
        return CommandStatus::Done;
    }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus ArcCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Start && (kw == "C" || kw == "CE" || kw == "CENTER")) { stage_ = Stage::Center; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

void ArcCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    switch (stage_) {
    case Stage::Second: out.push_back(std::make_unique<LineEntity>(a_, cursor)); break;
    case Stage::End:
        if (auto a = arc3p(a_, b_, cursor)) out.push_back(std::move(a));
        break;
    case Stage::CStart: out.push_back(std::make_unique<LineEntity>(c_, cursor)); break;
    case Stage::CEnd: {
        out.push_back(std::make_unique<LineEntity>(c_, cursor));
        const double sa = geom::angleDeg(c_, a_), ea = geom::angleDeg(c_, cursor);
        if (sa != ea && !nearlyEqual(cursor, c_, 0.0)) out.push_back(std::make_unique<ArcEntity>(c_, distance(c_, a_), sa, ea));
        break;
    }
    default: break;
    }
}

// ================================================================ POLYGON

int PolygonCommand::lastSides_ = 4;

std::vector<Vec2> PolygonCommand::verticesAround(const Vec2& c, int sides, double radius, bool inscribed, double angle) {
    // inscribed: radius to vertices, 'angle' = direction of the first vertex.
    // circumscribed: radius = apothem, 'angle' = direction of the first edge midpoint.
    const double step = 2.0 * kPi / sides;
    const double r = inscribed ? radius : radius / std::cos(step / 2.0);
    const double a0 = inscribed ? angle : angle - step / 2.0;
    std::vector<Vec2> v;
    for (int i = 0; i < sides; ++i) v.push_back(c + Vec2::fromPolar(r, a0 + i * step));
    return v;
}

std::vector<Vec2> PolygonCommand::verticesFromEdge(const Vec2& a, const Vec2& b, int sides) {
    // Polygon on the left of a->b (counter-clockwise).
    std::vector<Vec2> v{a, b};
    const double ext = 2.0 * kPi / sides;
    Vec2 dir = b - a;
    for (int i = 2; i < sides; ++i) {
        const double c = std::cos(ext), s = std::sin(ext);
        dir = {dir.x * c - dir.y * s, dir.x * s + dir.y * c};
        v.push_back(v.back() + dir);
    }
    return v;
}

std::string PolygonCommand::prompt() const {
    switch (stage_) {
    case Stage::Sides: return "POLYGON  Enter number of sides <" + std::to_string(sides_) + ">:";
    case Stage::Center: return "POLYGON  Specify center of polygon or [Edge]:";
    case Stage::Mode: return "POLYGON  Enter an option [Inscribed in circle/Circumscribed about circle] <I>:";
    case Stage::Radius: return std::string("POLYGON  Specify radius of circle") + (inscribed_ ? " (to vertices):" : " (to edge midpoints):");
    case Stage::Edge1: return "POLYGON  Specify first endpoint of edge:";
    case Stage::Edge2: return "POLYGON  Specify second endpoint of edge:";
    }
    return {};
}

std::optional<Vec2> PolygonCommand::basePoint() const {
    if (stage_ == Stage::Radius) return center_;
    if (stage_ == Stage::Edge2) return e1_;
    return std::nullopt;
}

CommandStatus PolygonCommand::enter(CommandContext&) {
    if (stage_ == Stage::Sides) { stage_ = Stage::Center; return CommandStatus::Continue; }
    if (stage_ == Stage::Mode) { inscribed_ = true; stage_ = Stage::Radius; return CommandStatus::Continue; }
    return CommandStatus::Cancelled;
}

CommandStatus PolygonCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Sides) {
        if (v != std::floor(v) || v < 3 || v > 1024) { ctx.say("Number of sides must be a whole number from 3 to 1024."); return CommandStatus::Continue; }
        sides_ = lastSides_ = static_cast<int>(v);
        stage_ = Stage::Center;
        return CommandStatus::Continue;
    }
    if (stage_ == Stage::Radius) {
        if (!(v > 0)) { ctx.say("Radius must be greater than zero."); return CommandStatus::Continue; }
        // Typed radius: bottom edge horizontal, as is usual in CAD.
        const double step = 2.0 * kPi / sides_;
        const double edgeMid = -kPi / 2.0;
        const double angle = inscribed_ ? edgeMid + step / 2.0 : edgeMid;
        ctx.doc.addWithUndo({std::make_shared<PolylineEntity>(verticesAround(center_, sides_, v, inscribed_, angle), true)}, "Polygon");
        return CommandStatus::Done;
    }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus PolygonCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Center && (kw == "E" || kw == "EDGE")) { stage_ = Stage::Edge1; return CommandStatus::Continue; }
    if (stage_ == Stage::Mode && (kw == "I" || kw == "INSCRIBED")) { inscribed_ = true; stage_ = Stage::Radius; return CommandStatus::Continue; }
    if (stage_ == Stage::Mode && (kw == "C" || kw == "CIRCUMSCRIBED")) { inscribed_ = false; stage_ = Stage::Radius; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus PolygonCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    switch (stage_) {
    case Stage::Sides: ctx.say("Enter the number of sides (3 to 1024)."); return CommandStatus::Continue;
    case Stage::Center: center_ = p; stage_ = Stage::Mode; return CommandStatus::Continue;
    case Stage::Mode: inscribed_ = true; stage_ = Stage::Radius; [[fallthrough]];
    case Stage::Radius: {
        const double r = distance(center_, p);
        if (!(r > 0)) { ctx.say("Radius must be greater than zero."); return CommandStatus::Continue; }
        const double ang = std::atan2(p.y - center_.y, p.x - center_.x);
        ctx.doc.addWithUndo({std::make_shared<PolylineEntity>(verticesAround(center_, sides_, r, inscribed_, ang), true)}, "Polygon");
        return CommandStatus::Done;
    }
    case Stage::Edge1: e1_ = p; stage_ = Stage::Edge2; return CommandStatus::Continue;
    case Stage::Edge2:
        if (nearlyEqual(p, e1_, 0.0)) { ctx.say("Edge length must be greater than zero."); return CommandStatus::Continue; }
        ctx.doc.addWithUndo({std::make_shared<PolylineEntity>(verticesFromEdge(e1_, p, sides_), true)}, "Polygon");
        return CommandStatus::Done;
    }
    return CommandStatus::Continue;
}

void PolygonCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ == Stage::Radius && !nearlyEqual(cursor, center_, 0.0)) {
        const double ang = std::atan2(cursor.y - center_.y, cursor.x - center_.x);
        out.push_back(std::make_unique<PolylineEntity>(verticesAround(center_, sides_, distance(center_, cursor), inscribed_, ang), true));
    } else if (stage_ == Stage::Edge2 && !nearlyEqual(cursor, e1_, 0.0)) {
        out.push_back(std::make_unique<PolylineEntity>(verticesFromEdge(e1_, cursor, sides_), true));
    }
}

// ================================================================ ELLIPSE

std::optional<EllipseGeom> EllipseCommand::make(const Vec2& center, const Vec2& axisEnd, double other) {
    const Vec2 axis = axisEnd - center;
    const double a = axis.length();
    if (!(a > 0) || !(other > 0) || !std::isfinite(other)) return std::nullopt;
    EllipseGeom g;
    g.center = center;
    if (other <= a) {
        g.major = axis;
        g.ratio = other / a;
    } else { // the "other" axis is longer: it becomes the major axis
        g.major = Vec2{-axis.y, axis.x}.normalized() * other;
        g.ratio = a / other;
    }
    return g;
}

std::string EllipseCommand::prompt() const {
    switch (stage_) {
    case Stage::Axis1: return "ELLIPSE  Specify axis endpoint of ellipse or [Center]:";
    case Stage::Axis2: return "ELLIPSE  Specify other endpoint of axis:";
    case Stage::Center: return "ELLIPSE  Specify center of ellipse:";
    case Stage::AxisEnd: return "ELLIPSE  Specify endpoint of axis:";
    case Stage::Other: return "ELLIPSE  Specify distance to other axis:";
    }
    return {};
}

std::optional<Vec2> EllipseCommand::basePoint() const {
    switch (stage_) {
    case Stage::Axis2: return a_;
    case Stage::AxisEnd:
    case Stage::Other: return center_;
    default: return std::nullopt;
    }
}

double EllipseCommand::otherFromPoint(const Vec2& p) const {
    // Perpendicular distance from p to the first axis line.
    const Vec2 u = (axisEnd_ - center_).normalized();
    return std::abs(u.cross(p - center_));
}

CommandStatus EllipseCommand::create(CommandContext& ctx, double other) {
    auto g = make(center_, axisEnd_, other);
    if (!g) { ctx.say("The other axis must have a length greater than zero."); return CommandStatus::Continue; }
    ctx.doc.addWithUndo({std::make_shared<EllipseEntity>(*g)}, "Ellipse");
    return CommandStatus::Done;
}

CommandStatus EllipseCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    switch (stage_) {
    case Stage::Axis1: a_ = p; stage_ = Stage::Axis2; return CommandStatus::Continue;
    case Stage::Axis2:
        if (nearlyEqual(p, a_, 0.0)) { ctx.say("Axis length must be greater than zero."); return CommandStatus::Continue; }
        center_ = (a_ + p) * 0.5; axisEnd_ = p; stage_ = Stage::Other; return CommandStatus::Continue;
    case Stage::Center: center_ = p; stage_ = Stage::AxisEnd; return CommandStatus::Continue;
    case Stage::AxisEnd:
        if (nearlyEqual(p, center_, 0.0)) { ctx.say("Axis length must be greater than zero."); return CommandStatus::Continue; }
        axisEnd_ = p; stage_ = Stage::Other; return CommandStatus::Continue;
    case Stage::Other: return create(ctx, otherFromPoint(p));
    }
    return CommandStatus::Continue;
}

CommandStatus EllipseCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Other) return create(ctx, v);
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus EllipseCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Axis1 && (kw == "C" || kw == "CENTER")) { stage_ = Stage::Center; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

void EllipseCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ == Stage::Axis2 || stage_ == Stage::AxisEnd) {
        out.push_back(std::make_unique<LineEntity>(stage_ == Stage::Axis2 ? a_ : center_, cursor));
    } else if (stage_ == Stage::Other) {
        if (auto g = make(center_, axisEnd_, otherFromPoint(cursor))) out.push_back(std::make_unique<EllipseEntity>(*g));
        out.push_back(std::make_unique<LineEntity>(center_, cursor));
    }
}

// ================================================================ SPLINE

std::string SplineCommand::prompt() const {
    const std::string mode = cv_ ? "control vertex" : "fit point";
    if (pts_.empty()) return std::string("SPLINE  Specify first ") + mode + " or [Method " + (cv_ ? "Fit" : "CV") + "]:";
    if (pts_.size() < 2) return "SPLINE  Specify next " + mode + " or [Undo]:";
    return "SPLINE  Specify next " + mode + " or [Close/Undo] (Enter to finish):";
}

std::optional<Vec2> SplineCommand::basePoint() const {
    if (pts_.empty()) return std::nullopt;
    return pts_.back();
}

std::unique_ptr<Entity> SplineCommand::build(std::vector<Vec2> pts, bool closed) const {
    if (pts.size() < 2) return nullptr;
    if (cv_) {
        if (closed) {
            if (pts.size() < 3) return nullptr;
            return std::make_unique<SplineEntity>(geom::closedUniformSpline(pts, 3));
        }
        return std::make_unique<SplineEntity>(geom::clampedUniformSpline(pts, 3));
    }
    if (closed) pts.push_back(pts.front()); // fit curve returns to its start point
    auto c = geom::interpolateSpline(pts, 3);
    if (!c) return nullptr;
    return std::make_unique<SplineEntity>(std::move(*c));
}

CommandStatus SplineCommand::commit(CommandContext& ctx, bool closed) {
    if (pts_.size() < 2) return CommandStatus::Cancelled;
    auto e = build(pts_, closed);
    if (!e) { ctx.say("Could not build a spline from these points."); return CommandStatus::Continue; }
    ctx.doc.addWithUndo({EntityPtr(std::move(e))}, "Spline");
    return CommandStatus::Done;
}

CommandStatus SplineCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    if (!pts_.empty() && nearlyEqual(p, pts_.back(), 0.0)) { ctx.say("Repeated point ignored."); return CommandStatus::Continue; }
    pts_.push_back(p);
    return CommandStatus::Continue;
}

CommandStatus SplineCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (pts_.empty() && (kw == "M" || kw == "METHOD" || kw == "CV" || kw == "FIT" || kw == "F")) {
        cv_ = (kw == "CV") ? true : (kw == "FIT" || kw == "F") ? false : !cv_;
        ctx.say(cv_ ? "Method: control vertices." : "Method: fit points.");
        return CommandStatus::Continue;
    }
    if (kw == "U" || kw == "UNDO") {
        if (pts_.empty()) ctx.say("Nothing to undo.");
        else pts_.pop_back();
        return CommandStatus::Continue;
    }
    if (kw == "C" || kw == "CLOSE") {
        if (pts_.size() < 3) { ctx.say("At least three points are needed to close a spline."); return CommandStatus::Continue; }
        return commit(ctx, true);
    }
    return InteractiveCommand::keyword(ctx, kw);
}

void SplineCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (pts_.empty()) return;
    std::vector<Vec2> v = pts_;
    if (!nearlyEqual(cursor, v.back(), 0.0)) v.push_back(cursor);
    if (cv_ && v.size() >= 2) out.push_back(std::make_unique<PolylineEntity>(v, false)); // control polygon
    if (auto e = build(v, false)) out.push_back(std::move(e));
}

// ================================================================ POINT

CommandStatus PointCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    ctx.doc.addWithUndo({std::make_shared<PointEntity>(p)}, "Point");
    return CommandStatus::Done;
}

// ================================================================ SQUARE

std::string SquareCommand::prompt() const {
    return corner_ ? "SQUARE  Specify opposite corner or enter side length:" : "SQUARE  Specify first corner:";
}

std::vector<Vec2> SquareCommand::squareFor(const Vec2& p, std::optional<double> side) const {
    const Vec2 d = p - *corner_;
    const double s = side ? *side : std::max(std::abs(d.x), std::abs(d.y));
    const double sx = d.x < 0 ? -1.0 : 1.0, sy = d.y < 0 ? -1.0 : 1.0;
    const Vec2 a = *corner_, b = a + Vec2{sx * s, sy * s};
    return {a, {b.x, a.y}, b, {a.x, b.y}};
}

CommandStatus SquareCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    if (!corner_) { corner_ = p; return CommandStatus::Continue; }
    const auto v = squareFor(p, std::nullopt);
    if (v[0] == v[2]) { ctx.say("Side length must be greater than zero."); return CommandStatus::Continue; }
    ctx.doc.addWithUndo({std::make_shared<PolylineEntity>(v, true)}, "Square");
    return CommandStatus::Done;
}

CommandStatus SquareCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (!corner_) { ctx.say("Specify the first corner as x,y."); return CommandStatus::Continue; }
    if (!(v > 0)) { ctx.say("Side length must be greater than zero."); return CommandStatus::Continue; }
    // The cursor's quadrant decides which way the square goes (default: up-right).
    const Vec2 dirPoint = cursor ? *cursor : *corner_ + Vec2{1, 1};
    ctx.doc.addWithUndo({std::make_shared<PolylineEntity>(squareFor(dirPoint, v), true)}, "Square");
    return CommandStatus::Done;
}

void SquareCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (!corner_) return;
    const auto v = squareFor(cursor, std::nullopt);
    if (v[0] != v[2]) out.push_back(std::make_unique<PolylineEntity>(v, true));
}

// ================================================================ ARROW

double ArrowCommand::headSize_ = 5.0;
bool ArrowCommand::double_ = false;

std::vector<std::unique_ptr<Entity>> ArrowCommand::build(const Vec2& tail, const Vec2& tip, double size, bool dbl) {
    std::vector<std::unique_ptr<Entity>> out;
    const double len = distance(tail, tip);
    if (!(size > 0) || len <= size * (dbl ? 2.0 : 1.0)) return out;
    const Vec2 u = (tip - tail) / len, n{-u.y, u.x};
    const double halfWidth = size / 6.0; // head 3:1 length:width
    auto head = [&](const Vec2& point, const Vec2& dir) {
        const Vec2 base = point - dir * size;
        auto h = std::make_unique<PolylineEntity>(std::vector<Vec2>{point, base + n * halfWidth, base - n * halfWidth}, true);
        h->setFilled(true);
        return h;
    };
    const Vec2 shaftEnd = tip - u * size;
    const Vec2 shaftStart = dbl ? tail + u * size : tail;
    out.push_back(std::make_unique<LineEntity>(shaftStart, shaftEnd));
    out.push_back(head(tip, u));
    if (dbl) out.push_back(head(tail, -u));
    return out;
}

std::string ArrowCommand::prompt() const {
    if (askingSize_) return "ARROW  Specify arrowhead length <" + fmtNum(headSize_) + ">:";
    if (!tail_) return "ARROW  Specify start point (tail) or [Size/Double]:";
    return std::string("ARROW  Specify tip point or [Size/Double] (head ") + fmtNum(headSize_) +
           (double_ ? ", double-headed):" : "):");
}

CommandStatus ArrowCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!validPoint(ctx, p)) return CommandStatus::Continue;
    if (askingSize_) { ctx.say("Type the arrowhead length."); return CommandStatus::Continue; }
    if (!tail_) { tail_ = p; return CommandStatus::Continue; }
    auto ents = build(*tail_, p, headSize_, double_);
    if (ents.empty()) { ctx.say("The arrow is shorter than its head; pick a point further away or reduce Size."); return CommandStatus::Continue; }
    std::vector<EntityPtr> shared;
    for (auto& e : ents) shared.push_back(EntityPtr(std::move(e)));
    ctx.doc.addWithUndo(std::move(shared), "Arrow");
    return CommandStatus::Done;
}

CommandStatus ArrowCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (askingSize_) {
        if (!(v > 0)) { ctx.say("Arrowhead length must be greater than zero."); return CommandStatus::Continue; }
        headSize_ = v;
        askingSize_ = false;
        return CommandStatus::Continue;
    }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus ArrowCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (!askingSize_ && (kw == "S" || kw == "SIZE")) { askingSize_ = true; return CommandStatus::Continue; }
    if (!askingSize_ && (kw == "D" || kw == "DOUBLE")) {
        double_ = !double_;
        ctx.say(double_ ? "Double-headed arrows." : "Single-headed arrows.");
        return CommandStatus::Continue;
    }
    return InteractiveCommand::keyword(ctx, kw);
}

void ArrowCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (!tail_ || askingSize_) return;
    auto ents = build(*tail_, cursor, headSize_, double_);
    if (ents.empty()) out.push_back(std::make_unique<LineEntity>(*tail_, cursor));
    for (auto& e : ents) out.push_back(std::move(e));
}

} // namespace dyncad
