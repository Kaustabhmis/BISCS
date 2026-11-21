// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/BlockHatchCommands.h"

#include "commands/InputParser.h"
#include "entities/BlockEntities.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/PolylineEntity.h"
#include "geometry/Geometry.h"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace dyncad {

// ================================================================ BLOCK

CommandStatus BlockCommand::start(CommandContext& ctx) {
    pre_ = ctx.selection.ids();
    return CommandStatus::Continue;
}

std::string BlockCommand::prompt() const {
    switch (stage_) {
    case Stage::Name: return "BLOCK  Enter block name:";
    case Stage::Base: return "BLOCK  Specify base point (insertion point of the block):";
    case Stage::Objects: return "BLOCK  Select objects (Enter when done):";
    }
    return {};
}

CommandStatus BlockCommand::text(CommandContext& ctx, const std::string& raw) {
    const std::string n = trim(raw);
    if (!StyleTables::validName(n)) { ctx.say("Invalid block name."); return CommandStatus::Continue; }
    if (ctx.doc.findBlock(n)) { ctx.say("A block named \"" + n + "\" already exists; choose another name."); return CommandStatus::Continue; }
    name_ = n;
    stage_ = Stage::Base;
    return CommandStatus::Continue;
}

CommandStatus BlockCommand::point(CommandContext& ctx, const Vec2& p) {
    if (stage_ != Stage::Base) { ctx.say("Pick objects, then press Enter."); return CommandStatus::Continue; }
    base_ = p;
    if (!pre_.empty()) return create(ctx);
    stage_ = Stage::Objects;
    return CommandStatus::Continue;
}

CommandStatus BlockCommand::enter(CommandContext& ctx) {
    if (stage_ == Stage::Objects) {
        pre_ = ctx.selection.ids();
        if (pre_.empty()) return CommandStatus::Cancelled;
        return create(ctx);
    }
    return CommandStatus::Cancelled;
}

CommandStatus BlockCommand::create(CommandContext& ctx) {
    auto def = std::make_shared<BlockDef>();
    def->name = name_;
    const Affine2D toLocal = Affine2D::translation(-base_);
    for (EntityId id : pre_)
        if (auto e = ctx.doc.findEntity(id))
            if (auto t = e->transformed(toLocal)) def->entities.push_back(EntityPtr(std::move(t)));
    if (def->entities.empty()) { ctx.say("No objects selected."); return CommandStatus::Cancelled; }
    auto ins = std::make_shared<InsertEntity>(def, base_);
    const std::size_t n = def->entities.size();
    ctx.doc.defineBlockWithUndo(def, pre_, {ins});
    ctx.selection.clear();
    ctx.say("Block \"" + name_ + "\" defined from " + std::to_string(n) + " object(s).");
    return CommandStatus::Done;
}

// ================================================================ INSERT

CommandStatus InsertCommand::start(CommandContext& ctx) {
    if (ctx.doc.blocks().empty()) { ctx.say("This drawing has no blocks. Create one with BLOCK first."); return CommandStatus::Cancelled; }
    std::string names;
    for (const auto& kv : ctx.doc.blocks()) names += (names.empty() ? "" : ", ") + kv.second->name;
    ctx.say("Blocks: " + names);
    return CommandStatus::Continue;
}

std::string InsertCommand::prompt() const {
    switch (stage_) {
    case Stage::Name: return "INSERT  Enter block name:";
    case Stage::Position: return "INSERT  Specify insertion point:";
    case Stage::Scale: return "INSERT  Specify scale factor <1>:";
    case Stage::Rotation: return "INSERT  Specify rotation angle <0>:";
    }
    return {};
}

std::optional<Vec2> InsertCommand::basePoint() const {
    if (stage_ == Stage::Scale || stage_ == Stage::Rotation) return pos_;
    return std::nullopt;
}

CommandStatus InsertCommand::text(CommandContext& ctx, const std::string& raw) {
    block_ = ctx.doc.findBlock(trim(raw));
    if (!block_) { ctx.say("No block named \"" + trim(raw) + "\"."); return CommandStatus::Continue; }
    stage_ = Stage::Position;
    return CommandStatus::Continue;
}

CommandStatus InsertCommand::create(CommandContext& ctx) {
    (void)ctx;
    return CommandStatus::Done;
}

CommandStatus InsertCommand::point(CommandContext& ctx, const Vec2& p) {
    switch (stage_) {
    case Stage::Position: pos_ = p; stage_ = Stage::Scale; return CommandStatus::Continue;
    case Stage::Scale: {
        const double s = distance(pos_, p);
        if (!(s > 0)) { ctx.say("Scale must be greater than zero."); return CommandStatus::Continue; }
        scale_ = s;
        stage_ = Stage::Rotation;
        return CommandStatus::Continue;
    }
    case Stage::Rotation:
        ctx.doc.addWithUndo({std::make_shared<InsertEntity>(block_, pos_, scale_, scale_, geom::angleDeg(pos_, p))}, "Insert");
        return CommandStatus::Done;
    default: return CommandStatus::Continue;
    }
}

CommandStatus InsertCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Scale) {
        if (v == 0) { ctx.say("Scale cannot be zero."); return CommandStatus::Continue; }
        scale_ = v;
        stage_ = Stage::Rotation;
        return CommandStatus::Continue;
    }
    if (stage_ == Stage::Rotation) {
        ctx.doc.addWithUndo({std::make_shared<InsertEntity>(block_, pos_, scale_, scale_, v)}, "Insert");
        return CommandStatus::Done;
    }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus InsertCommand::enter(CommandContext& ctx) {
    if (stage_ == Stage::Scale) { scale_ = 1.0; stage_ = Stage::Rotation; return CommandStatus::Continue; }
    if (stage_ == Stage::Rotation) {
        ctx.doc.addWithUndo({std::make_shared<InsertEntity>(block_, pos_, scale_, scale_, 0.0)}, "Insert");
        return CommandStatus::Done;
    }
    return CommandStatus::Cancelled;
}

void InsertCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (!block_) return;
    if (stage_ == Stage::Position) out.push_back(std::make_unique<InsertEntity>(block_, cursor));
    else if (stage_ == Stage::Scale || stage_ == Stage::Rotation) {
        const double s = stage_ == Stage::Scale ? std::max(distance(pos_, cursor), 1e-9) : scale_;
        const double r = stage_ == Stage::Rotation ? geom::angleDeg(pos_, cursor) : 0.0;
        out.push_back(std::make_unique<InsertEntity>(block_, pos_, s, s, r));
    }
}

// ================================================================ HATCH

std::string HatchCommand::pattern_ = "ANSI31";
double HatchCommand::scale_ = 1.0;
double HatchCommand::angle_ = 0.0;

std::optional<HatchLoop> HatchCommand::loopOf(const Entity& e) {
    HatchLoop l;
    switch (e.type()) {
    case EntityType::Polyline: {
        const auto& p = static_cast<const PolylineEntity&>(e);
        if (!p.isClosed()) return std::nullopt;
        l.vertices = p.vertices();
        l.bulges = p.bulges();
        if (l.vertices.size() < 3 && !(l.vertices.size() == 2 && p.hasArcs())) return std::nullopt;
        return l;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(e);
        l.vertices = {c.center() + Vec2{c.radius(), 0}, c.center() - Vec2{c.radius(), 0}};
        l.bulges = {1.0, 1.0};
        return l;
    }
    case EntityType::Ellipse: {
        const EllipseGeom& g = static_cast<const EllipseEntity&>(e).geom();
        if (!g.isFull()) return std::nullopt;
        l.vertices = geom::tessellateEllipse(g, g.majorRadius() * 1e-4);
        l.vertices.pop_back(); // closing point repeats the first
        l.bulges.assign(l.vertices.size(), 0.0);
        return l;
    }
    case EntityType::Spline: {
        const auto& s = static_cast<const SplineEntity&>(e);
        if (!s.isClosed()) return std::nullopt;
        l.vertices = s.approximation();
        l.vertices.pop_back();
        l.bulges.assign(l.vertices.size(), 0.0);
        return l;
    }
    default: return std::nullopt;
    }
}

std::vector<HatchLoop> HatchCommand::boundaryAt(const Document& doc, const Vec2& p) {
    struct Cand { HatchLoop loop; double area; BoundingBox box; };
    std::vector<Cand> cands;
    for (const auto& e : doc.entities()) {
        if (!doc.isVisible(*e)) continue;
        if (auto l = loopOf(*e)) {
            HatchEntity tmp({*l}, HatchPattern{});
            cands.push_back({*l, tmp.area(), tmp.bounds()});
        }
    }
    // Outer boundary: the smallest closed object containing the point.
    const Cand* outer = nullptr;
    for (const auto& c : cands) {
        if (!c.box.contains(p)) continue;
        HatchEntity tmp({c.loop}, HatchPattern{});
        if (tmp.contains(p) && (!outer || c.area < outer->area)) outer = &c;
    }
    if (!outer) return {};
    std::vector<HatchLoop> loops{outer->loop};
    HatchEntity outerHatch({outer->loop}, HatchPattern{});
    // Islands: closed objects lying inside the outer boundary.
    for (const auto& c : cands) {
        if (&c == outer || !outer->box.contains(c.box) || c.area >= outer->area) continue;
        if (outerHatch.contains(c.loop.vertices.front())) loops.push_back(c.loop);
    }
    return loops;
}

std::vector<HatchLoop> HatchCommand::loopsFromEntities(const std::vector<EntityPtr>& ents) {
    std::vector<HatchLoop> out;
    for (const auto& e : ents)
        if (auto l = loopOf(*e)) out.push_back(*l);
    return out;
}

CommandStatus HatchCommand::start(CommandContext& ctx) {
    char b[96];
    std::snprintf(b, sizeof b, "Hatch pattern %s, scale %g, angle %g", pattern_.c_str(), scale_, angle_);
    ctx.say(b);
    return CommandStatus::Continue;
}

std::string HatchCommand::prompt() const {
    switch (stage_) {
    case Stage::Main: return "HATCH  Pick an internal point or [Pattern/Scale/Angle/Select objects] (Enter to finish):";
    case Stage::Pattern: return "HATCH  Enter pattern name [SOLID/ANSI31/ANSI32/ANSI37/NET/LINE/DASH]:";
    case Stage::Scale: return "HATCH  Specify pattern scale:";
    case Stage::Angle: return "HATCH  Specify pattern angle (degrees):";
    case Stage::Select: return "HATCH  Select closed objects (Enter when done):";
    }
    return {};
}

CommandStatus HatchCommand::create(CommandContext& ctx, std::vector<HatchLoop> loops) {
    if (loops.empty()) {
        ctx.say("No closed boundary found. Hatch boundaries must be closed polylines, circles, ellipses or closed splines.");
        return CommandStatus::Continue;
    }
    ctx.doc.addWithUndo({std::make_shared<HatchEntity>(std::move(loops), makeHatchPattern(pattern_, scale_, angle_))}, "Hatch");
    ++created_;
    return CommandStatus::Continue;
}

CommandStatus HatchCommand::point(CommandContext& ctx, const Vec2& p) {
    if (stage_ == Stage::Main) return create(ctx, boundaryAt(ctx.doc, p));
    if (stage_ == Stage::Select) { ctx.say("Pick closed objects, then press Enter."); return CommandStatus::Continue; }
    ctx.say("Type a value.");
    return CommandStatus::Continue;
}

CommandStatus HatchCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Scale) {
        if (!(v > 0)) { ctx.say("Scale must be greater than zero."); return CommandStatus::Continue; }
        scale_ = v; stage_ = Stage::Main; return CommandStatus::Continue;
    }
    if (stage_ == Stage::Angle) { angle_ = v; stage_ = Stage::Main; return CommandStatus::Continue; }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus HatchCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Pattern) {
        const auto names = builtinHatchNames();
        if (std::find(names.begin(), names.end(), kw) == names.end()) { ctx.say("Unknown pattern " + kw + "."); return CommandStatus::Continue; }
        pattern_ = kw;
        stage_ = Stage::Main;
        return CommandStatus::Continue;
    }
    if (stage_ == Stage::Main) {
        if (kw == "P" || kw == "PATTERN") { stage_ = Stage::Pattern; return CommandStatus::Continue; }
        if (kw == "S" || kw == "SCALE") { stage_ = Stage::Scale; return CommandStatus::Continue; }
        if (kw == "A" || kw == "ANGLE") { stage_ = Stage::Angle; return CommandStatus::Continue; }
        if (kw == "O" || kw == "SELECT") { stage_ = Stage::Select; ctx.selection.clear(); return CommandStatus::Continue; }
        const auto names = builtinHatchNames();
        if (std::find(names.begin(), names.end(), kw) != names.end()) { pattern_ = kw; return CommandStatus::Continue; }
    }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus HatchCommand::enter(CommandContext& ctx) {
    if (stage_ == Stage::Select) {
        std::vector<EntityPtr> ents;
        for (EntityId id : ctx.selection.ids())
            if (auto e = ctx.doc.findEntity(id)) ents.push_back(e);
        ctx.selection.clear();
        stage_ = Stage::Main;
        return create(ctx, loopsFromEntities(ents));
    }
    if (stage_ != Stage::Main) { stage_ = Stage::Main; return CommandStatus::Continue; }
    return created_ ? CommandStatus::Done : CommandStatus::Cancelled;
}

} // namespace dyncad
