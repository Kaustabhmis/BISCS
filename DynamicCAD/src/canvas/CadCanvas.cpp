// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "canvas/CadCanvas.h"

#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Geometry.h"

#include <QKeyEvent>
#include <QMouseEvent>
#include <QPainter>
#include <QPainterPath>
#include <QWheelEvent>

#include <cmath>

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
void CadCanvas::setSnapEnabled(bool on) { snap_ = on; update(); }

// ------------------------------------------------------------------ painting

void CadCanvas::paintEvent(QPaintEvent*) {
    QPainter p(this);
    p.fillRect(rect(), colors_.background);
    if (gridVisible_) drawGrid(p);
    drawAxes(p);

    p.setRenderHint(QPainter::Antialiasing, true);
    const BoundingBox visible = view_.visibleWorldRect();

    QPen entityPen(colors_.entity, 1.0);
    entityPen.setCosmetic(true);
    p.setPen(entityPen);
    p.setBrush(Qt::NoBrush);
    for (const auto& e : doc_.entities()) {
        if (selection_.contains(e->id()) || e->id() == hover_) continue;
        if (!visible.intersects(e->bounds())) continue; // view culling
        drawEntity(p, *e, visible);
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
        if (!e || !visible.intersects(e->bounds())) continue;
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
    if (mouseInside_) drawCrosshair(p);
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

void CadCanvas::drawEntity(QPainter& p, const Entity& e, const BoundingBox& visible) const {
    // Clip to a margin around the view so huge zoom levels never overflow the
    // raster engine's fixed-point range.
    const BoundingBox clip = visible.inflated(view_.pixelsToWorld(10.0));
    auto drawSeg = [&](const Vec2& a, const Vec2& b) {
        if (auto c = geom::clipSegment(a, b, clip))
            p.drawLine(qp(view_.worldToScreen(c->first)), qp(view_.worldToScreen(c->second)));
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
        const double rpx = c.radius() * view_.scale();
        if (rpx < 0.5) {
            p.drawPoint(qp(view_.worldToScreen(c.center())));
        } else if (rpx < 1e5) {
            p.drawEllipse(qp(view_.worldToScreen(c.center())), rpx, rpx);
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
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        const auto& v = pl.vertices();
        const std::size_t n = pl.segmentCount();
        for (std::size_t i = 0; i < n; ++i) drawSeg(v[i], v[(i + 1) % v.size()]);
        break;
    }
    }
}

void CadCanvas::drawGrips(QPainter& p, const Entity& e) const {
    p.save();
    p.setRenderHint(QPainter::Antialiasing, false);
    p.setPen(QPen(Qt::white, 1));
    p.setBrush(colors_.grip);
    for (const Vec2& g : e.gripPoints()) {
        const Vec2 s = view_.worldToScreen(g);
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
    if (snap_ || (proc_.isActive() && !proc_.isSelecting())) {
        // Show the crosshair where the point will actually be placed.
        Vec2 w = worldAt(mousePos_);
        if (proc_.isActive()) w = proc_.constrainedCursor(w);
        c = qp(view_.worldToScreen(w));
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
    p.setPen(QPen(colors_.axisX, 2));
    p.drawLine(o, o + QPointF(36, 0));
    p.drawText(o + QPointF(40, 4), "X");
    p.setPen(QPen(colors_.axisY, 2));
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
    const Vec2 w = worldAt(pos);
    proc_.setCursor(w);
    const Vec2 shown = proc_.isActive() ? proc_.constrainedCursor(w) : w;
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
        proc_.pointInput(worldAt(pos));
        update();
        return;
    }
    if (windowActive_) { // second click of click-click window
        finishWindow(pos, ev->modifiers() & Qt::ShiftModifier);
        return;
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
    proc_.setCursor(worldAt(ev->position()));
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
    case Qt::Key_Return:
    case Qt::Key_Enter:
    case Qt::Key_Space: emit enterRequested(); return;
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
