// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/ModifyCommands.h"

#include "entities/ArcEntity.h"
#include "entities/BlockEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Geometry.h"

#include <cmath>
#include <functional>

namespace dyncad {

namespace {
constexpr std::size_t kMaxPreview = 300;
std::string plural(std::size_t n, const char* one, const char* many) { return std::to_string(n) + " " + (n == 1 ? one : many); }
} // namespace

// ================================================================ base

CommandStatus SelectingCommand::start(CommandContext& ctx) {
    doc_ = &ctx.doc;
    if (!ctx.selection.empty()) {
        ids_ = ctx.selection.ids();
        selecting_ = false;
        return afterSelection(ctx);
    }
    return CommandStatus::Continue;
}

std::string SelectingCommand::prompt() const {
    if (selecting_) return name() + "  Select objects (Enter when done):";
    return name() + "  " + stagePrompt();
}

CommandStatus SelectingCommand::enter(CommandContext& ctx) {
    if (selecting_) {
        if (ctx.selection.empty()) return CommandStatus::Cancelled;
        ids_ = ctx.selection.ids();
        selecting_ = false;
        ctx.say(plural(ids_.size(), "object", "objects") + " selected.");
        return afterSelection(ctx);
    }
    return stageEnter(ctx);
}

CommandStatus SelectingCommand::point(CommandContext& ctx, const Vec2& p) {
    if (selecting_) { ctx.say("Pick objects with the cursor, then press Enter."); return CommandStatus::Continue; }
    if (!p.isFinite()) { ctx.say("Invalid point."); return CommandStatus::Continue; }
    return stagePoint(ctx, p);
}

std::vector<EntityPtr> SelectingCommand::selected() const {
    std::vector<EntityPtr> out;
    if (!doc_) return out;
    for (EntityId id : ids_)
        if (auto e = doc_->findEntity(id)) out.push_back(e);
    return out;
}

void SelectingCommand::applyTransform(CommandContext& ctx, const Affine2D& xf, bool copy, const std::string& what) {
    std::vector<std::pair<EntityId, EntityPtr>> repl;
    std::vector<EntityPtr> copies;
    std::size_t failed = 0;
    for (const auto& e : selected()) {
        auto t = e->transformed(xf);
        if (!t) { ++failed; continue; }
        if (copy) copies.push_back(EntityPtr(std::move(t)));
        else repl.emplace_back(e->id(), EntityPtr(std::move(t)));
    }
    if (copy) ctx.doc.addWithUndo(std::move(copies), what);
    else ctx.doc.modifyWithUndo(std::move(repl), what);
    if (failed) ctx.say(plural(failed, "object", "objects") + " could not be transformed and were left unchanged.");
}

void SelectingCommand::previewTransform(const Affine2D& xf, std::vector<std::unique_ptr<Entity>>& out) const {
    std::size_t n = 0;
    for (const auto& e : selected()) {
        if (++n > kMaxPreview) break;
        if (auto t = e->transformed(xf)) out.push_back(std::move(t));
    }
}

// ================================================================ MOVE / COPY

std::string MoveCommand::stagePrompt() const {
    if (!base_) return "Specify base point:";
    return copy_ ? "Specify second point (or @dx,dy; Enter to finish):" : "Specify second point (or @dx,dy):";
}

CommandStatus MoveCommand::stagePoint(CommandContext& ctx, const Vec2& p) {
    if (!base_) { base_ = p; return CommandStatus::Continue; }
    applyTransform(ctx, Affine2D::translation(p - *base_), copy_, copy_ ? "Copy" : "Move");
    if (copy_) { ++copies_; return CommandStatus::Continue; } // multiple copies until Enter
    ctx.selection.clear();
    return CommandStatus::Done;
}

void MoveCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (base_) {
        previewTransform(Affine2D::translation(cursor - *base_), out);
        out.push_back(std::make_unique<LineEntity>(*base_, cursor));
    }
}

// ================================================================ ROTATE

std::string RotateCommand::stagePrompt() const {
    if (!base_) return "Specify base point:";
    return copy_ ? "Specify rotation angle (degrees or point) [Copy is ON]:" : "Specify rotation angle (degrees or point) or [Copy]:";
}

CommandStatus RotateCommand::rotate(CommandContext& ctx, double deg) {
    const Affine2D xf = Affine2D::translation(*base_) * Affine2D::rotationDeg(deg) * Affine2D::translation(-*base_);
    applyTransform(ctx, xf, copy_, "Rotate");
    ctx.selection.clear();
    return CommandStatus::Done;
}

CommandStatus RotateCommand::stagePoint(CommandContext& ctx, const Vec2& p) {
    if (!base_) { base_ = p; return CommandStatus::Continue; }
    if (nearlyEqual(p, *base_, 0.0)) { ctx.say("Pick a point away from the base point."); return CommandStatus::Continue; }
    return rotate(ctx, geom::angleDeg(*base_, p));
}

CommandStatus RotateCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (!selecting_ && base_) return rotate(ctx, v);
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus RotateCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (base_ && (kw == "C" || kw == "COPY")) { copy_ = !copy_; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

void RotateCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (base_ && !nearlyEqual(cursor, *base_, 0.0)) {
        const double deg = geom::angleDeg(*base_, cursor);
        previewTransform(Affine2D::translation(*base_) * Affine2D::rotationDeg(deg) * Affine2D::translation(-*base_), out);
        out.push_back(std::make_unique<LineEntity>(*base_, cursor));
    }
}

// ================================================================ SCALE

std::string ScaleCommand::stagePrompt() const {
    switch (stage_) {
    case Stage::Base: return "Specify base point:";
    case Stage::Factor: return std::string("Specify scale factor or [Reference") + (copy_ ? "] (Copy is ON):" : "/Copy]:");
    case Stage::RefLength: return "Specify reference length:";
    case Stage::NewLength: return "Specify new length:";
    }
    return {};
}

CommandStatus ScaleCommand::scale(CommandContext& ctx, double f) {
    if (!(f > 0) || !std::isfinite(f)) { ctx.say("Scale factor must be greater than zero."); return CommandStatus::Continue; }
    const Affine2D xf = Affine2D::translation(*base_) * Affine2D::scaling(f, f) * Affine2D::translation(-*base_);
    applyTransform(ctx, xf, copy_, "Scale");
    ctx.selection.clear();
    return CommandStatus::Done;
}

CommandStatus ScaleCommand::stagePoint(CommandContext& ctx, const Vec2& p) {
    switch (stage_) {
    case Stage::Base: base_ = p; stage_ = Stage::Factor; return CommandStatus::Continue;
    case Stage::Factor: return scale(ctx, distance(*base_, p)); // distance from base = factor
    case Stage::RefLength: ref_ = distance(*base_, p); stage_ = Stage::NewLength; return CommandStatus::Continue;
    case Stage::NewLength: return scale(ctx, distance(*base_, p) / ref_);
    }
    return CommandStatus::Continue;
}

CommandStatus ScaleCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Factor) return scale(ctx, v);
    if (stage_ == Stage::RefLength) {
        if (!(v > 0)) { ctx.say("Reference length must be greater than zero."); return CommandStatus::Continue; }
        ref_ = v; stage_ = Stage::NewLength; return CommandStatus::Continue;
    }
    if (stage_ == Stage::NewLength) return scale(ctx, v / ref_);
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus ScaleCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Factor && (kw == "R" || kw == "REFERENCE")) { stage_ = Stage::RefLength; return CommandStatus::Continue; }
    if (stage_ == Stage::Factor && (kw == "C" || kw == "COPY")) { copy_ = !copy_; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

void ScaleCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ == Stage::Factor) {
        const double f = distance(*base_, cursor);
        if (f > 0) previewTransform(Affine2D::translation(*base_) * Affine2D::scaling(f, f) * Affine2D::translation(-*base_), out);
        out.push_back(std::make_unique<LineEntity>(*base_, cursor));
    }
}

// ================================================================ MIRROR

Affine2D MirrorCommand::mirrorAbout(const Vec2& a, const Vec2& b) {
    // Reflection across the line a-b: translate, rotate to X, flip Y, back.
    const double ang = std::atan2(b.y - a.y, b.x - a.x);
    const double c = std::cos(2 * ang), s = std::sin(2 * ang);
    Affine2D r;
    r.a = c; r.b = s; r.c = s; r.d = -c;
    // Exact for horizontal / vertical mirror lines.
    if (a.y == b.y) { r.a = 1; r.b = 0; r.c = 0; r.d = -1; }
    if (a.x == b.x) { r.a = -1; r.b = 0; r.c = 0; r.d = 1; }
    return Affine2D::translation(a) * r * Affine2D::translation(-a);
}

std::string MirrorCommand::stagePrompt() const {
    if (!p1_) return "Specify first point of mirror line:";
    if (!p2_) return "Specify second point of mirror line:";
    return "Erase source objects? [Yes/No] <N>:";
}

CommandStatus MirrorCommand::stagePoint(CommandContext& ctx, const Vec2& p) {
    if (!p1_) { p1_ = p; return CommandStatus::Continue; }
    if (!p2_) {
        if (nearlyEqual(p, *p1_, 0.0)) { ctx.say("The mirror line needs two different points."); return CommandStatus::Continue; }
        p2_ = p;
        return CommandStatus::Continue;
    }
    ctx.say("Answer Y or N.");
    return CommandStatus::Continue;
}

CommandStatus MirrorCommand::finish(CommandContext& ctx, bool eraseSource) {
    applyTransform(ctx, mirrorAbout(*p1_, *p2_), !eraseSource, "Mirror");
    ctx.selection.clear();
    return CommandStatus::Done;
}

CommandStatus MirrorCommand::stageEnter(CommandContext& ctx) {
    if (p2_) return finish(ctx, false);
    return CommandStatus::Cancelled;
}

CommandStatus MirrorCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (p2_ && (kw == "Y" || kw == "YES")) return finish(ctx, true);
    if (p2_ && (kw == "N" || kw == "NO")) return finish(ctx, false);
    return InteractiveCommand::keyword(ctx, kw);
}

void MirrorCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (p1_ && !p2_ && !nearlyEqual(cursor, *p1_, 0.0)) {
        previewTransform(mirrorAbout(*p1_, cursor), out);
        out.push_back(std::make_unique<LineEntity>(*p1_, cursor));
    }
}

// ================================================================ ARRAY

std::string ArrayCommand::stagePrompt() const {
    switch (stage_) {
    case Stage::Type: return "Enter array type [Rectangular/Polar] <R>:";
    case Stage::Rows: return "Enter number of rows <" + std::to_string(rows_) + ">:";
    case Stage::Cols: return "Enter number of columns <" + std::to_string(cols_) + ">:";
    case Stage::RowSpacing: return "Enter distance between rows (+ up, - down):";
    case Stage::ColSpacing: return "Enter distance between columns (+ right, - left):";
    case Stage::Center: return "Specify center point of array:";
    case Stage::Items: return "Enter number of items, including the original <" + std::to_string(items_) + ">:";
    case Stage::Fill: return "Specify angle to fill (+ = counter-clockwise) <360>:";
    case Stage::Rotate: return "Rotate arrayed objects? [Yes/No] <Y>:";
    }
    return {};
}

CommandStatus ArrayCommand::buildRect(CommandContext& ctx) {
    std::vector<EntityPtr> copies;
    const auto src = selected();
    for (int r = 0; r < rows_; ++r)
        for (int c = 0; c < cols_; ++c) {
            if (r == 0 && c == 0) continue;
            const Affine2D xf = Affine2D::translation({c * colSp_, r * rowSp_});
            for (const auto& e : src)
                if (auto t = e->transformed(xf)) copies.push_back(EntityPtr(std::move(t)));
        }
    ctx.doc.addWithUndo(std::move(copies), "Array");
    ctx.selection.clear();
    return CommandStatus::Done;
}

CommandStatus ArrayCommand::buildPolar(CommandContext& ctx, bool rotateItems) {
    std::vector<EntityPtr> copies;
    const auto src = selected();
    // Full circle: items spread over 360 without repeating the original.
    const bool full = std::abs(std::abs(fill_) - 360.0) < 1e-9;
    const double step = full ? fill_ / items_ : fill_ / (items_ - 1);
    BoundingBox bb;
    for (const auto& e : src) bb.expand(e->bounds());
    const Vec2 ref = bb.isValid() ? bb.center() : center_;
    for (int i = 1; i < items_; ++i) {
        const double deg = step * i;
        Affine2D xf;
        if (rotateItems) {
            xf = Affine2D::translation(center_) * Affine2D::rotationDeg(deg) * Affine2D::translation(-center_);
        } else { // translate the objects so their centre follows the circle
            const Affine2D rot = Affine2D::translation(center_) * Affine2D::rotationDeg(deg) * Affine2D::translation(-center_);
            xf = Affine2D::translation(rot.apply(ref) - ref);
        }
        for (const auto& e : src)
            if (auto t = e->transformed(xf)) copies.push_back(EntityPtr(std::move(t)));
    }
    ctx.doc.addWithUndo(std::move(copies), "Array");
    ctx.selection.clear();
    return CommandStatus::Done;
}

CommandStatus ArrayCommand::stagePoint(CommandContext& ctx, const Vec2& p) {
    if (stage_ == Stage::Center) { center_ = p; stage_ = Stage::Items; return CommandStatus::Continue; }
    ctx.say("Please type a value.");
    return CommandStatus::Continue;
}

CommandStatus ArrayCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    auto whole = [&](double x, int lo, int hi) { return x == std::floor(x) && x >= lo && x <= hi; };
    switch (stage_) {
    case Stage::Rows:
        if (!whole(v, 1, 10000)) { ctx.say("Rows must be a whole number from 1 to 10000."); return CommandStatus::Continue; }
        rows_ = int(v); stage_ = Stage::Cols; return CommandStatus::Continue;
    case Stage::Cols:
        if (!whole(v, 1, 10000)) { ctx.say("Columns must be a whole number from 1 to 10000."); return CommandStatus::Continue; }
        cols_ = int(v);
        if (rows_ * cols_ < 2) { ctx.say("The array needs at least 2 items."); stage_ = Stage::Rows; return CommandStatus::Continue; }
        if (static_cast<long long>(rows_) * cols_ * static_cast<long long>(ids_.size()) > 2000000) {
            ctx.say("That array would create more than 2 million objects."); stage_ = Stage::Rows; return CommandStatus::Continue;
        }
        stage_ = rows_ > 1 ? Stage::RowSpacing : Stage::ColSpacing;
        return CommandStatus::Continue;
    case Stage::RowSpacing:
        rowSp_ = v;
        if (cols_ > 1) { stage_ = Stage::ColSpacing; return CommandStatus::Continue; }
        return buildRect(ctx);
    case Stage::ColSpacing: colSp_ = v; return buildRect(ctx);
    case Stage::Items:
        if (!whole(v, 2, 100000)) { ctx.say("Number of items must be a whole number from 2 to 100000."); return CommandStatus::Continue; }
        items_ = int(v); stage_ = Stage::Fill; return CommandStatus::Continue;
    case Stage::Fill:
        if (v == 0 || std::abs(v) > 360) { ctx.say("Fill angle must be between -360 and 360 (not 0)."); return CommandStatus::Continue; }
        fill_ = v; stage_ = Stage::Rotate; return CommandStatus::Continue;
    default: return InteractiveCommand::number(ctx, v, cursor);
    }
}

CommandStatus ArrayCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Type && (kw == "R" || kw == "RECTANGULAR")) { stage_ = Stage::Rows; return CommandStatus::Continue; }
    if (stage_ == Stage::Type && (kw == "P" || kw == "POLAR")) { stage_ = Stage::Center; return CommandStatus::Continue; }
    if (stage_ == Stage::Rotate && (kw == "Y" || kw == "YES")) return buildPolar(ctx, true);
    if (stage_ == Stage::Rotate && (kw == "N" || kw == "NO")) return buildPolar(ctx, false);
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus ArrayCommand::stageEnter(CommandContext& ctx) {
    switch (stage_) {
    case Stage::Type: stage_ = Stage::Rows; return CommandStatus::Continue;
    case Stage::Rows: stage_ = Stage::Cols; return CommandStatus::Continue;
    case Stage::Cols: return number(ctx, cols_, std::nullopt);
    case Stage::Items: stage_ = Stage::Fill; return CommandStatus::Continue;
    case Stage::Fill: fill_ = 360; stage_ = Stage::Rotate; return CommandStatus::Continue;
    case Stage::Rotate: return buildPolar(ctx, true);
    default: return CommandStatus::Cancelled;
    }
}

// ================================================================ EXPLODE

std::vector<EntityPtr> ExplodeCommand::explode(const Entity& e) {
    std::vector<EntityPtr> out;
    if (e.type() == EntityType::Insert) return static_cast<const InsertEntity&>(e).explode();
    if (e.type() != EntityType::Polyline) return out;
    const auto& pl = static_cast<const PolylineEntity&>(e);
    for (std::size_t i = 0; i < pl.segmentCount(); ++i) {
        EntityPtr piece;
        if (auto a = pl.segmentArc(i)) {
            double s = radToDeg(a->startAngle), t = radToDeg(a->startAngle + a->sweep);
            if (a->sweep < 0) std::swap(s, t); // ArcEntity is counter-clockwise
            piece = std::make_shared<ArcEntity>(a->center, a->radius, s, t);
        } else {
            piece = std::make_shared<LineEntity>(pl.segmentStart(i), pl.segmentEnd(i));
        }
        piece->copyStyleFrom(e);
        out.push_back(piece);
    }
    return out;
}

CommandStatus ExplodeCommand::afterSelection(CommandContext& ctx) {
    std::vector<EntityId> erase;
    std::vector<EntityPtr> add;
    std::size_t skipped = 0, widthLost = 0;
    for (const auto& e : selected()) {
        auto parts = explode(*e);
        if (parts.empty()) { ++skipped; continue; }
        if (e->type() == EntityType::Polyline && static_cast<const PolylineEntity&>(*e).width() > 0) ++widthLost;
        erase.push_back(e->id());
        for (auto& p : parts) add.push_back(p);
    }
    ctx.doc.changeWithUndo(erase, std::move(add), "Explode");
    ctx.selection.clear();
    ctx.say(plural(erase.size(), "object", "objects") + " exploded.");
    if (skipped) ctx.say(plural(skipped, "object", "objects") + " cannot be exploded (polylines and block references can).");
    if (widthLost) ctx.say("Polyline width is not kept by EXPLODE.");
    return CommandStatus::Done;
}

// ================================================================ JOIN

namespace {
struct Chain {
    std::vector<Vec2> v;
    std::vector<double> b; // size == v.size(); b.back() unused
    std::vector<EntityId> ids;
    EntityStyle style;
    Vec2 front() const { return v.front(); }
    Vec2 back() const { return v.back(); }
    void reverse() {
        std::vector<Vec2> nv(v.rbegin(), v.rend());
        std::vector<double> nb(v.size(), 0.0);
        for (std::size_t i = 0; i + 1 < v.size(); ++i) nb[i] = -b[v.size() - 2 - i];
        v = std::move(nv);
        b = std::move(nb);
    }
    void append(const Chain& o) { // o.front() == back()
        b.back() = o.b.front();
        for (std::size_t i = 1; i < o.v.size(); ++i) { v.push_back(o.v[i]); b.push_back(o.b[i]); }
        ids.insert(ids.end(), o.ids.begin(), o.ids.end());
    }
};

std::optional<Chain> toChain(const Entity& e) {
    Chain c;
    c.ids = {e.id()};
    c.style = e.style();
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        c.v = {l.start(), l.end()};
        c.b = {0, 0};
        return c;
    }
    case EntityType::Arc: {
        const ArcGeom g = static_cast<const ArcEntity&>(e).geom();
        c.v = {g.startPoint(), g.endPoint()};
        c.b = {std::tan(g.sweep / 4.0), 0};
        return c;
    }
    case EntityType::Polyline: {
        const auto& p = static_cast<const PolylineEntity&>(e);
        if (p.isClosed() || p.width() > 0) return std::nullopt;
        c.v = p.vertices();
        c.b = p.bulges();
        return c;
    }
    default: return std::nullopt;
    }
}
} // namespace

std::vector<EntityPtr> JoinCommand::join(const std::vector<EntityPtr>& pieces, std::vector<EntityId>& consumed, double tol) {
    std::vector<Chain> chains;
    for (const auto& e : pieces)
        if (auto c = toChain(*e)) chains.push_back(std::move(*c));
    std::vector<bool> used(chains.size(), false);
    std::vector<EntityPtr> out;
    auto close = [&](const Vec2& a, const Vec2& b) { return distance(a, b) <= tol; };
    for (std::size_t i = 0; i < chains.size(); ++i) {
        if (used[i]) continue;
        used[i] = true;
        Chain cur = chains[i];
        bool grew = true;
        while (grew) {
            grew = false;
            for (std::size_t j = 0; j < chains.size(); ++j) {
                if (used[j]) continue;
                Chain c = chains[j];
                if (close(cur.back(), c.front())) {}
                else if (close(cur.back(), c.back())) c.reverse();
                else if (close(cur.front(), c.back())) { std::swap(cur, c); }
                else if (close(cur.front(), c.front())) { cur.reverse(); }
                else continue;
                c.v.front() = cur.back(); // weld exactly
                cur.append(c);
                used[j] = true;
                grew = true;
            }
        }
        if (cur.ids.size() < 2) continue; // nothing joined
        const bool closed = cur.v.size() > 2 && close(cur.front(), cur.back());
        if (closed) { cur.v.pop_back(); cur.b.pop_back(); }
        // All collinear straight pieces running one way -> a single line.
        bool straight = !closed;
        for (std::size_t k = 0; straight && k + 1 < cur.v.size(); ++k) straight = cur.b[k] == 0.0;
        if (straight) {
            const Vec2 a = cur.v.front(), z = cur.v.back();
            const Vec2 u = (z - a).normalized();
            double last = -1;
            for (const Vec2& p : cur.v) {
                const double t = (p - a).dot(u);
                if (std::abs(u.cross(p - a)) > tol || t < last - tol) { straight = false; break; }
                last = t;
            }
        }
        EntityPtr e;
        if (straight) e = std::make_shared<LineEntity>(cur.v.front(), cur.v.back());
        else e = std::make_shared<PolylineEntity>(cur.v, cur.b, closed);
        e->setStyle(cur.style);
        out.push_back(e);
        consumed.insert(consumed.end(), cur.ids.begin(), cur.ids.end());
    }
    return out;
}

CommandStatus JoinCommand::afterSelection(CommandContext& ctx) {
    const auto sel = selected();
    BoundingBox bb;
    for (const auto& e : sel) bb.expand(e->bounds());
    const double tol = std::max(1e-9, 1e-9 * std::max(bb.width(), bb.height()));
    std::vector<EntityId> consumed;
    auto joined = join(sel, consumed, tol);
    if (joined.empty()) {
        ctx.say("No objects could be joined (lines, arcs and open polylines must touch end to end).");
        return CommandStatus::Done;
    }
    const std::size_t n = consumed.size();
    ctx.doc.changeWithUndo(consumed, std::move(joined), "Join");
    ctx.selection.clear();
    ctx.say(plural(n, "object", "objects") + " joined.");
    return CommandStatus::Done;
}

// ================================================================ MATCHPROP

void changeEntityStyles(Document& doc, const std::vector<EntityId>& ids, const std::function<void(EntityStyle&)>& change,
                        const std::string& what) {
    std::vector<std::pair<EntityId, EntityPtr>> repl;
    for (EntityId id : ids) {
        auto e = doc.findEntity(id);
        if (!e) continue;
        EntityStyle st = e->style();
        change(st);
        if (st == e->style()) continue;
        EntityPtr copy(e->clone());
        copy->setStyle(st);
        repl.emplace_back(id, copy);
    }
    doc.modifyWithUndo(std::move(repl), what);
}

CommandStatus MatchPropCommand::point(CommandContext& ctx, const Vec2& p) {
    if (source_) { ctx.say("Pick destination objects with the cursor, then press Enter."); return CommandStatus::Continue; }
    const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
    if (!id) { ctx.say("No object at that point."); return CommandStatus::Continue; }
    source_ = ctx.doc.findEntity(id)->style();
    ctx.selection.clear();
    return CommandStatus::Continue;
}

CommandStatus MatchPropCommand::enter(CommandContext& ctx) {
    if (!source_ || ctx.selection.empty()) return CommandStatus::Cancelled;
    const EntityStyle src = *source_;
    const auto ids = ctx.selection.ids();
    changeEntityStyles(ctx.doc, ids, [&](EntityStyle& st) { st = src; }, "Match properties");
    ctx.selection.clear();
    ctx.say(std::to_string(ids.size()) + (ids.size() == 1 ? " object matched." : " objects matched."));
    return CommandStatus::Done;
}

} // namespace dyncad
