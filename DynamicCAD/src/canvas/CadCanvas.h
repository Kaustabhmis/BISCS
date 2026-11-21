// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "canvas/ViewTransform.h"
#include "commands/CommandProcessor.h"
#include "snapping/SnapEngine.h"
#include "entities/Annotation.h"
#include "ui/Theme.h"

#include <QWidget>

class QPainter;

namespace dyncad {

// Font pixel size per unit of cap height, and the GUI text-width provider.
double capHeightRatio(const std::string& font);
void installTextMetrics();

// Pen settings used when plotting (PDF / printer): colour 7 and white plot
// black, lineweights become true widths in device dots.
struct PlotPenOptions {
    double dotsPerMm = 600.0 / 25.4;
    bool monochrome = false;
    bool lineweights = true;
};

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

    // Drafting aids
    bool osnapEnabled() const { return osnap_; }
    std::uint32_t snapModes() const { return snapModes_; }
    void setSnapModes(std::uint32_t m) { snapModes_ = m; refreshTracking(); }
    bool dynamicInput() const { return dyn_; }
    bool lineweightDisplay() const { return lwDisplay_; }
    // Point the next left click will deliver (after snap / ortho / polar).
    Vec2 effectivePoint() const { return effective_; }
    const std::optional<SnapResult>& currentSnap() const { return snap_now_; }
    const std::optional<PolarResult>& currentPolar() const { return polar_now_; }
    // Recomputes snapping/tracking for the current mouse position.
    void refreshTracking();
    // Draws all visible entities through the given transform for plotting
    // (no grid, selection, grips or previews).
    void renderPlot(QPainter& p, const ViewTransform& v, const PlotPenOptions& opt) const;

public slots:
    void zoomExtents();
    void zoomBy(double factor);
    void setGridVisible(bool on);
    void setSnapEnabled(bool on);
    void resetView(); // shows an A3-sized region (420 x 297) around the origin
    void setOsnapEnabled(bool on);
    void setDynamicInput(bool on) { dyn_ = on; update(); }
    void setLineweightDisplay(bool on) { lwDisplay_ = on; update(); }
    void setDynamicInputText(const QString& t) { dynText_ = t; update(); }

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
    void drawEntity(QPainter& p, const Entity& e, const BoundingBox& visible, const Document::Resolved* style = nullptr) const;
    QPen penFor(const Document::Resolved& r) const;
    void drawText(QPainter& p, const std::string& text, const Vec2& insert, double rotationDeg, double height,
                  TextJustify justify, const std::string& font, double wrap) const;
    void drawAnnotation(QPainter& p, const AnnotationGraphics& g) const;
    void drawGrips(QPainter& p, const Entity& e) const;
    void drawSelectionWindow(QPainter& p) const;
    void drawCrosshair(QPainter& p) const;
    void drawUcsIcon(QPainter& p) const;
    void drawTrackingAids(QPainter& p) const;
    void drawSnapMarker(QPainter& p, const SnapResult& s) const;
    void drawTooltip(QPainter& p, const QPointF& at, const QStringList& lines) const;
    void finishWindow(const QPointF& end, bool shift);
    bool selectionMode() const { return !proc_.isActive() || proc_.isSelecting(); }
    void updateHover();
    const ViewTransform& vt() const { return vt_ ? *vt_ : view_; }
    mutable const ViewTransform* vt_ = nullptr;
    mutable const PlotPenOptions* plot_ = nullptr;

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

    bool osnap_ = true;
    std::uint32_t snapModes_ = kDefaultSnapModes;
    bool dyn_ = true;
    bool lwDisplay_ = false;
    QString dynText_;
    Vec2 effective_;
    std::optional<SnapResult> snap_now_;
    std::optional<PolarResult> polar_now_;
    static constexpr double kAperturePx = 10.0;
};

} // namespace dyncad
