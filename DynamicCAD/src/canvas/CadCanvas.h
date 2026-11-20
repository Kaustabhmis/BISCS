// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "canvas/ViewTransform.h"
#include "commands/CommandProcessor.h"
#include "ui/Theme.h"

#include <QWidget>

class QPainter;

namespace dyncad {

// Model-space drawing canvas: grid, crosshair, entities, selection, previews.
// Mouse: wheel = zoom at cursor, middle-drag = pan, middle double-click =
// zoom extents, left = pick point / select, right = Enter.
class CadCanvas : public QWidget {
    Q_OBJECT
public:
    CadCanvas(Document& doc, SelectionSet& selection, CommandProcessor& proc, QWidget* parent = nullptr);
    ~CadCanvas() override;

    ViewTransform& view() { return view_; }
    const ViewTransform& view() const { return view_; }

    bool gridVisible() const { return gridVisible_; }
    bool snapEnabled() const { return snap_; }
    double currentGridStep() const;
    // World point under a widget position, with grid snap applied if enabled.
    Vec2 worldAt(const QPointF& widgetPos) const;
    // Pick tolerance in world units (pick box half-size).
    double pickTolerance() const { return view_.pixelsToWorld(kPickBoxPx); }

    void setColors(const CanvasColors& c) { colors_ = c; update(); }

public slots:
    void zoomExtents();
    void zoomBy(double factor);
    void setGridVisible(bool on);
    void setSnapEnabled(bool on);
    void resetView(); // shows an A3-sized region (420 x 297) around the origin

signals:
    void cursorMoved(double worldX, double worldY);
    void textTyped(const QString& text); // printable keys typed on the canvas
    void enterRequested();               // right-click / Enter / Space
    void escapeRequested();
    void deleteRequested();

protected:
    void paintEvent(QPaintEvent*) override;
    void resizeEvent(QResizeEvent*) override;
    void mousePressEvent(QMouseEvent*) override;
    void mouseReleaseEvent(QMouseEvent*) override;
    void mouseMoveEvent(QMouseEvent*) override;
    void mouseDoubleClickEvent(QMouseEvent*) override;
    void wheelEvent(QWheelEvent*) override;
    void keyPressEvent(QKeyEvent*) override;
    void leaveEvent(QEvent*) override;
    void enterEvent(QEnterEvent*) override;

private:
    static constexpr double kPickBoxPx = 5.0;
    static constexpr double kDragThresholdPx = 4.0;

    void drawGrid(QPainter& p) const;
    void drawAxes(QPainter& p) const;
    void drawEntity(QPainter& p, const Entity& e, const BoundingBox& visible) const;
    void drawGrips(QPainter& p, const Entity& e) const;
    void drawSelectionWindow(QPainter& p) const;
    void drawCrosshair(QPainter& p) const;
    void drawUcsIcon(QPainter& p) const;
    void finishWindow(const QPointF& end, bool shift);
    bool selectionMode() const { return !proc_.isActive() || proc_.isSelecting(); }
    void updateHover();

    Document& doc_;
    SelectionSet& selection_;
    CommandProcessor& proc_;
    ViewTransform view_;
    CanvasColors colors_;
    int docListener_ = 0;

    bool gridVisible_ = true;
    bool snap_ = false;
    bool initialised_ = false;

    QPointF mousePos_;
    bool mouseInside_ = false;
    bool panning_ = false;
    QPointF panLast_;

    bool windowActive_ = false; // rectangle selection in progress
    bool windowDragged_ = false;
    QPointF windowStart_;
    EntityId hover_ = kInvalidEntityId;
};

} // namespace dyncad
