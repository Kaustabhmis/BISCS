// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/Annotation.h"

#include "geometry/Arc.h"
#include "geometry/Geometry.h"

#include <cmath>
#include <cstdio>
#include <limits>
#include <sstream>

namespace dyncad {

// ================================================================ text metrics / layout

namespace {
TextWidthFunction& widthFn() {
    static TextWidthFunction fn;
    return fn;
}
std::size_t utf8Length(const std::string& s) {
    std::size_t n = 0;
    for (unsigned char c : s) n += (c & 0xC0) != 0x80;
    return n;
}
// Readable direction: rotation normalised into (-90, 90].
double readable(double deg) {
    double r = std::fmod(deg, 360.0);
    if (r <= -180) r += 360;
    if (r > 180) r -= 360;
    if (r > 90.0 + 1e-9) r -= 180;
    if (r <= -90.0 + 1e-9) r += 180;
    return r;
}
} // namespace

void setTextWidthFunction(TextWidthFunction fn) { widthFn() = std::move(fn); }

double textWidth(const std::string& line, const std::string& font, double height) {
    if (widthFn()) return widthFn()(line, font, height);
    return 0.6 * height * static_cast<double>(utf8Length(line));
}

const char* justifyName(TextJustify j) {
    switch (j) {
    case TextJustify::Left: return "Left";
    case TextJustify::Center: return "Center";
    case TextJustify::Right: return "Right";
    case TextJustify::Middle: return "Middle";
    case TextJustify::TopLeft: return "TopLeft";
    }
    return "Left";
}

bool parseJustify(const std::string& kw, TextJustify& out) {
    if (kw == "L" || kw == "LEFT") out = TextJustify::Left;
    else if (kw == "C" || kw == "CENTER") out = TextJustify::Center;
    else if (kw == "R" || kw == "RIGHT") out = TextJustify::Right;
    else if (kw == "M" || kw == "MIDDLE") out = TextJustify::Middle;
    else if (kw == "TL" || kw == "TOPLEFT") out = TextJustify::TopLeft;
    else return false;
    return true;
}

TextLayout layoutText(const std::string& text, double h, TextJustify justify, const std::string& font, double wrap) {
    // Split into paragraphs, then wrap words.
    std::vector<std::string> lines;
    std::stringstream ss(text);
    std::string para;
    while (std::getline(ss, para, '\n')) {
        if (wrap <= 0 || textWidth(para, font, h) <= wrap) { lines.push_back(para); continue; }
        std::istringstream words(para);
        std::string w, cur;
        while (words >> w) {
            const std::string trial = cur.empty() ? w : cur + " " + w;
            if (!cur.empty() && textWidth(trial, font, h) > wrap) { lines.push_back(cur); cur = w; }
            else cur = trial;
        }
        lines.push_back(cur);
    }
    if (lines.empty()) lines.push_back(std::string());
    TextLayout out;
    double maxW = 0;
    for (const auto& l : lines) maxW = std::max(maxW, textWidth(l, font, h));
    const double step = h * kLineSpacing;
    const double totalH = h + step * static_cast<double>(lines.size() - 1);
    for (std::size_t i = 0; i < lines.size(); ++i) {
        const double w = textWidth(lines[i], font, h);
        double x = 0, y = -step * static_cast<double>(i);
        switch (justify) {
        case TextJustify::Left: break;
        case TextJustify::Center: x = -w / 2; break;
        case TextJustify::Right: x = -w; break;
        case TextJustify::Middle: x = -w / 2; y += totalH / 2 - h; break;
        case TextJustify::TopLeft: y -= h; break;
        }
        out.lines.push_back({lines[i], {x, y}});
        out.box.expand(Vec2{x, y - 0.3 * h});
        out.box.expand(Vec2{x + std::max(w, h * 0.1), y + h});
    }
    (void)maxW;
    return out;
}

// ================================================================ TextEntity

TextEntity::TextEntity(const Vec2& insert, const std::string& text, double height, double rotationDeg, TextJustify justify)
    : insert_(insert), text_(text), height_(height > 0 ? height : 2.5), rotation_(rotationDeg), justify_(justify) {}

Vec2 TextEntity::toWorld(const Vec2& l) const {
    const double r = degToRad(rotation_);
    const double c = std::cos(r), s = std::sin(r);
    return insert_ + Vec2{l.x * c - l.y * s, l.x * s + l.y * c};
}

std::array<Vec2, 4> TextEntity::corners() const {
    const BoundingBox b = layout().box;
    return {toWorld(b.min), toWorld({b.max.x, b.min.y}), toWorld(b.max), toWorld({b.min.x, b.max.y})};
}

BoundingBox TextEntity::bounds() const {
    BoundingBox b;
    for (const Vec2& p : corners()) b.expand(p);
    return b;
}

double TextEntity::distanceTo(const Vec2& p) const {
    // Inside the text box counts as a hit.
    const auto c = corners();
    bool inside = true;
    for (int i = 0; i < 4; ++i)
        if ((c[(i + 1) % 4] - c[i]).cross(p - c[i]) < 0) inside = false;
    if (inside) return 0.0;
    double d = std::numeric_limits<double>::infinity();
    for (int i = 0; i < 4; ++i) d = std::min(d, geom::distancePointToSegment(p, c[i], c[(i + 1) % 4]));
    return d;
}

bool TextEntity::crossesRect(const BoundingBox& r) const {
    const auto c = corners();
    for (int i = 0; i < 4; ++i)
        if (geom::segmentIntersectsRect(c[i], c[(i + 1) % 4], r)) return true;
    return distanceTo(r.center()) == 0.0;
}

std::unique_ptr<Entity> TextEntity::transformed(const Affine2D& xf) const {
    auto t = std::make_unique<TextEntity>(*this);
    t->insert_ = xf.apply(insert_);
    const Vec2 dir = xf.applyVector(Vec2::fromPolar(1.0, degToRad(rotation_)));
    double rot = radToDeg(std::atan2(dir.y, dir.x));
    if (xf.det() < 0) rot = readable(rot); // mirrored text stays readable
    t->rotation_ = rot;
    const double s = xf.uniformScale();
    t->height_ = height_ * s;
    t->wrap_ = wrap_ * s;
    return t;
}

// ================================================================ graphics helpers

namespace {
std::array<Vec2, 3> arrowAt(const Vec2& tip, const Vec2& dirInto, double size) {
    // Filled arrow with its tip at 'tip', pointing along -dirInto... i.e. the
    // arrow body lies on the dirInto side of the tip. Length:width = 3:1.
    const Vec2 u = dirInto.normalized();
    const Vec2 n{-u.y, u.x};
    const Vec2 base = tip + u * size;
    return {tip, base + n * (size / 6.0), base - n * (size / 6.0)};
}

std::array<Vec2, 4> textCorners(const AnnotationGraphics::Text& t) {
    TextEntity tmp(t.position, t.text, t.height, t.rotationDeg, t.justify);
    tmp.setFont(t.font);
    return tmp.corners();
}
} // namespace

BoundingBox AnnotationGraphics::bounds() const {
    BoundingBox b;
    for (const auto& l : lines) { b.expand(l.first); b.expand(l.second); }
    for (const auto& a : arrows) for (const Vec2& p : a) b.expand(p);
    for (const auto& t : texts) for (const Vec2& p : textCorners(t)) b.expand(p);
    return b;
}

double AnnotationGraphics::distanceTo(const Vec2& p) const {
    double d = std::numeric_limits<double>::infinity();
    for (const auto& l : lines) d = std::min(d, geom::distancePointToSegment(p, l.first, l.second));
    for (const auto& a : arrows)
        for (int i = 0; i < 3; ++i) d = std::min(d, geom::distancePointToSegment(p, a[i], a[(i + 1) % 3]));
    for (const auto& t : texts) {
        TextEntity tmp(t.position, t.text, t.height, t.rotationDeg, t.justify);
        tmp.setFont(t.font);
        d = std::min(d, tmp.distanceTo(p));
    }
    return d;
}

bool AnnotationGraphics::crossesRect(const BoundingBox& r) const {
    for (const auto& l : lines) if (geom::segmentIntersectsRect(l.first, l.second, r)) return true;
    for (const auto& a : arrows)
        for (int i = 0; i < 3; ++i) if (geom::segmentIntersectsRect(a[i], a[(i + 1) % 3], r)) return true;
    for (const auto& t : texts) {
        TextEntity tmp(t.position, t.text, t.height, t.rotationDeg, t.justify);
        tmp.setFont(t.font);
        if (tmp.crossesRect(r)) return true;
    }
    return false;
}

std::string formatMeasurement(double v, int precision, bool suppressZeros) {
    char buf[64];
    std::snprintf(buf, sizeof buf, "%.*f", std::max(0, std::min(precision, 8)), v);
    std::string s = buf;
    if (suppressZeros && s.find('.') != std::string::npos) {
        while (!s.empty() && s.back() == '0') s.pop_back();
        if (!s.empty() && s.back() == '.') s.pop_back();
    }
    if (s == "-0") s = "0";
    return s;
}

const char* dimKindName(DimKind k) {
    switch (k) {
    case DimKind::Linear: return "Linear";
    case DimKind::Aligned: return "Aligned";
    case DimKind::Angular: return "Angular";
    case DimKind::Radius: return "Radius";
    case DimKind::Diameter: return "Diameter";
    }
    return "";
}

// ================================================================ DimensionEntity

DimensionEntity::DimensionEntity(DimKind kind, const Vec2& a, const Vec2& b, const Vec2& loc, double angleDeg)
    : kind_(kind), a_(a), b_(b), c_(b), loc_(loc), angle_(angleDeg) {}

std::vector<Vec2> DimensionEntity::gripPoints() const {
    if (kind_ == DimKind::Angular) return {a_, b_, c_, loc_};
    return {a_, b_, loc_};
}

void DimensionEntity::setPoint(std::size_t i, const Vec2& p) {
    if (kind_ == DimKind::Angular) {
        if (i == 0) a_ = p; else if (i == 1) b_ = p; else if (i == 2) c_ = p; else if (i == 3) loc_ = p;
        return;
    }
    if (i == 0) a_ = p; else if (i == 1) b_ = p; else if (i == 2) loc_ = p;
}

namespace {
// Angular dimension: start angle and CCW sweep of the arc containing 'loc'.
std::pair<double, double> angularSpan(const Vec2& v, const Vec2& b, const Vec2& c, const Vec2& loc) {
    const double t1 = std::atan2(b.y - v.y, b.x - v.x), t2 = std::atan2(c.y - v.y, c.x - v.x);
    const double tl = std::atan2(loc.y - v.y, loc.x - v.x);
    double s = geom::normalizeAngle(t2 - t1);
    if (geom::normalizeAngle(tl - t1) <= s) return {t1, s};
    // loc lies in the other sector: measure from t2 to t1 instead.
    return {t2, 2 * kPi - s};
}
} // namespace

double DimensionEntity::measurement() const {
    switch (kind_) {
    case DimKind::Linear: return std::abs((b_ - a_).dot(Vec2::fromPolar(1.0, degToRad(angle_))));
    case DimKind::Aligned: return distance(a_, b_);
    case DimKind::Radius: return distance(a_, b_);
    case DimKind::Diameter: return 2.0 * distance(a_, b_);
    case DimKind::Angular: return radToDeg(angularSpan(a_, b_, c_, loc_).second);
    }
    return 0;
}

std::string DimensionEntity::displayText() const {
    std::string m = formatMeasurement(measurement(), style_.precision, style_.suppressZeros);
    if (kind_ == DimKind::Radius) m = "R" + m;
    else if (kind_ == DimKind::Diameter) m = "\xC3\x98" + m; // Ø
    else if (kind_ == DimKind::Angular) m += "\xC2\xB0";      // °
    if (override_.empty()) return m;
    std::string out = override_;
    const auto pos = out.find("<>");
    if (pos != std::string::npos) out.replace(pos, 2, m);
    return out;
}

AnnotationGraphics DimensionEntity::graphics() const {
    AnnotationGraphics g;
    const DimStyle& st = style_;
    const double as = st.arrowSize;
    auto addText = [&](const Vec2& mid, const Vec2& dir) {
        // Text centred on 'mid', above a line running along 'dir', readable.
        double rot = readable(radToDeg(std::atan2(dir.y, dir.x)));
        const Vec2 up = Vec2::fromPolar(1.0, degToRad(rot + 90));
        AnnotationGraphics::Text t;
        t.text = displayText();
        t.position = mid + up * st.textGap;
        t.rotationDeg = rot;
        t.height = st.textHeight;
        t.justify = TextJustify::Center;
        t.font = st.font;
        g.texts.push_back(t);
    };
    auto dimLine = [&](const Vec2& p, const Vec2& q) {
        // Dimension line between p and q with arrows (outside if too short).
        const double len = distance(p, q);
        if (len <= 0) return;
        const Vec2 u = (q - p) / len;
        if (len >= 2.5 * as) {
            g.lines.emplace_back(p, q);
            g.arrows.push_back(arrowAt(p, u, as));
            g.arrows.push_back(arrowAt(q, -u, as));
        } else {
            g.lines.emplace_back(p - u * (2 * as), q + u * (2 * as));
            g.arrows.push_back(arrowAt(p, -u, as));
            g.arrows.push_back(arrowAt(q, u, as));
        }
    };
    auto extLine = [&](const Vec2& origin, const Vec2& onDim) {
        const Vec2 d = onDim - origin;
        const double len = d.length();
        if (len <= st.extOffset) return;
        const Vec2 u = d / len;
        g.lines.emplace_back(origin + u * st.extOffset, onDim + u * st.extBeyond);
    };

    switch (kind_) {
    case DimKind::Linear:
    case DimKind::Aligned: {
        Vec2 u, A, B;
        if (kind_ == DimKind::Linear) {
            u = Vec2::fromPolar(1.0, degToRad(angle_));
            if (std::fmod(std::abs(angle_), 90.0) == 0.0) { // exact axis directions
                const int q = static_cast<int>(std::lround(geom::normalizeAngle(degToRad(angle_)) / (kPi / 2))) % 4;
                u = q == 0 ? Vec2{1, 0} : q == 1 ? Vec2{0, 1} : q == 2 ? Vec2{-1, 0} : Vec2{0, -1};
            }
            A = loc_ + u * (a_ - loc_).dot(u);
            B = loc_ + u * (b_ - loc_).dot(u);
        } else {
            u = (b_ - a_).normalized();
            const Vec2 n{-u.y, u.x};
            const double off = (loc_ - a_).dot(n);
            A = a_ + n * off;
            B = b_ + n * off;
        }
        extLine(a_, A);
        extLine(b_, B);
        dimLine(A, B);
        addText((A + B) * 0.5, u);
        break;
    }
    case DimKind::Radius:
    case DimKind::Diameter: {
        const double r = distance(a_, b_);
        Vec2 dir = loc_ - a_;
        if (dir.lengthSquared() == 0) dir = b_ - a_;
        dir = dir.normalized();
        const Vec2 onCurve = a_ + dir * r;
        const double locDist = distance(a_, loc_);
        if (kind_ == DimKind::Radius) {
            const Vec2 far = locDist > r ? loc_ : onCurve;
            g.lines.emplace_back(a_, far);
            g.arrows.push_back(arrowAt(onCurve, -dir, as));
        } else {
            const Vec2 opp = a_ - dir * r;
            const Vec2 far = locDist > r ? loc_ : onCurve;
            g.lines.emplace_back(opp, far);
            g.arrows.push_back(arrowAt(onCurve, -dir, as));
            g.arrows.push_back(arrowAt(opp, dir, as));
        }
        addText(locDist > r ? (onCurve + loc_) * 0.5 : (a_ + onCurve) * 0.5, dir);
        break;
    }
    case DimKind::Angular: {
        const auto [start, sweep] = angularSpan(a_, b_, c_, loc_);
        const double r = distance(a_, loc_);
        if (r <= 0) break;
        const ArcGeom arc{a_, r, start, sweep};
        const auto pts = geom::tessellateArc(arc, r * 1e-3, 512);
        for (std::size_t i = 1; i < pts.size(); ++i) g.lines.emplace_back(pts[i - 1], pts[i]);
        const Vec2 s = arc.startPoint(), e = arc.endPoint();
        const Vec2 ts{-std::sin(start), std::cos(start)};                 // tangent at start (CCW)
        const Vec2 te{-std::sin(start + sweep), std::cos(start + sweep)}; // tangent at end
        g.arrows.push_back(arrowAt(s, ts, as));
        g.arrows.push_back(arrowAt(e, -te, as));
        // Extension lines from the legs out to the arc when needed.
        for (const Vec2& leg : {b_, c_}) {
            const double t = std::atan2(leg.y - a_.y, leg.x - a_.x);
            const Vec2 onArc = a_ + Vec2::fromPolar(r, t);
            if (distance(a_, leg) < r) extLine(leg, onArc);
        }
        const double mid = start + sweep / 2;
        addText(a_ + Vec2::fromPolar(r, mid), Vec2{-std::sin(mid), std::cos(mid)});
        break;
    }
    }
    return g;
}

std::unique_ptr<Entity> DimensionEntity::transformed(const Affine2D& xf) const {
    auto d = std::make_unique<DimensionEntity>(*this);
    d->a_ = xf.apply(a_);
    d->b_ = xf.apply(b_);
    d->c_ = xf.apply(c_);
    d->loc_ = xf.apply(loc_);
    const Vec2 u = xf.applyVector(Vec2::fromPolar(1.0, degToRad(angle_)));
    d->angle_ = radToDeg(std::atan2(u.y, u.x));
    if (std::abs(d->angle_ - std::round(d->angle_)) < 1e-9) d->angle_ = std::round(d->angle_);
    if (kind_ == DimKind::Angular && xf.det() < 0) std::swap(d->b_, d->c_); // keep the measured sector
    return d;
}

// ================================================================ LeaderEntity

LeaderEntity::LeaderEntity(std::vector<Vec2> pts, std::string text) : pts_(std::move(pts)), text_(std::move(text)) {}

AnnotationGraphics LeaderEntity::graphics() const {
    AnnotationGraphics g;
    if (pts_.size() < 2) return g;
    for (std::size_t i = 1; i < pts_.size(); ++i) g.lines.emplace_back(pts_[i - 1], pts_[i]);
    g.arrows.push_back(arrowAt(pts_[0], pts_[1] - pts_[0], style_.arrowSize));
    if (!text_.empty()) {
        const Vec2 last = pts_.back(), prev = pts_[pts_.size() - 2];
        const bool right = last.x >= prev.x;
        AnnotationGraphics::Text t;
        t.text = text_;
        t.height = style_.textHeight;
        t.font = style_.font;
        // Text beside the end of the leader, first line centred on it.
        const TextLayout lay = layoutText(text_, t.height, TextJustify::Left, t.font);
        double w = 0;
        for (const auto& l : lay.lines) w = std::max(w, textWidth(l.text, t.font, t.height));
        t.justify = TextJustify::Left;
        t.position = last + Vec2{right ? style_.textGap : -style_.textGap - w, -t.height / 2};
        g.texts.push_back(t);
    }
    return g;
}

std::unique_ptr<Entity> LeaderEntity::transformed(const Affine2D& xf) const {
    auto l = std::make_unique<LeaderEntity>(*this);
    for (Vec2& p : l->pts_) p = xf.apply(p);
    return l;
}

} // namespace dyncad
