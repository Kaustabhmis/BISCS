// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "canvas/CadCanvas.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/XLineEntity.h"
#include "entities/HatchEntity.h"
#include "commands/GripAndClipboard.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Geometry.h"

#include <QKeyEvent>
#include <QMouseEvent>
#include <QPainter>
#include <QFontMetrics>
#include <QPainterPath>
#include <QWheelEvent>

#include <cmath>
#include <map>

namespace dyncad {

namespace {
QPointF qp(const Vec2& v) { return {v.x, v.y}; }
Vec2 v2(const QPointF& p) { return {p.x(), p.y()}; }
} // namespace

CadCanvas::CadCanvas(Document& doc, SelectionSet& selection, CommandProcessor& proc, QWidget* parent)
    : QWidget(parent), doc_(doc), selection_(selection), proc_(proc), colors_(Theme::canvasColors(ThemeKind::Dark)) {
    setMouseTracking(true);
    setFocusPolicy(Qt::StrongFocus);
    setCursor(Qt::BlankCursor); // we draw our own crosshair
    setAttribute(Qt::WA_OpaquePaintEvent);
    setMinimumSize(200, 150);
    docListener_ = doc_.addListener([this] { update(); });
}

CadCanvas::~CadCanvas() { doc_.removeListener(docListener_); }

double CadCanvas::currentGridStep() const { return geom::gridStepForScale(view_.scale(), 12.0); }

Vec2 CadCanvas::worldAt(const QPointF& pos) const {
    Vec2 w = view_.screenToWorld(v2(pos));
    if (snap_) w = geom::snapToGrid(w, currentGridStep());
    return w;
}

void CadCanvas::resetView() {
    view_.setViewportSize(width(), height());
    view_.fitTo(BoundingBox({0, 0}, {420, 297}), 0.06);
    update();
}

void CadCanvas::zoomExtents() {
    const BoundingBox ext = doc_.extents();
    if (!ext.isValid()) { resetView(); return; }
    BoundingBox b = ext;
    if (b.width() == 0.0 && b.height() == 0.0) b = b.inflated(10.0);
    view_.fitTo(b, 0.05);
    update();
}

void CadCanvas::zoomBy(double factor) {
    view_.zoomAt({width() * 0.5, height() * 0.5}, factor);
    update();
}

void CadCanvas::setGridVisible(bool on) { gridVisible_ = on; update(); }
void CadCanvas::setSnapEnabled(bool on) { snap_ = on; refreshTracking(); update(); }
void CadCanvas::setOsnapEnabled(bool on) { osnap_ = on; refreshTracking(); update(); }

void CadCanvas::refreshTracking() {
    const Vec2 raw = view_.screenToWorld(v2(mousePos_));
    snap_now_.reset();
    polar_now_.reset();
    const bool pointMode = proc_.wantsPoint();
    if (pointMode && (osnap_ || proc_.snapOverride())) {
        const std::uint32_t modes = proc_.snapOverride() ? std::uint32_t(*proc_.snapOverride()) : snapModes_;
        snap_now_ = SnapEngine().find(doc_, raw, view_.pixelsToWorld(kAperturePx), modes, proc_.basePoint());
    }
    Vec2 eff = snap_now_ ? snap_now_->point : (snap_ ? geom::snapToGrid(raw, currentGridStep()) : raw);
    if (!snap_now_ && pointMode) {
        if (proc_.ortho()) {
            eff = proc_.constrainedCursor(eff);
        } else if (proc_.polar()) {
            if (auto base = proc_.basePoint()) {
                polar_now_ = polarTrack(*base, eff, proc_.polarIncrement(), view_.pixelsToWorld(8.0));
                if (polar_now_) eff = polar_now_->point;
            }
        }
    }
    effective_ = eff;
    proc_.setCursor(raw);
    proc_.setPickTolerance(pickTolerance());
    if (proc_.isActive()) proc_.setTrackedCursor(eff);
}

// ------------------------------------------------------------------ painting

void CadCanvas::paintEvent(QPaintEvent*) {
    QPainter p(this);
    p.fillRect(rect(), colors_.background);
    if (gridVisible_) drawGrid(p);
    drawAxes(p);

    p.setRenderHint(QPainter::Antialiasing, true);
    const BoundingBox visible = view_.visibleWorldRect();

    p.setBrush(Qt::NoBrush);
    QPen lastPen;
    bool havePen = false;
    for (const auto& e : doc_.entities()) {
        if (selection_.contains(e->id()) || e->id() == hover_) continue;
        if (!e->isInfinite() && !visible.intersects(e->bounds())) continue; // view culling
        const Document::Resolved st = doc_.resolve(*e);
        if (!st.visible) continue; // layer off or frozen
        const QPen pen = penFor(st);
        if (!havePen || pen != lastPen) { p.setPen(pen); lastPen = pen; havePen = true; }
        drawEntity(p, *e, visible, &st);
    }

    if (hover_ != kInvalidEntityId && !selection_.contains(hover_)) {
        if (auto e = doc_.findEntity(hover_)) {
            QPen hp(colors_.hover, 2.5);
            p.setPen(hp);
            drawEntity(p, *e, visible);
        }
    }

    QPen selPen(colors_.selected, 2.0, Qt::DashLine);
    for (EntityId id : selection_.ids()) {
        auto e = doc_.findEntity(id);
        if (!e || (!e->isInfinite() && !visible.intersects(e->bounds()))) continue;
        p.setPen(selPen);
        drawEntity(p, *e, visible);
    }
    if (selection_.size() <= 500 && !proc_.isActive()) {
        for (EntityId id : selection_.ids())
            if (auto e = doc_.findEntity(id)) drawGrips(p, *e);
    }

    QPen prevPen(colors_.preview, 1.0, Qt::DashLine);
    p.setPen(prevPen);
    for (const auto& e : proc_.previewEntities()) drawEntity(p, *e, visible);

    p.setRenderHint(QPainter::Antialiasing, false);
    if (windowActive_) drawSelectionWindow(p);
    drawUcsIcon(p);
    if (mouseInside_) {
        drawTrackingAids(p);
        drawCrosshair(p);
    }
}

void CadCanvas::drawSnapMarker(QPainter& p, const SnapResult& s) const {
    const Vec2 c = view_.worldToScreen(s.point);
    const QPointF q(std::round(c.x) + 0.5, std::round(c.y) + 0.5);
    const double r = 6.0;
    p.save();
    p.setRenderHint(QPainter::Antialiasing, true);
    p.setPen(QPen(Theme::brandGold(), 2));
    p.setBrush(Qt::NoBrush);
    switch (s.mode) {
    case SnapEndpoint: p.drawRect(QRectF(q.x() - r, q.y() - r, 2 * r, 2 * r)); break;
    case SnapMidpoint: p.drawPolygon(QPolygonF({q + QPointF(0, -r), q + QPointF(r, r * 0.8), q + QPointF(-r, r * 0.8)})); break;
    case SnapCenter: p.drawEllipse(q, r, r); break;
    case SnapQuadrant: p.drawPolygon(QPolygonF({q + QPointF(0, -r), q + QPointF(r, 0), q + QPointF(0, r), q + QPointF(-r, 0)})); break;
    case SnapIntersection: p.drawLine(q + QPointF(-r, -r), q + QPointF(r, r)); p.drawLine(q + QPointF(-r, r), q + QPointF(r, -r)); break;
    case SnapPerpendicular:
        p.drawLine(q + QPointF(-r, r), q + QPointF(r, r)); p.drawLine(q + QPointF(-r, r), q + QPointF(-r, -r));
        p.drawLine(q + QPointF(-r, 0), q + QPointF(0, 0)); p.drawLine(q + QPointF(0, 0), q + QPointF(0, r)); break;
    case SnapTangent: p.drawEllipse(q, r * 0.75, r * 0.75); p.drawLine(q + QPointF(-r, -r), q + QPointF(r, -r)); break;
    case SnapNearest:
        p.drawPolygon(QPolygonF({q + QPointF(-r, -r), q + QPointF(r, -r), q + QPointF(-r, r), q + QPointF(r, r)})); break;
    case SnapNode: p.drawEllipse(q, r, r); p.drawLine(q + QPointF(-r * 0.7, -r * 0.7), q + QPointF(r * 0.7, r * 0.7));
        p.drawLine(q + QPointF(-r * 0.7, r * 0.7), q + QPointF(r * 0.7, -r * 0.7)); break;
    default: break;
    }
    p.restore();
}

void CadCanvas::drawTooltip(QPainter& p, const QPointF& at, const QStringList& lines) const {
    if (lines.isEmpty()) return;
    p.save();
    const QFontMetrics fm(font());
    int w = 0;
    for (const QString& l : lines) w = std::max(w, fm.horizontalAdvance(l));
    const int h = fm.height() * int(lines.size()) + 6;
    QRectF box(at.x(), at.y(), w + 12, h);
    if (box.right() > width() - 2) box.moveRight(at.x() - 24);
    if (box.bottom() > height() - 2) box.moveBottom(at.y() - 24);
    p.setPen(QPen(colors_.crosshair, 1));
    p.setBrush(QColor(colors_.background.red(), colors_.background.green(), colors_.background.blue(), 225));
    p.drawRect(box);
    p.setPen(colors_.entity);
    for (int i = 0; i < lines.size(); ++i)
        p.drawText(QPointF(box.left() + 6, box.top() + 3 + fm.ascent() + i * fm.height()), lines.at(i));
    p.restore();
}

void CadCanvas::drawTrackingAids(QPainter& p) const {
    const bool pointMode = proc_.wantsPoint();
    const auto base = proc_.basePoint();
    if (polar_now_ && base) { // dotted tracking ray to the view edge
        const Vec2 b = view_.worldToScreen(*base);
        const Vec2 dir = Vec2::fromPolar(1.0, degToRad(polar_now_->angleDeg));
        const Vec2 far = b + Vec2{dir.x, -dir.y} * double(width() + height()) * 2.0;
        p.setPen(QPen(colors_.preview, 1, Qt::DotLine));
        p.drawLine(qp(b), qp(far));
    }
    if (snap_now_) drawSnapMarker(p, *snap_now_);
    QStringList tip;
    if (snap_now_) tip << tr(snapModeName(snap_now_->mode));
    if (dyn_ && pointMode) {
        const Vec2 e = effective_;
        if (base && !nearlyEqual(*base, e, 0.0)) {
            tip << tr("Length %1   Angle %2\u00B0").arg(distance(*base, e), 0, 'f', 4).arg(geom::angleDeg(*base, e), 0, 'f', 2);
        } else {
            tip << QStringLiteral("X %1   Y %2").arg(e.x, 0, 'f', 4).arg(e.y, 0, 'f', 4);
        }
        if (polar_now_) tip.last() += tr("   (polar %1\u00B0)").arg(polar_now_->angleDeg, 0, 'g', 6);
        if (!dynText_.isEmpty()) tip << QStringLiteral("> ") + dynText_;
    } else if (dyn_ && !dynText_.isEmpty()) {
        tip << QStringLiteral("> ") + dynText_;
    }
    if (!tip.isEmpty()) drawTooltip(p, mousePos_ + QPointF(18, 18), tip);
}

void CadCanvas::drawGrid(QPainter& p) const {
    const double step = currentGridStep();
    const BoundingBox vis = view_.visibleWorldRect();
    const long long x0 = static_cast<long long>(std::floor(vis.min.x / step));
    const long long x1 = static_cast<long long>(std::ceil(vis.max.x / step));
    const long long y0 = static_cast<long long>(std::floor(vis.min.y / step));
    const long long y1 = static_cast<long long>(std::ceil(vis.max.y / step));
    if ((x1 - x0) > 4000 || (y1 - y0) > 4000) return;

    auto isMajor = [&](long long i) { return i % 10 == 0; };
    for (int pass = 0; pass < 2; ++pass) {
        p.setPen(QPen(pass == 0 ? colors_.gridMinor : colors_.gridMajor, 1));
        for (long long i = x0; i <= x1; ++i) {
            if (isMajor(i) != (pass == 1)) continue;
            const double sx = std::round(view_.worldToScreen({i * step, 0}).x) + 0.5;
            p.drawLine(QPointF(sx, 0), QPointF(sx, height()));
        }
        for (long long j = y0; j <= y1; ++j) {
            if (isMajor(j) != (pass == 1)) continue;
            const double sy = std::round(view_.worldToScreen({0, j * step}).y) + 0.5;
            p.drawLine(QPointF(0, sy), QPointF(width(), sy));
        }
    }
}

void CadCanvas::drawAxes(QPainter& p) const {
    const Vec2 o = view_.worldToScreen({0, 0});
    if (o.y >= 0 && o.y <= height()) {
        p.setPen(QPen(colors_.axisX, 1));
        p.drawLine(QPointF(0, std::round(o.y) + 0.5), QPointF(width(), std::round(o.y) + 0.5));
    }
    if (o.x >= 0 && o.x <= width()) {
        p.setPen(QPen(colors_.axisY, 1));
        p.drawLine(QPointF(std::round(o.x) + 0.5, 0), QPointF(std::round(o.x) + 0.5, height()));
    }
}

QPen CadCanvas::penFor(const Document::Resolved& r) const {
    if (plot_) {
        QColor c = r.foreground || r.rgb == 0xFFFFFF ? QColor(Qt::black) : QColor::fromRgb(QRgb(0xFF000000u | r.rgb));
        if (plot_->monochrome) c = Qt::black;
        const int lw = plot_->lineweights && r.lineweight > 0 ? r.lineweight : kLwDefaultValue;
        QPen pen(c, std::max(1.0, lw / 100.0 * plot_->dotsPerMm), Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin);
        pen.setCosmetic(true); // drawing is done in device coordinates
        return pen;
    }
    QColor c = r.foreground ? colors_.entity : QColor::fromRgb(QRgb(0xFF000000u | r.rgb));
    if (r.locked) c.setAlpha(110); // locked layers are drawn faded
    double w = 1.0;
    if (lwDisplay_) w = std::clamp(std::round(r.lineweight / 25.0), 1.0, 12.0); // 0.25 mm = 1 px
    QPen pen(c, w, Qt::SolidLine, Qt::FlatCap, Qt::MiterJoin);
    pen.setCosmetic(true);
    return pen;
}

void CadCanvas::drawEntity(QPainter& p, const Entity& e, const BoundingBox& visible, const Document::Resolved* style) const {
    // Clip to a margin around the view so huge zoom levels never overflow the
    // raster engine's fixed-point range.
    const BoundingBox clip = visible.inflated(vt().pixelsToWorld(10.0));
    // Linetype dashing in world units, continuous along the whole entity.
    const std::vector<double>* pattern = nullptr;
    double dashScale = 1.0, total = 0.0, phase = 0.0;
    if (style && style->linetype) {
        dashScale = style->ltscale;
        total = style->linetype->patternLength() * dashScale;
        // Too dense to see on screen: draw solid (as CAD programs do).
        if (total > 0 && total * vt().scale() >= 4.0) pattern = &style->linetype->pattern;
    }
    auto line = [&](const Vec2& a, const Vec2& b) { p.drawLine(qp(vt().worldToScreen(a)), qp(vt().worldToScreen(b))); };
    auto drawSeg = [&](const Vec2& a, const Vec2& b) {
        const double L = distance(a, b);
        if (!pattern) {
            if (auto c = geom::clipSegment(a, b, clip)) line(c->first, c->second);
            return;
        }
        if (L <= 0) return;
        if (auto c = geom::clipSegment(a, b, clip)) {
            const Vec2 u = (b - a) / L;
            const double s0 = distance(a, c->first), s1 = distance(a, c->second);
            const auto& pat = *pattern;
            // Locate the pattern element at distance s0.
            double ph = std::fmod(phase + s0, total);
            std::size_t k = 0;
            while (ph >= std::abs(pat[k]) * dashScale && std::abs(pat[k]) > 0) { ph -= std::abs(pat[k]) * dashScale; k = (k + 1) % pat.size(); }
            double d = s0;
            int guard = 0;
            while (d < s1 && ++guard < 200000) {
                const double elen = std::abs(pat[k]) * dashScale;
                if (pat[k] == 0.0) { // dot
                    if (ph == 0.0) { const QPointF q = qp(vt().worldToScreen(a + u * d)); p.drawPoint(q); }
                    k = (k + 1) % pat.size();
                    ph = 0;
                    continue;
                }
                const double piece = std::min(elen - ph, s1 - d);
                if (pat[k] > 0) line(a + u * d, a + u * (d + piece));
                d += piece;
                ph += piece;
                if (ph >= elen - 1e-12) { ph = 0; k = (k + 1) % pat.size(); }
            }
            if (guard >= 200000) line(a + u * d, a + u * s1); // safety: rest solid
        }
        phase = std::fmod(phase + L, total);
    };
    // Arcs are tessellated to within 0.25 px of the true curve, then clipped.
    auto drawPolylinePts = [&](const std::vector<Vec2>& pts) {
        for (std::size_t i = 1; i < pts.size(); ++i) drawSeg(pts[i - 1], pts[i]);
    };
    auto drawArc = [&](const ArcGeom& g) {
        if (!clip.intersects(geom::arcBounds(g))) return;
        const auto pts = geom::tessellateArc(g, vt().pixelsToWorld(0.25));
        for (std::size_t i = 1; i < pts.size(); ++i) drawSeg(pts[i - 1], pts[i]);
    };
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        drawSeg(l.start(), l.end());
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(e);
        if (!geom::circleIntersectsRect(c.center(), c.radius(), clip)) break;
        const double rpx = c.radius() * vt().scale();
        if (rpx < 0.5) {
            p.drawPoint(qp(vt().worldToScreen(c.center())));
        } else if (rpx < 1e5) {
            p.drawEllipse(qp(vt().worldToScreen(c.center())), rpx, rpx);
        } else {
            // Very large on-screen radius: draw as fine segments (clipped).
            const int n = 4096;
            Vec2 prev = c.center() + Vec2{c.radius(), 0};
            for (int i = 1; i <= n; ++i) {
                const double a = 2.0 * kPi * i / n;
                const Vec2 cur = c.center() + Vec2::fromPolar(c.radius(), a);
                drawSeg(prev, cur);
                prev = cur;
            }
        }
        break;
    }
    case EntityType::Arc: {
        const ArcGeom g = static_cast<const ArcEntity&>(e).geom();
        drawArc(g);
        break;
    }
    case EntityType::Point: {
        const Vec2 s = vt().worldToScreen(static_cast<const PointEntity&>(e).position());
        p.drawLine(QPointF(s.x - 4, s.y), QPointF(s.x + 4, s.y));
        p.drawLine(QPointF(s.x, s.y - 4), QPointF(s.x, s.y + 4));
        break;
    }
    case EntityType::XLine: {
        if (auto c = static_cast<const XLineEntity&>(e).clipped(clip))
            p.drawLine(qp(vt().worldToScreen(c->first)), qp(vt().worldToScreen(c->second)));
        break;
    }
    case EntityType::Insert: {
        const auto& ins = static_cast<const InsertEntity&>(e);
        const QPen keep = p.pen();
        for (const auto& sub : ins.worldEntities()) {
            if (!sub->isInfinite() && !clip.intersects(sub->bounds())) continue;
            if (style) { // normal drawing: each sub-entity in its own resolved style
                const Document::Resolved st = doc_.resolve(*sub);
                if (!st.visible) continue;
                p.setPen(penFor(st));
                drawEntity(p, *sub, visible, &st);
            } else {     // highlight: everything in the highlight pen
                drawEntity(p, *sub, visible, nullptr);
            }
        }
        p.setPen(keep);
        break;
    }
    case EntityType::Hatch: {
        const auto& h = static_cast<const HatchEntity&>(e);
        const QColor col = p.pen().color();
        if (h.pattern().solid || !style) {
            QPainterPath path;
            path.setFillRule(Qt::OddEvenFill);
            for (const auto& poly : h.loopPolygons(vt().pixelsToWorld(0.5))) {
                for (std::size_t i = 0; i < poly.size(); ++i) {
                    const QPointF q = qp(vt().worldToScreen(poly[i]));
                    if (i == 0) path.moveTo(q); else path.lineTo(q);
                }
                path.closeSubpath();
            }
            QColor fill = col;
            if (!style) fill.setAlpha(90); // selection highlight: translucent
            if (plot_ && plot_->monochrome && style) { // keep fills readable: grey by luminance
                const QColor src = QColor::fromRgb(QRgb(0xFF000000u | style->rgb));
                const int g = style->foreground ? 0 : qGray(src.rgb());
                fill = QColor(g, g, g);
            }
            p.fillPath(path, fill);
            break;
        }
        // Pattern lines; drawn as a translucent fill when too dense to see.
        double spacingPx = 1e9;
        for (const auto& f : h.pattern().families) {
            const double r = degToRad(f.angleDeg);
            spacingPx = std::min(spacingPx, std::abs(f.offset.dot(Vec2{-std::sin(r), std::cos(r)})) * vt().scale());
        }
        if (spacingPx < 2.0) {
            QPainterPath path;
            path.setFillRule(Qt::OddEvenFill);
            for (const auto& poly : h.loopPolygons(vt().pixelsToWorld(0.5))) {
                for (std::size_t i = 0; i < poly.size(); ++i) {
                    const QPointF q = qp(vt().worldToScreen(poly[i]));
                    if (i == 0) path.moveTo(q); else path.lineTo(q);
                }
                path.closeSubpath();
            }
            QColor fill = col;
            fill.setAlpha(70);
            p.fillPath(path, fill);
            break;
        }
        for (const auto& seg : h.cachedSegments()) {
            if (seg.first == seg.second) { p.drawPoint(qp(vt().worldToScreen(seg.first))); continue; }
            if (auto c = geom::clipSegment(seg.first, seg.second, clip)) line(c->first, c->second);
        }
        break;
    }
    case EntityType::Text: {
        const auto& t = static_cast<const TextEntity&>(e);
        drawText(p, t.text(), t.insert(), t.rotationDeg(), t.height(), t.justify(), t.font(), t.wrapWidth());
        break;
    }
    case EntityType::Dimension:
        drawAnnotation(p, static_cast<const DimensionEntity&>(e).graphics());
        break;
    case EntityType::Leader:
        drawAnnotation(p, static_cast<const LeaderEntity&>(e).graphics());
        break;
    case EntityType::Ellipse: {
        const EllipseGeom& g = static_cast<const EllipseEntity&>(e).geom();
        if (!clip.intersects(geom::ellipseBounds(g))) break;
        drawPolylinePts(geom::tessellateEllipse(g, vt().pixelsToWorld(0.25)));
        break;
    }
    case EntityType::Spline: {
        const auto& sp = static_cast<const SplineEntity&>(e);
        // Re-tessellate for the current zoom, but never finer than needed on screen.
        drawPolylinePts(sp.curve().tessellate(vt().pixelsToWorld(0.25)));
        break;
    }
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        const std::size_t n = pl.segmentCount();
        if (pl.isFilled() || pl.width() * vt().scale() > 1.5) pattern = nullptr; // fills and wide plines draw solid
        if (pl.isFilled()) {
            QPainterPath path;
            for (std::size_t i = 0; i < n; ++i) {
                std::vector<Vec2> pts;
                if (auto a = pl.segmentArc(i)) pts = geom::tessellateArc(*a, vt().pixelsToWorld(0.25));
                else pts = {pl.segmentStart(i), pl.segmentEnd(i)};
                for (std::size_t k = (i == 0 ? 0 : 1); k < pts.size(); ++k) {
                    const QPointF q = qp(vt().worldToScreen(pts[k]));
                    if (i == 0 && k == 0) path.moveTo(q); else path.lineTo(q);
                }
            }
            path.closeSubpath();
            p.fillPath(path, p.pen().color());
        }
        const double wpx = pl.width() * vt().scale();
        if (wpx > 1.5) {
            // Wide polyline: stroke the centre line with a pen of the true width.
            QPainterPath path;
            for (std::size_t i = 0; i < n; ++i) {
                std::vector<Vec2> pts;
                if (auto a = pl.segmentArc(i)) pts = geom::tessellateArc(*a, vt().pixelsToWorld(0.25));
                else pts = {pl.segmentStart(i), pl.segmentEnd(i)};
                for (std::size_t k = (i == 0 ? 0 : 1); k < pts.size(); ++k) {
                    const QPointF q = qp(vt().worldToScreen(pts[k]));
                    if (i == 0 && k == 0) path.moveTo(q); else path.lineTo(q);
                }
            }
            if (pl.isClosed()) path.closeSubpath();
            QPen wide(p.pen().color(), wpx, Qt::SolidLine, Qt::FlatCap, Qt::MiterJoin);
            p.save();
            p.strokePath(path, wide);
            p.restore();
            break;
        }
        for (std::size_t i = 0; i < n; ++i) {
            if (auto a = pl.segmentArc(i)) drawArc(*a);
            else drawSeg(pl.segmentStart(i), pl.segmentEnd(i));
        }
        break;
    }
    }
}

void CadCanvas::drawText(QPainter& p, const std::string& text, const Vec2& insert, double rotationDeg, double height,
                         TextJustify justify, const std::string& font, double wrap) const {
    const double hpx = height * vt().scale();
    const TextLayout lay = layoutText(text, height, justify, font, wrap);
    const QColor col = p.pen().color();
    p.save();
    const Vec2 s = vt().worldToScreen(insert);
    p.translate(s.x, s.y);
    p.rotate(-rotationDeg);
    if (hpx < 3.0) {
        // Too small to read: show the text block as a thin box (greeking).
        const BoundingBox b = lay.box;
        p.setPen(QPen(col, 1));
        p.setBrush(Qt::NoBrush);
        p.drawRect(QRectF(QPointF(b.min.x * vt().scale(), -b.max.y * vt().scale()),
                          QPointF(b.max.x * vt().scale(), -b.min.y * vt().scale())));
        p.restore();
        return;
    }
    QFont f(QString::fromStdString(font));
    f.setPixelSize(std::max(1, int(std::lround(hpx * capHeightRatio(font)))));
    p.setFont(f);
    p.setPen(col);
    for (const auto& line : lay.lines)
        p.drawText(QPointF(line.start.x * vt().scale(), -line.start.y * vt().scale()), QString::fromStdString(line.text));
    p.restore();
}

void CadCanvas::drawAnnotation(QPainter& p, const AnnotationGraphics& g) const {
    for (const auto& l : g.lines) p.drawLine(qp(vt().worldToScreen(l.first)), qp(vt().worldToScreen(l.second)));
    p.save();
    p.setBrush(p.pen().color());
    for (const auto& a : g.arrows)
        p.drawPolygon(QPolygonF({qp(vt().worldToScreen(a[0])), qp(vt().worldToScreen(a[1])), qp(vt().worldToScreen(a[2]))}));
    p.restore();
    for (const auto& t : g.texts) drawText(p, t.text, t.position, t.rotationDeg, t.height, t.justify, t.font, 0.0);
}

void CadCanvas::renderPlot(QPainter& p, const ViewTransform& v, const PlotPenOptions& opt) const {
    const ViewTransform* keepV = vt_;
    vt_ = &v;
    plot_ = &opt;
    p.setRenderHint(QPainter::Antialiasing, true);
    p.setBrush(Qt::NoBrush);
    const BoundingBox visible = v.visibleWorldRect();
    for (const auto& e : doc_.entities()) {
        if (!e->isInfinite() && !visible.intersects(e->bounds())) continue;
        const Document::Resolved st = doc_.resolve(*e);
        if (!st.visible) continue;
        p.setPen(penFor(st));
        drawEntity(p, *e, visible, &st);
    }
    plot_ = nullptr;
    vt_ = keepV;
}

double capHeightRatio(const std::string& font) {
    static std::map<std::string, double> cache;
    auto it = cache.find(font);
    if (it != cache.end()) return it->second;
    QFont f(QString::fromStdString(font));
    f.setPixelSize(100);
    const double cap = QFontMetricsF(f).capHeight();
    const double ratio = cap > 1 ? 100.0 / cap : 1.4;
    cache[font] = ratio;
    return ratio;
}

void installTextMetrics() {
    // Real font metrics for text layout (selection boxes match what is drawn).
    setTextWidthFunction([](const std::string& line, const std::string& font, double height) {
        QFont f(QString::fromStdString(font));
        f.setPixelSize(100);
        const double w = QFontMetricsF(f).horizontalAdvance(QString::fromStdString(line));
        return w / 100.0 * height * capHeightRatio(font);
    });
}

void CadCanvas::drawGrips(QPainter& p, const Entity& e) const {
    p.save();
    p.setRenderHint(QPainter::Antialiasing, false);
    p.setPen(QPen(Qt::white, 1));
    for (const Vec2& g : e.gripPoints()) {
        const Vec2 s = view_.worldToScreen(g);
        const bool hot = mouseInside_ && std::abs(s.x - mousePos_.x()) <= kPickBoxPx && std::abs(s.y - mousePos_.y()) <= kPickBoxPx;
        p.setBrush(hot ? QColor(0xE0, 0x40, 0x40) : colors_.grip); // hovered grip turns red
        p.drawRect(QRectF(std::round(s.x) - 3.5, std::round(s.y) - 3.5, 7, 7));
    }
    p.restore();
}

void CadCanvas::drawSelectionWindow(QPainter& p) const {
    const bool crossing = mousePos_.x() < windowStart_.x();
    const QRectF r = QRectF(windowStart_, mousePos_).normalized();
    p.setBrush(crossing ? colors_.crossingFill : colors_.windowFill);
    p.setPen(QPen(crossing ? colors_.crossingBorder : colors_.windowBorder, 1, crossing ? Qt::DashLine : Qt::SolidLine));
    p.drawRect(r);
    p.setBrush(Qt::NoBrush);
}

void CadCanvas::drawCrosshair(QPainter& p) const {
    QPointF c = mousePos_;
    if (proc_.wantsPoint() || snap_) {
        // Show the crosshair where the point will actually be placed.
        c = qp(view_.worldToScreen(proc_.wantsPoint() ? effective_ : worldAt(mousePos_)));
    }
    const double x = std::round(c.x()) + 0.5, y = std::round(c.y()) + 0.5;
    p.setPen(QPen(colors_.crosshair, 1));
    p.drawLine(QPointF(0, y), QPointF(width(), y));
    p.drawLine(QPointF(x, 0), QPointF(x, height()));
    if (selectionMode()) {
        p.setBrush(Qt::NoBrush);
        p.drawRect(QRectF(x - kPickBoxPx, y - kPickBoxPx, 2 * kPickBoxPx, 2 * kPickBoxPx));
    }
}

void CadCanvas::drawUcsIcon(QPainter& p) const {
    const QPointF o(24, height() - 24);
    QColor ax = colors_.axisX, ay = colors_.axisY;
    ax.setAlpha(255);
    ay.setAlpha(255);
    p.setPen(QPen(ax, 2));
    p.drawLine(o, o + QPointF(36, 0));
    p.drawText(o + QPointF(40, 4), "X");
    p.setPen(QPen(ay, 2));
    p.drawLine(o, o + QPointF(0, -36));
    p.drawText(o + QPointF(-4, -42), "Y");
}

// ------------------------------------------------------------------ events

void CadCanvas::resizeEvent(QResizeEvent*) {
    const Vec2 c = view_.center();
    const double s = view_.scale();
    view_.setViewportSize(width(), height());
    if (!initialised_) {
        initialised_ = true;
        resetView();
    } else {
        view_.setView(c, s);
    }
}

void CadCanvas::updateHover() {
    EntityId h = kInvalidEntityId;
    if (selectionMode() && !windowActive_ && !panning_ && mouseInside_)
        h = pickEntity(doc_, view_.screenToWorld(v2(mousePos_)), pickTolerance());
    hover_ = h;
}

void CadCanvas::mouseMoveEvent(QMouseEvent* ev) {
    const QPointF pos = ev->position();
    if (panning_) {
        view_.panByPixels(pos.x() - panLast_.x(), pos.y() - panLast_.y());
        panLast_ = pos;
    }
    mousePos_ = pos;
    mouseInside_ = true;
    if (windowActive_ && (pos - windowStart_).manhattanLength() > kDragThresholdPx) windowDragged_ = true;
    refreshTracking();
    const Vec2 shown = proc_.wantsPoint() ? effective_ : worldAt(pos);
    emit cursorMoved(shown.x, shown.y);
    updateHover();
    update();
}

void CadCanvas::mousePressEvent(QMouseEvent* ev) {
    setFocus();
    const QPointF pos = ev->position();
    if (ev->button() == Qt::MiddleButton) {
        panning_ = true;
        panLast_ = pos;
        return;
    }
    if (ev->button() == Qt::RightButton) {
        emit enterRequested();
        return;
    }
    if (ev->button() != Qt::LeftButton) return;

    if (!selectionMode()) {
        mousePos_ = pos;
        refreshTracking();
        proc_.pointInputExact(effective_);
        refreshTracking(); // the base point has moved
        update();
        return;
    }
    if (windowActive_) { // second click of click-click window
        finishWindow(pos, ev->modifiers() & Qt::ShiftModifier);
        return;
    }
    // Clicking a grip of a selected object starts grip editing (Shift+click
    // always means "deselect", even on a grip).
    if (!proc_.isActive() && !(ev->modifiers() & Qt::ShiftModifier) && !selection_.empty() && selection_.size() <= 500) {
        for (EntityId id : selection_.ids()) {
            auto e = doc_.findEntity(id);
            if (!e) continue;
            const auto grips = e->gripPoints();
            for (std::size_t i = 0; i < grips.size(); ++i) {
                const Vec2 s = view_.worldToScreen(grips[i]);
                if (std::abs(s.x - pos.x()) <= kPickBoxPx && std::abs(s.y - pos.y()) <= kPickBoxPx) {
                    proc_.runCommandInstance(std::make_unique<GripCommand>(id, i, grips[i]));
                    refreshTracking();
                    update();
                    return;
                }
            }
        }
    }
    const EntityId hit = pickEntity(doc_, view_.screenToWorld(v2(pos)), pickTolerance());
    if (hit != kInvalidEntityId) {
        if (ev->modifiers() & Qt::ShiftModifier) selection_.remove(hit);
        else selection_.add(hit);
        update();
        return;
    }
    windowActive_ = true;
    windowDragged_ = false;
    windowStart_ = pos;
    update();
}

void CadCanvas::mouseReleaseEvent(QMouseEvent* ev) {
    if (ev->button() == Qt::MiddleButton) { panning_ = false; return; }
    if (ev->button() == Qt::LeftButton && windowActive_ && windowDragged_)
        finishWindow(ev->position(), ev->modifiers() & Qt::ShiftModifier);
}

void CadCanvas::finishWindow(const QPointF& end, bool shift) {
    windowActive_ = false;
    const bool crossing = end.x() < windowStart_.x();
    const BoundingBox box(view_.screenToWorld(v2(windowStart_)), view_.screenToWorld(v2(end)));
    const auto ids = selectInRect(doc_, box, crossing ? RectSelectMode::Crossing : RectSelectMode::Window);
    if (shift) selection_.remove(ids);
    else selection_.add(ids);
    update();
}

void CadCanvas::mouseDoubleClickEvent(QMouseEvent* ev) {
    if (ev->button() == Qt::MiddleButton) zoomExtents();
    else mousePressEvent(ev);
}

void CadCanvas::wheelEvent(QWheelEvent* ev) {
    const double steps = ev->angleDelta().y() / 120.0;
    if (steps == 0.0) return;
    view_.zoomAt(v2(ev->position()), std::pow(1.25, steps));
    mousePos_ = ev->position();
    refreshTracking();
    updateHover();
    update();
    ev->accept();
}

void CadCanvas::keyPressEvent(QKeyEvent* ev) {
    switch (ev->key()) {
    case Qt::Key_Escape:
        if (windowActive_) { windowActive_ = false; update(); return; }
        emit escapeRequested();
        update();
        return;
    case Qt::Key_Delete: emit deleteRequested(); return;
    case Qt::Key_Space:
        if (proc_.isTextInput()) { emit textTyped(QStringLiteral(" ")); return; }
        emit enterRequested();
        return;
    case Qt::Key_Return:
    case Qt::Key_Enter: emit enterRequested(); return;
    default: break;
    }
    const QString t = ev->text();
    if (!t.isEmpty() && t.at(0).isPrint() && !(ev->modifiers() & (Qt::ControlModifier | Qt::AltModifier))) {
        emit textTyped(t);
        return;
    }
    QWidget::keyPressEvent(ev);
}

void CadCanvas::leaveEvent(QEvent*) {
    mouseInside_ = false;
    hover_ = kInvalidEntityId;
    update();
}

void CadCanvas::enterEvent(QEnterEvent*) { mouseInside_ = true; }

} // namespace dyncad
