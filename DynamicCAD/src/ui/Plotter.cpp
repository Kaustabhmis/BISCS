// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/Plotter.h"

#include "entities/BlockEntities.h"

#include <QCheckBox>
#include <QComboBox>
#include <QDialogButtonBox>
#include <QFileDialog>
#include <QFormLayout>
#include <QLabel>
#include <QLineEdit>
#include <QMessageBox>
#include <QPageLayout>
#include <QPageSize>
#include <QPainter>
#include <QPdfWriter>
#include <QPrintDialog>
#include <QPrintPreviewDialog>
#include <QPrinter>
#include <QPushButton>
#include <QVBoxLayout>

#include <cmath>

namespace dyncad {

ViewTransform plotTransform(const PlotSettings& s, double dpmm) {
    const PlotLayout L = computePlotLayout(s);
    ViewTransform v;
    v.setViewportSize(s.paperW * dpmm, s.paperH * dpmm);
    // World point that lands on the centre of the paper.
    const Vec2 paperCentre{s.paperW / 2, s.paperH / 2};
    const Vec2 worldCentre = L.worldOrigin + (paperCentre - L.originMm) / L.paperPerUnit;
    v.setView(worldCentre, L.paperPerUnit * dpmm);
    return v;
}

void paintPlot(QPainter& p, const CadCanvas& canvas, const PlotJob& job, double dpmm) {
    PlotPenOptions pen = job.pen;
    pen.dotsPerMm = dpmm;
    const ViewTransform v = plotTransform(job.layout, dpmm);
    p.save();
    p.setClipRect(QRectF(0, 0, job.layout.paperW * dpmm, job.layout.paperH * dpmm));
    canvas.renderPlot(p, v, pen);
    p.restore();
}

namespace {
QPageLayout pageLayoutFor(const PlotSettings& s) {
    const bool land = s.paperW > s.paperH;
    const QSizeF portrait(std::min(s.paperW, s.paperH), std::max(s.paperW, s.paperH));
    const QPageSize size(portrait, QPageSize::Millimeter, QString(), QPageSize::ExactMatch);
    return QPageLayout(size, land ? QPageLayout::Landscape : QPageLayout::Portrait, QMarginsF(0, 0, 0, 0), QPageLayout::Millimeter);
}
} // namespace

bool exportPdf(const CadCanvas& canvas, const PlotJob& job, const QString& path, QString* error) {
    QPdfWriter w(path);
    w.setCreator(QStringLiteral("DYNAMIC CAD"));
    w.setTitle(QStringLiteral("Drawing"));
    w.setResolution(1200);
    if (!w.setPageLayout(pageLayoutFor(job.layout))) { if (error) *error = "Paper size not accepted."; return false; }
    QPainter p;
    if (!p.begin(&w)) { if (error) *error = "Cannot write " + path; return false; }
    paintPlot(p, canvas, job, w.resolution() / 25.4);
    p.end();
    return true;
}

bool printPlot(const CadCanvas& canvas, const PlotJob& job, QPrinter& printer) {
    printer.setFullPage(true);
    printer.setPageLayout(pageLayoutFor(job.layout));
    QPainter p;
    if (!p.begin(&printer)) return false;
    // Full-page mode: device origin is the paper corner.
    paintPlot(p, canvas, job, printer.resolution() / 25.4);
    p.end();
    return true;
}

std::optional<SheetInfo> findSheet(const Document& doc) {
    for (const auto& e : doc.entities()) {
        if (e->type() != EntityType::Insert) continue;
        const auto& ins = static_cast<const InsertEntity&>(*e);
        const std::string& name = ins.block()->name;
        if (name.rfind("SHEET-", 0) != 0) continue;
        // Name: SHEET-<paper>-<DE|L|P>-1-<n> (see makeSheet).
        SheetInfo s;
        s.scaleDenominator = std::abs(ins.scaleX());
        const QStringList parts = QString::fromStdString(name).split('-');
        if (parts.size() < 3) continue;
        const auto paper = paperByName(parts[1].toStdString());
        if (!paper) continue;
        s.paper = paper->name;
        s.landscape = parts[2] != "P";
        const double pw = s.landscape ? paper->heightMm : paper->widthMm, ph = s.landscape ? paper->widthMm : paper->heightMm;
        s.area = BoundingBox(ins.position(), ins.position() + Vec2{pw * s.scaleDenominator, ph * s.scaleDenominator});
        return s;
    }
    return std::nullopt;
}

// ------------------------------------------------------------------ dialog

PlotDialog::PlotDialog(CadCanvas& canvas, Document& doc, QWidget* parent) : QDialog(parent), canvas_(canvas), doc_(doc) {
    setWindowTitle(tr("Plot / Export PDF"));
    auto* form = new QFormLayout;
    paper_ = new QComboBox(this);
    for (const auto& p : standardPapers()) paper_->addItem(QString::fromStdString(p.name));
    orient_ = new QComboBox(this);
    orient_->addItems({tr("Landscape"), tr("Portrait")});
    area_ = new QComboBox(this);
    area_->addItem(tr("Extents"), "extents");
    area_->addItem(tr("Display"), "display");
    const auto sheet = findSheet(doc_);
    if (sheet) area_->insertItem(0, tr("Sheet (title block)"), "sheet");
    area_->setCurrentIndex(0);
    scale_ = new QLineEdit(this);
    scale_->setPlaceholderText(tr("Fit, or 1:n such as 1:5"));
    mono_ = new QCheckBox(tr("Monochrome (lines black, fills grey)"), this);
    lw_ = new QCheckBox(tr("Plot lineweights"), this);
    lw_->setChecked(true);
    info_ = new QLabel(this);
    info_->setWordWrap(true);
    form->addRow(tr("Paper"), paper_);
    form->addRow(tr("Orientation"), orient_);
    form->addRow(tr("Plot area"), area_);
    form->addRow(tr("Scale"), scale_);
    form->addRow(QString(), mono_);
    form->addRow(QString(), lw_);
    form->addRow(info_);
    paper_->setCurrentText("A3");
    if (sheet) {
        paper_->setCurrentText(QString::fromStdString(sheet->paper));
        orient_->setCurrentIndex(sheet->landscape ? 0 : 1);
        scale_->setText(QString::fromStdString(scaleName(1.0 / sheet->scaleDenominator)));
    }
    auto* buttons = new QDialogButtonBox(this);
    auto* pdf = buttons->addButton(tr("Export PDF..."), QDialogButtonBox::AcceptRole);
    auto* print = buttons->addButton(tr("Print..."), QDialogButtonBox::ActionRole);
    auto* preview = buttons->addButton(tr("Preview..."), QDialogButtonBox::ActionRole);
    buttons->addButton(QDialogButtonBox::Close);
    connect(pdf, &QPushButton::clicked, this, &PlotDialog::doPdf);
    connect(print, &QPushButton::clicked, this, &PlotDialog::doPrint);
    connect(preview, &QPushButton::clicked, this, &PlotDialog::doPreview);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::reject);
    for (auto* c : {paper_, orient_, area_}) connect(c, &QComboBox::currentIndexChanged, this, &PlotDialog::updateInfo);
    connect(scale_, &QLineEdit::textChanged, this, &PlotDialog::updateInfo);
    connect(mono_, &QCheckBox::toggled, this, &PlotDialog::updateInfo);
    auto* lay = new QVBoxLayout(this);
    lay->addLayout(form);
    lay->addWidget(buttons);
    updateInfo();
}

PlotJob PlotDialog::job() const {
    PlotJob j;
    const auto paper = paperByName(paper_->currentText().toStdString()).value_or(PaperSize{"A3", 297, 420});
    const bool land = orient_->currentIndex() == 0;
    j.layout.paperW = land ? paper.heightMm : paper.widthMm;
    j.layout.paperH = land ? paper.widthMm : paper.heightMm;
    const QString a = area_->currentData().toString();
    if (a == "sheet") {
        if (auto s = findSheet(doc_)) j.layout.area = s->area;
    } else if (a == "display") {
        j.layout.area = canvas_.view().visibleWorldRect();
    } else {
        j.layout.area = doc_.extents();
        j.layout.marginMm = 5.0;
    }
    const QString t = scale_->text().trimmed();
    if (!t.isEmpty() && t.compare("fit", Qt::CaseInsensitive) != 0) j.layout.scale = parseScale(t.toStdString());
    j.pen.monochrome = mono_->isChecked();
    j.pen.lineweights = lw_->isChecked();
    return j;
}

void PlotDialog::updateInfo() {
    const PlotJob j = job();
    if (!j.layout.area.isValid()) { info_->setText(tr("Nothing to plot.")); return; }
    const PlotLayout L = computePlotLayout(j.layout);
    const double w = j.layout.area.width() * L.paperPerUnit, h = j.layout.area.height() * L.paperPerUnit;
    QString msg = tr("Paper %1 x %2 mm. Plot scale %3. Plotted area %4 x %5 mm.")
                      .arg(j.layout.paperW).arg(j.layout.paperH)
                      .arg(QString::fromStdString(scaleName(L.paperPerUnit)))
                      .arg(w, 0, 'f', 1).arg(h, 0, 'f', 1);
    if (w > j.layout.paperW + 0.5 || h > j.layout.paperH + 0.5) msg += "  " + tr("Warning: the area is larger than the paper and will be clipped.");
    if (!scale_->text().trimmed().isEmpty() && !j.layout.scale && scale_->text().trimmed().compare("fit", Qt::CaseInsensitive) != 0)
        msg += "  " + tr("Scale not understood; using Fit.");
    info_->setText(msg);
}

void PlotDialog::doPdf() {
    const QString path = QFileDialog::getSaveFileName(this, tr("Export PDF"), QString(), tr("PDF (*.pdf)"));
    if (path.isEmpty()) return;
    QString err;
    if (!exportPdf(canvas_, job(), path, &err)) QMessageBox::warning(this, tr("Export PDF"), err);
    else accept();
}

void PlotDialog::doPrint() {
    QPrinter printer(QPrinter::HighResolution);
    QPrintDialog dlg(&printer, this);
    if (dlg.exec() != QDialog::Accepted) return;
    if (!printPlot(canvas_, job(), printer)) QMessageBox::warning(this, tr("Print"), tr("Printing failed."));
    else accept();
}

void PlotDialog::doPreview() {
    QPrinter printer(QPrinter::HighResolution);
    const PlotJob j = job();
    QPrintPreviewDialog dlg(&printer, this);
    connect(&dlg, &QPrintPreviewDialog::paintRequested, this, [this, j](QPrinter* pr) { printPlot(canvas_, j, *pr); });
    dlg.exec();
}

} // namespace dyncad
