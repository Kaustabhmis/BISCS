// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/AnnotationCommands.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Geometry.h"
#include "geometry/Intersections.h"

#include <cmath>
#include <cstdio>

namespace dyncad {

double AnnotationDefaults::textHeight = 2.5;
DimStyle AnnotationDefaults::dimStyle;

namespace {
std::string f4(double v) {
    char b[48];
    std::snprintf(b, sizeof b, "%.4f", v);
    return b;
}
std::string fg(double v) {
    char b[48];
    std::snprintf(b, sizeof b, "%g", v);
    return b;
}
} // namespace

// ================================================================ TEXT

std::string TextCommand::prompt() const {
    switch (stage_) {
    case Stage::Start: return std::string("TEXT  Specify start point of text or [Justify] (") + justifyName(justify_) + "):";
    case Stage::Justify: return "TEXT  Enter justification [Left/Center/Right/Middle]:";
    case Stage::Height: return "TEXT  Specify height <" + fg(AnnotationDefaults::textHeight) + ">:";
    case Stage::Rotation: return "TEXT  Specify rotation angle of text <0>:";
    case Stage::Text: return lines_ ? "TEXT  Enter next line (empty line to finish):" : "TEXT  Enter text:";
    }
    return {};
}

std::optional<Vec2> TextCommand::basePoint() const {
    if (stage_ == Stage::Height || stage_ == Stage::Rotation) return pos_;
    return std::nullopt;
}

CommandStatus TextCommand::point(CommandContext& ctx, const Vec2& p) {
    switch (stage_) {
    case Stage::Start: pos_ = p; stage_ = Stage::Height; return CommandStatus::Continue;
    case Stage::Height: {
        const double h = distance(pos_, p);
        if (!(h > 0)) { ctx.say("Height must be greater than zero."); return CommandStatus::Continue; }
        height_ = AnnotationDefaults::textHeight = h;
        stage_ = Stage::Rotation;
        return CommandStatus::Continue;
    }
    case Stage::Rotation:
        rotation_ = geom::angleDeg(pos_, p);
        stage_ = Stage::Text;
        return CommandStatus::Continue;
    default: ctx.say("Type a value."); return CommandStatus::Continue;
    }
}

CommandStatus TextCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Height) {
        if (!(v > 0)) { ctx.say("Height must be greater than zero."); return CommandStatus::Continue; }
        height_ = AnnotationDefaults::textHeight = v;
        stage_ = Stage::Rotation;
        return CommandStatus::Continue;
    }
    if (stage_ == Stage::Rotation) { rotation_ = v; stage_ = Stage::Text; return CommandStatus::Continue; }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus TextCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Start && (kw == "J" || kw == "JUSTIFY")) { stage_ = Stage::Justify; return CommandStatus::Continue; }
    if (stage_ == Stage::Justify) {
        TextJustify j;
        if (parseJustify(kw, j) && j != TextJustify::TopLeft) { justify_ = j; stage_ = Stage::Start; return CommandStatus::Continue; }
        ctx.say("Choose L, C, R or M.");
        return CommandStatus::Continue;
    }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus TextCommand::enter(CommandContext&) {
    switch (stage_) {
    case Stage::Height: height_ = AnnotationDefaults::textHeight; stage_ = Stage::Rotation; return CommandStatus::Continue;
    case Stage::Rotation: rotation_ = 0; stage_ = Stage::Text; return CommandStatus::Continue;
    case Stage::Text: return lines_ ? CommandStatus::Done : CommandStatus::Cancelled;
    default: return CommandStatus::Cancelled;
    }
}

CommandStatus TextCommand::text(CommandContext& ctx, const std::string& t) {
    ctx.doc.addWithUndo({std::make_shared<TextEntity>(pos_, t, height_, rotation_, justify_)}, "Text");
    ++lines_;
    // Next line directly below, in the text's own direction.
    pos_ = pos_ + Vec2::fromPolar(height_ * kLineSpacing, degToRad(rotation_ - 90));
    return CommandStatus::Continue;
}

// ================================================================ MTEXT

std::string MTextCommand::prompt() const {
    switch (stage_) {
    case Stage::Corner1: return "MTEXT  Specify first corner:";
    case Stage::Corner2: return "MTEXT  Specify opposite corner or [Height] (height " + fg(AnnotationDefaults::textHeight) + "):";
    case Stage::Height: return "MTEXT  Specify height <" + fg(AnnotationDefaults::textHeight) + ">:";
    case Stage::Text: return body_.empty() ? "MTEXT  Enter text (Enter starts a new paragraph, empty line to finish):"
                                           : "MTEXT  Next paragraph (empty line to finish):";
    }
    return {};
}

CommandStatus MTextCommand::point(CommandContext& ctx, const Vec2& p) {
    if (stage_ == Stage::Corner1) { c1_ = p; stage_ = Stage::Corner2; return CommandStatus::Continue; }
    if (stage_ == Stage::Corner2) {
        if (p.x == c1_.x) { ctx.say("The box needs a width."); return CommandStatus::Continue; }
        c2_ = p;
        if (height_ <= 0) height_ = AnnotationDefaults::textHeight;
        stage_ = Stage::Text;
        return CommandStatus::Continue;
    }
    ctx.say("Type a value.");
    return CommandStatus::Continue;
}

CommandStatus MTextCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Height) {
        if (!(v > 0)) { ctx.say("Height must be greater than zero."); return CommandStatus::Continue; }
        height_ = AnnotationDefaults::textHeight = v;
        stage_ = Stage::Corner2;
        return CommandStatus::Continue;
    }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus MTextCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Corner2 && (kw == "H" || kw == "HEIGHT")) { stage_ = Stage::Height; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus MTextCommand::enter(CommandContext& ctx) {
    if (stage_ == Stage::Height) { stage_ = Stage::Corner2; return CommandStatus::Continue; }
    if (stage_ != Stage::Text || body_.empty()) return CommandStatus::Cancelled;
    const Vec2 topLeft{std::min(c1_.x, c2_.x), std::max(c1_.y, c2_.y)};
    auto t = std::make_shared<TextEntity>(topLeft, body_, height_, 0.0, TextJustify::TopLeft);
    t->setWrapWidth(std::abs(c2_.x - c1_.x));
    ctx.doc.addWithUndo({t}, "Multiline text");
    return CommandStatus::Done;
}

CommandStatus MTextCommand::text(CommandContext&, const std::string& t) {
    body_ += (body_.empty() ? "" : "\n") + t;
    return CommandStatus::Continue;
}

void MTextCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ == Stage::Corner2)
        out.push_back(std::make_unique<PolylineEntity>(std::vector<Vec2>{c1_, {cursor.x, c1_.y}, cursor, {c1_.x, cursor.y}}, true));
}

// ================================================================ DIMLINEAR / DIMALIGNED

double DimLinearCommand::autoAngle(const Vec2& a, const Vec2& b, const Vec2& loc) {
    const double x0 = std::min(a.x, b.x), x1 = std::max(a.x, b.x), y0 = std::min(a.y, b.y), y1 = std::max(a.y, b.y);
    const bool inX = loc.x >= x0 && loc.x <= x1, inY = loc.y >= y0 && loc.y <= y1;
    if (inX && !inY) return 0.0;  // above/below: horizontal
    if (inY && !inX) return 90.0; // left/right: vertical
    const double dx = std::max(x0 - loc.x, loc.x - x1), dy = std::max(y0 - loc.y, loc.y - y1);
    return dy >= dx ? 0.0 : 90.0;
}

std::string DimLinearCommand::prompt() const {
    const std::string n = name() + "  ";
    switch (stage_) {
    case Stage::First: return n + "Specify first extension line origin or <select object>:";
    case Stage::PickLine: return n + "Select a line to dimension:";
    case Stage::Second: return n + "Specify second extension line origin:";
    case Stage::Location:
        return n + (aligned_ ? "Specify dimension line location or [Text]:"
                             : "Specify dimension line location or [Text/Horizontal/Vertical/Rotated]:");
    case Stage::RotAngle: return n + "Specify angle of dimension line (degrees):";
    case Stage::TextOverride: return n + "Enter dimension text (<> = measured value):";
    }
    return {};
}

std::optional<Vec2> DimLinearCommand::basePoint() const {
    if (stage_ == Stage::Second) return a_;
    return std::nullopt;
}

std::unique_ptr<DimensionEntity> DimLinearCommand::make(const Vec2& loc) const {
    const double ang = aligned_ ? 0.0 : forced_.value_or(autoAngle(a_, b_, loc));
    auto d = std::make_unique<DimensionEntity>(aligned_ ? DimKind::Aligned : DimKind::Linear, a_, b_, loc, ang);
    d->setDimStyle(AnnotationDefaults::dimStyle);
    d->setTextOverride(override_);
    return d;
}

CommandStatus DimLinearCommand::point(CommandContext& ctx, const Vec2& p) {
    switch (stage_) {
    case Stage::First: a_ = p; stage_ = Stage::Second; return CommandStatus::Continue;
    case Stage::Second:
        if (nearlyEqual(p, a_, 0.0)) { ctx.say("Pick a different point."); return CommandStatus::Continue; }
        b_ = p; stage_ = Stage::Location; return CommandStatus::Continue;
    case Stage::PickLine: {
        const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
        auto e = id ? ctx.doc.findEntity(id) : nullptr;
        if (e && e->type() == EntityType::Line) {
            a_ = static_cast<const LineEntity&>(*e).start();
            b_ = static_cast<const LineEntity&>(*e).end();
        } else if (e && e->type() == EntityType::Polyline) {
            const auto& pl = static_cast<const PolylineEntity&>(*e);
            double best = 1e300;
            for (std::size_t i = 0; i < pl.segmentCount(); ++i) {
                const double d = geom::distancePointToSegment(p, pl.segmentStart(i), pl.segmentEnd(i));
                if (d < best) { best = d; a_ = pl.segmentStart(i); b_ = pl.segmentEnd(i); }
            }
        } else {
            ctx.say("Pick a line or a polyline segment.");
            return CommandStatus::Continue;
        }
        stage_ = Stage::Location;
        return CommandStatus::Continue;
    }
    case Stage::Location:
        ctx.doc.addWithUndo({EntityPtr(make(p))}, "Dimension");
        return CommandStatus::Done;
    default: ctx.say("Type a value."); return CommandStatus::Continue;
    }
}

CommandStatus DimLinearCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::RotAngle) { forced_ = v; stage_ = Stage::Location; return CommandStatus::Continue; }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus DimLinearCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Location) {
        if (kw == "T" || kw == "TEXT") { stage_ = Stage::TextOverride; return CommandStatus::Continue; }
        if (!aligned_ && (kw == "H" || kw == "HORIZONTAL")) { forced_ = 0.0; return CommandStatus::Continue; }
        if (!aligned_ && (kw == "V" || kw == "VERTICAL")) { forced_ = 90.0; return CommandStatus::Continue; }
        if (!aligned_ && (kw == "R" || kw == "ROTATED")) { stage_ = Stage::RotAngle; return CommandStatus::Continue; }
    }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus DimLinearCommand::enter(CommandContext&) {
    if (stage_ == Stage::First) { stage_ = Stage::PickLine; return CommandStatus::Continue; }
    if (stage_ == Stage::TextOverride) { override_.clear(); stage_ = Stage::Location; return CommandStatus::Continue; }
    return CommandStatus::Cancelled;
}

CommandStatus DimLinearCommand::text(CommandContext&, const std::string& t) {
    override_ = t;
    stage_ = Stage::Location;
    return CommandStatus::Continue;
}

void DimLinearCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ == Stage::Location) out.push_back(make(cursor));
    else if (stage_ == Stage::Second) out.push_back(std::make_unique<LineEntity>(a_, cursor));
}

// ================================================================ DIMANGULAR

std::string DimAngularCommand::prompt() const {
    switch (stage_) {
    case Stage::First: return "DIMANGULAR  Select arc or first line, or <specify vertex>:";
    case Stage::SecondLine: return "DIMANGULAR  Select second line:";
    case Stage::Vertex: return "DIMANGULAR  Specify angle vertex:";
    case Stage::P1: return "DIMANGULAR  Specify first angle endpoint:";
    case Stage::P2: return "DIMANGULAR  Specify second angle endpoint:";
    case Stage::Location: return "DIMANGULAR  Specify dimension arc location:";
    }
    return {};
}

std::optional<Vec2> DimAngularCommand::basePoint() const {
    if (stage_ == Stage::P1 || stage_ == Stage::P2 || stage_ == Stage::Location) return v_;
    return std::nullopt;
}

CommandStatus DimAngularCommand::point(CommandContext& ctx, const Vec2& p) {
    auto pickLine = [&](Vec2& a, Vec2& b, EntityPtr* out) -> bool {
        const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
        auto e = id ? ctx.doc.findEntity(id) : nullptr;
        if (out) *out = e;
        if (e && e->type() == EntityType::Line) {
            a = static_cast<const LineEntity&>(*e).start();
            b = static_cast<const LineEntity&>(*e).end();
            return true;
        }
        return false;
    };
    switch (stage_) {
    case Stage::First: {
        EntityPtr e;
        if (pickLine(l1a_, l1b_, &e)) {
            // Leg 1 points away from the vertex towards the picked side.
            p1_ = p;
            stage_ = Stage::SecondLine;
            return CommandStatus::Continue;
        }
        if (e && e->type() == EntityType::Arc) {
            const ArcGeom g = static_cast<const ArcEntity&>(*e).geom();
            v_ = g.center;
            p1_ = g.startPoint();
            p2_ = g.endPoint();
            stage_ = Stage::Location;
            return CommandStatus::Continue;
        }
        ctx.say("Select a line or an arc, or press Enter to pick a vertex.");
        return CommandStatus::Continue;
    }
    case Stage::SecondLine: {
        Vec2 a, b;
        if (!pickLine(a, b, nullptr)) { ctx.say("Select a second line."); return CommandStatus::Continue; }
        auto x = geom::intersectLines(l1a_, l1b_, a, b);
        if (x.empty()) { ctx.say("The lines are parallel."); return CommandStatus::Continue; }
        v_ = x[0];
        // Legs run from the vertex through the picked points.
        p2_ = p;
        if (nearlyEqual(p1_, v_, 1e-12) || nearlyEqual(p2_, v_, 1e-12)) { ctx.say("Pick the lines away from their intersection."); return CommandStatus::Continue; }
        // Snap the leg directions onto the actual lines.
        const Vec2 d1 = (l1b_ - l1a_).normalized(), d2 = (b - a).normalized();
        p1_ = v_ + d1 * (p1_ - v_).dot(d1);
        p2_ = v_ + d2 * (p2_ - v_).dot(d2);
        stage_ = Stage::Location;
        return CommandStatus::Continue;
    }
    case Stage::Vertex: v_ = p; stage_ = Stage::P1; return CommandStatus::Continue;
    case Stage::P1:
        if (nearlyEqual(p, v_, 0.0)) { ctx.say("Pick a point away from the vertex."); return CommandStatus::Continue; }
        p1_ = p; stage_ = Stage::P2; return CommandStatus::Continue;
    case Stage::P2:
        if (nearlyEqual(p, v_, 0.0)) { ctx.say("Pick a point away from the vertex."); return CommandStatus::Continue; }
        p2_ = p; stage_ = Stage::Location; return CommandStatus::Continue;
    case Stage::Location: {
        if (nearlyEqual(p, v_, 0.0)) { ctx.say("Pick a location away from the vertex."); return CommandStatus::Continue; }
        auto d = std::make_shared<DimensionEntity>(DimKind::Angular, v_, p1_, p);
        d->setC(p2_);
        d->setDimStyle(AnnotationDefaults::dimStyle);
        ctx.doc.addWithUndo({d}, "Dimension");
        return CommandStatus::Done;
    }
    }
    return CommandStatus::Continue;
}

CommandStatus DimAngularCommand::enter(CommandContext&) {
    if (stage_ == Stage::First) { stage_ = Stage::Vertex; return CommandStatus::Continue; }
    return CommandStatus::Cancelled;
}

void DimAngularCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ == Stage::Location && !nearlyEqual(cursor, v_, 0.0)) {
        auto d = std::make_unique<DimensionEntity>(DimKind::Angular, v_, p1_, cursor);
        d->setC(p2_);
        d->setDimStyle(AnnotationDefaults::dimStyle);
        out.push_back(std::move(d));
    }
}

// ================================================================ DIMRADIUS / DIMDIAMETER

std::string DimRadialCommand::prompt() const {
    return picked_ ? name() + "  Specify dimension line location:" : name() + "  Select arc or circle:";
}

CommandStatus DimRadialCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!picked_) {
        const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
        auto e = id ? ctx.doc.findEntity(id) : nullptr;
        if (e && e->type() == EntityType::Circle) {
            center_ = static_cast<const CircleEntity&>(*e).center();
            radius_ = static_cast<const CircleEntity&>(*e).radius();
        } else if (e && e->type() == EntityType::Arc) {
            center_ = static_cast<const ArcEntity&>(*e).center();
            radius_ = static_cast<const ArcEntity&>(*e).radius();
        } else {
            ctx.say("Select an arc or a circle.");
            return CommandStatus::Continue;
        }
        picked_ = true;
        return CommandStatus::Continue;
    }
    Vec2 dir = (p - center_).normalized();
    if (dir.lengthSquared() == 0) dir = {1, 0};
    auto d = std::make_shared<DimensionEntity>(diameter_ ? DimKind::Diameter : DimKind::Radius, center_,
                                               center_ + dir * radius_, p);
    d->setDimStyle(AnnotationDefaults::dimStyle);
    ctx.doc.addWithUndo({d}, "Dimension");
    return CommandStatus::Done;
}

void DimRadialCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (!picked_) return;
    Vec2 dir = (cursor - center_).normalized();
    if (dir.lengthSquared() == 0) return;
    auto d = std::make_unique<DimensionEntity>(diameter_ ? DimKind::Diameter : DimKind::Radius, center_,
                                               center_ + dir * radius_, cursor);
    d->setDimStyle(AnnotationDefaults::dimStyle);
    out.push_back(std::move(d));
}

// ================================================================ LEADER

std::string LeaderCommand::prompt() const {
    if (textStage_) return body_.empty() ? "LEADER  Enter annotation text (empty line to finish):" : "LEADER  Next line (empty to finish):";
    if (pts_.empty()) return "LEADER  Specify arrowhead location:";
    return "LEADER  Specify next point (Enter to type the text):";
}

std::optional<Vec2> LeaderCommand::basePoint() const {
    if (pts_.empty() || textStage_) return std::nullopt;
    return pts_.back();
}

CommandStatus LeaderCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!pts_.empty() && nearlyEqual(p, pts_.back(), 0.0)) { ctx.say("Repeated point ignored."); return CommandStatus::Continue; }
    pts_.push_back(p);
    return CommandStatus::Continue;
}

CommandStatus LeaderCommand::create(CommandContext& ctx) {
    auto l = std::make_shared<LeaderEntity>(pts_, body_);
    l->setDimStyle(AnnotationDefaults::dimStyle);
    ctx.doc.addWithUndo({l}, "Leader");
    return CommandStatus::Done;
}

CommandStatus LeaderCommand::enter(CommandContext& ctx) {
    if (!textStage_) {
        if (pts_.size() < 2) return CommandStatus::Cancelled;
        textStage_ = true;
        return CommandStatus::Continue;
    }
    return create(ctx);
}

CommandStatus LeaderCommand::text(CommandContext&, const std::string& t) {
    body_ += (body_.empty() ? "" : "\n") + t;
    return CommandStatus::Continue;
}

void LeaderCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (pts_.empty() || textStage_) return;
    std::vector<Vec2> v = pts_;
    if (!nearlyEqual(cursor, v.back(), 0.0)) v.push_back(cursor);
    if (v.size() >= 2) {
        auto l = std::make_unique<LeaderEntity>(v, std::string());
        l->setDimStyle(AnnotationDefaults::dimStyle);
        out.push_back(std::move(l));
    }
}

// ================================================================ DIST / AREA / ID

CommandStatus DistCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!first_) { first_ = p; return CommandStatus::Continue; }
    const Vec2 d = p - *first_;
    ctx.say("Distance = " + f4(d.length()) + ",  Angle in XY plane = " + f4(geom::angleDeg(*first_, p)) + " deg");
    ctx.say("Delta X = " + f4(d.x) + ",  Delta Y = " + f4(d.y));
    return CommandStatus::Done;
}

std::string AreaCommand::prompt() const {
    if (object_) return "AREA  Select a closed object (circle, closed polyline, ellipse):";
    if (pts_.empty()) return "AREA  Specify first corner point or [Object]:";
    return "AREA  Specify next point (Enter to calculate):";
}

std::optional<Vec2> AreaCommand::basePoint() const {
    if (pts_.empty() || object_) return std::nullopt;
    return pts_.back();
}

CommandStatus AreaCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!object_) { pts_.push_back(p); return CommandStatus::Continue; }
    const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
    auto e = id ? ctx.doc.findEntity(id) : nullptr;
    double area = -1, perim = 0;
    if (e && e->type() == EntityType::Circle) {
        const auto& c = static_cast<const CircleEntity&>(*e);
        area = c.area();
        perim = c.circumference();
    } else if (e && e->type() == EntityType::Polyline && static_cast<const PolylineEntity&>(*e).isClosed()) {
        const auto& pl = static_cast<const PolylineEntity&>(*e);
        area = pl.area();
        perim = pl.length();
    } else if (e && e->type() == EntityType::Ellipse && static_cast<const EllipseEntity&>(*e).geom().isFull()) {
        const auto& el = static_cast<const EllipseEntity&>(*e);
        area = el.area();
        perim = el.length();
    }
    if (area < 0) { ctx.say("Select a circle, a closed polyline or a full ellipse."); return CommandStatus::Continue; }
    ctx.say("Area = " + f4(area) + ",  Perimeter = " + f4(perim));
    return CommandStatus::Done;
}

CommandStatus AreaCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (pts_.empty() && (kw == "O" || kw == "OBJECT")) { object_ = true; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus AreaCommand::enter(CommandContext& ctx) {
    if (pts_.size() < 3) { ctx.say("At least three points are needed."); return CommandStatus::Cancelled; }
    ctx.say("Area = " + f4(std::abs(geom::polygonSignedArea(pts_))) + ",  Perimeter = " + f4(geom::polylineLength(pts_, true)));
    return CommandStatus::Done;
}

void AreaCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (pts_.empty() || object_) return;
    std::vector<Vec2> v = pts_;
    v.push_back(cursor);
    if (v.size() >= 2) out.push_back(std::make_unique<PolylineEntity>(v, v.size() >= 3));
}

CommandStatus IdCommand::point(CommandContext& ctx, const Vec2& p) {
    ctx.say("X = " + f4(p.x) + "     Y = " + f4(p.y));
    return CommandStatus::Done;
}

} // namespace dyncad
