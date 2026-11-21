// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "canvas/CadCanvas.h"
#include "sheets/PlotLayout.h"

#include <QDialog>
#include <QString>

class QComboBox;
class QCheckBox;
class QLineEdit;
class QLabel;
class QPrinter;

namespace dyncad {

struct PlotJob {
    PlotSettings layout;     // paper (mm), area (world), scale, centring
    PlotPenOptions pen;      // monochrome / lineweights (dotsPerMm is set per device)
};

// Transform from world to device pixels for a page of paperW x paperH mm
// rendered at dotsPerMm.
ViewTransform plotTransform(const PlotSettings& s, double dotsPerMm);
// Paints the job onto a device whose origin is the paper's top-left corner.
void paintPlot(QPainter& p, const CadCanvas& canvas, const PlotJob& job, double dotsPerMm);
// Writes a one-page vector PDF of exactly the paper size.
bool exportPdf(const CadCanvas& canvas, const PlotJob& job, const QString& path, QString* error = nullptr);
// Prints on a configured printer (full page, paper size from the job).
bool printPlot(const CadCanvas& canvas, const PlotJob& job, QPrinter& printer);
// Area of the first sheet (block named SHEET-*) and its scale denominator.
struct SheetInfo { BoundingBox area; double scaleDenominator = 1.0; std::string paper = "A3"; bool landscape = true; };
std::optional<SheetInfo> findSheet(const Document& doc);

// PLOT dialog: paper, orientation, area, scale, pens; PDF, print and preview.
class PlotDialog : public QDialog {
    Q_OBJECT
public:
    PlotDialog(CadCanvas& canvas, Document& doc, QWidget* parent = nullptr);
    PlotJob job() const;

private:
    void updateInfo();
    void doPdf();
    void doPrint();
    void doPreview();

    CadCanvas& canvas_;
    Document& doc_;
    QComboBox* paper_ = nullptr;
    QComboBox* orient_ = nullptr;
    QComboBox* area_ = nullptr;
    QLineEdit* scale_ = nullptr;
    QCheckBox* mono_ = nullptr;
    QCheckBox* lw_ = nullptr;
    QLabel* info_ = nullptr;
};

} // namespace dyncad
