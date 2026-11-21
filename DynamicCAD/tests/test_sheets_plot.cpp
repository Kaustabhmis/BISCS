// DYNAMIC CAD - drawing sheets, plot layout, PDF export and plot scale accuracy.
#include "canvas/CadCanvas.h"
#include "commands/CommandProcessor.h"
#include "commands/SheetCommands.h"
#include "entities/Annotation.h"
#include "entities/BlockEntities.h"
#include "entities/HatchEntity.h"
#include "entities/LineEntity.h"
#include "fileio/DynFormat.h"
#include "sheets/PlotLayout.h"
#include "sheets/SheetTemplates.h"
#include "ui/Plotter.h"

#include <QImage>
#include <QPainter>
#include <QTemporaryDir>
#include <QtTest>

#include <regex>

using namespace dyncad;

namespace {
bool near(double a, double b, double e = 1e-9) { return std::abs(a - b) <= e; }
struct Fx {
    Document doc;
    SelectionSet sel;
    CommandProcessor proc{doc, sel};
    std::vector<std::string> msgs;
    Fx() {
        registerCoreCommands(proc, doc);
        proc.onMessage = [this](const std::string& m) { msgs.push_back(m); };
    }
    void type(std::initializer_list<const char*> l) { for (const char* s : l) proc.submit(s); }
};
const TextEntity* findText(const Document& d, const std::string& s) {
    for (const auto& e : d.entities())
        if (e->type() == EntityType::Text && static_cast<const TextEntity&>(*e).text() == s) return static_cast<const TextEntity*>(e.get());
    return nullptr;
}
} // namespace

class TestSheetsPlot : public QObject {
    Q_OBJECT
private slots:
    void initTestCase() { installTextMetrics(); }

    void paperSizesAndScaleParsing() {
        QCOMPARE(standardPapers().size(), std::size_t(5));
        auto a3 = paperByName("a3");
        QVERIFY(a3);
        QCOMPARE(a3->widthMm, 297.0);
        QCOMPARE(a3->heightMm, 420.0);
        QCOMPARE(paperByName("A0")->heightMm, 1189.0);
        QVERIFY(!paperByName("B5"));
        QCOMPARE(*parseScale("1:5"), 0.2);
        QCOMPARE(*parseScale(" 2 : 1 "), 2.0);
        QVERIFY(!parseScale("5"));
        QVERIFY(!parseScale("1:0"));
        QCOMPARE(scaleName(0.2), std::string("1:5"));
        QCOMPARE(scaleName(2.0), std::string("2:1"));
    }

    void layoutFitAndFixedScale() {
        PlotSettings s;
        s.paperW = 420; s.paperH = 297;
        s.area = BoundingBox({0, 0}, {2100, 1485});
        s.scale = 0.2; // 1:5
        PlotLayout L = computePlotLayout(s);
        QCOMPARE(L.paperPerUnit, 0.2);
        QVERIFY(nearlyEqual(L.toPaper({0, 0}), {0, 0}, 1e-9));
        QVERIFY(nearlyEqual(L.toPaper({2100, 1485}), {420, 297}, 1e-9));
        // Fit with a 10 mm margin: limiting direction is the width.
        s.scale.reset();
        s.marginMm = 10;
        s.area = BoundingBox({0, 0}, {800, 100});
        L = computePlotLayout(s);
        QVERIFY(near(L.paperPerUnit, 400.0 / 800.0));
        QVERIFY(nearlyEqual(L.toPaper({400, 50}), {210, 148.5}, 1e-9)); // centred
    }

    void dynamicEngineersSheetGeometry() {
        SheetSpec spec;
        spec.scaleDenominator = 5;
        spec.origin = {1000, 0};
        const SheetResult r = makeSheet(spec);
        QVERIFY(r.frame);
        QCOMPARE(r.frame->name, std::string("SHEET-A3-DE-1-5"));
        QVERIFY(nearlyEqual(r.paperArea.min, {1000, 0}, 1e-9));
        QVERIFY(nearlyEqual(r.paperArea.max, {1000 + 2100, 1485}, 1e-9));
        // Block geometry is the A3 sheet in paper mm: full extents 0..420 x 0..297 (centring marks).
        BoundingBox b;
        for (const auto& e : r.frame->entities) b.expand(e->bounds());
        QVERIFY(near(b.min.x, 0, 1e-6) && near(b.min.y, 0, 1e-6));
        QVERIFY(near(b.max.x, 420, 1e-6) && near(b.max.y, 297, 1e-6));
        // Frame polyline 20..410 x 10..287 exists on DE-FRAME, layer lineweight 0.70 mm.
        bool frame = false;
        for (const auto& e : r.frame->entities)
            if (e->type() == EntityType::Polyline && e->layer() == "DE-FRAME") {
                const BoundingBox fb = e->bounds();
                frame = frame || (nearlyEqual(fb.min, {20, 10}, 1e-9) && nearlyEqual(fb.max, {410, 287}, 1e-9));
            }
        QVERIFY(frame);
        bool lw = false;
        for (const auto& l : r.layers) if (l.name == "DE-FRAME") lw = l.lineweight == 70;
        QVERIFY(lw);
        // Gold band fill, the identification cell in pale gold, all within the 180 mm panel.
        int fills = 0;
        for (const auto& e : r.frame->entities)
            if (e->type() == EntityType::Hatch) {
                ++fills;
                QVERIFY(e->bounds().min.x >= 20 - 1e-9);
            }
        QVERIFY(fills >= 8);
        // Editable placeholders are separate texts scaled to world (5x) and moved to the origin.
        bool drgNo = false, notes = false;
        for (const auto& e : r.entities) {
            if (e->type() != EntityType::Text) continue;
            const auto& t = static_cast<const TextEntity&>(*e);
            if (t.text() == "[DRAWING NUMBER TO BE CONFIRMED]") {
                drgNo = true;
                QVERIFY(nearlyEqual(t.insert(), {1000 + 232 * 5, 12.5 * 5}, 1e-9));
            }
            if (t.text().rfind("1. All dimensions are in millimetres", 0) == 0) {
                notes = true;
                QCOMPARE(t.height(), 2.5 * 5);
                QCOMPARE(t.wrapWidth(), 172.0 * 5);
                // Notes stay inside the panel above the BOM.
                QVERIFY(t.bounds().min.x >= 1000 + 230 * 5 - 1e-6);
                QVERIFY(t.bounds().max.x <= 1000 + 410 * 5 + 1e-6);
            }
        }
        QVERIFY(drgNo);
        QVERIFY(notes);
        QVERIFY(!r.openPoints.empty());
    }

    void isoSheetsAllSizes() {
        for (const auto& p : standardPapers())
            for (bool land : {true, false}) {
                SheetSpec s;
                s.dynamicEngineers = false;
                s.paper = p.name;
                s.landscape = land;
                s.scaleDenominator = 2;
                const SheetResult r = makeSheet(s);
                const double W = land ? p.heightMm : p.widthMm, H = land ? p.widthMm : p.heightMm;
                QVERIFY(nearlyEqual(r.paperArea.max, {W * 2, H * 2}, 1e-9));
                BoundingBox b;
                for (const auto& e : r.frame->entities) b.expand(e->bounds());
                QVERIFY(b.max.x <= W - 10 + 1e-6 && b.max.y <= H - 10 + 1e-6); // inside the frame
            }
    }

    void sheetCommandOneUndoAndSaveRoundTrip() {
        Fx f;
        f.type({"SHEET", "DE", "1:10", "0,0"});
        QVERIFY(!f.proc.isActive());
        QVERIFY(f.doc.findBlock("SHEET-A3-DE-1-10"));
        QVERIFY(f.doc.styles().hasLayer("DE-FRAME"));
        QVERIFY(findText(f.doc, "[DRAWING TITLE]"));
        QVERIFY(findText(f.doc, "1:10"));
        const std::size_t n = f.doc.entityCount();
        QVERIFY(n > 20);
        // Save and reload keeps the sheet.
        QTemporaryDir dir;
        const std::string path = dir.filePath("sheet.dyn").toStdString();
        QVERIFY(saveDynFile(f.doc, QString::fromStdString(path)).ok);
        Document d2;
        QVERIFY(loadDynFile(d2, QString::fromStdString(path)).ok);
        QCOMPARE(d2.entityCount(), n);
        auto info = findSheet(d2);
        QVERIFY(info);
        QCOMPARE(info->scaleDenominator, 10.0);
        QCOMPARE(info->paper, std::string("A3"));
        QVERIFY(info->landscape);
        QVERIFY(nearlyEqual(info->area.max, {4200, 2970}, 1e-9));
        // Undo removes block reference and fields; layers in a separate step.
        f.type({"U"});
        QCOMPARE(f.doc.entityCount(), std::size_t(0));
        // ISO portrait A4 via command.
        f.type({"SHEET", "A4", "P", "", "100,100"});
        auto i2 = findSheet(f.doc);
        QVERIFY(i2);
        QCOMPARE(i2->paper, std::string("A4"));
        QVERIFY(!i2->landscape);
        QVERIFY(nearlyEqual(i2->area.min, {100, 100}, 1e-9));
        QVERIFY(nearlyEqual(i2->area.max, {310, 397}, 1e-9));
        // Bad input is rejected with a message and the command stays active.
        f.type({"SHEET", "B7"});
        QVERIFY(f.proc.isActive());
        f.proc.cancel();
    }

    void plotScaleAccuracyRaster() {
        // A 100 unit line at 1:5 must plot as exactly 20 mm on paper.
        Document doc;
        SelectionSet sel;
        CommandProcessor proc(doc, sel);
        CadCanvas canvas(doc, sel, proc);
        doc.addWithUndo({std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{100, 0})}, "l");
        PlotJob job;
        job.layout.paperW = 100; job.layout.paperH = 50;
        job.layout.area = BoundingBox({-250, -125}, {750, 375});
        job.layout.scale = 0.2;
        job.pen.lineweights = false;
        const double dpmm = 10; // 254 dpi
        QImage img(int(100 * dpmm), int(50 * dpmm), QImage::Format_RGB32);
        img.fill(Qt::white);
        QPainter p(&img);
        paintPlot(p, canvas, job, dpmm);
        p.end();
        int minX = 1 << 30, maxX = -1, minY = 1 << 30, maxY = -1;
        for (int y = 0; y < img.height(); ++y)
            for (int x = 0; x < img.width(); ++x)
                if (qGray(img.pixel(x, y)) < 128) { minX = std::min(minX, x); maxX = std::max(maxX, x); minY = std::min(minY, y); maxY = std::max(maxY, y); }
        QVERIFY(maxX > minX);
        const double lenMm = (maxX - minX + 1) / dpmm;
        QVERIFY2(std::abs(lenMm - 20.0) <= 0.2, qPrintable(QString("plotted length %1 mm").arg(lenMm)));
        // Paper position: world x 0 -> 50 + (0 - 250) * 0.2 = 0 mm; x 100 -> 20 mm. y 0 -> 25 - 125*0.2 = 0 mm from bottom.
        QVERIFY(std::abs(minX / dpmm - 0.0) <= 0.2);
        QVERIFY(std::abs((img.height() - 1 - maxY) / dpmm) <= 0.3);
        // Colour 7 plots black on white.
        QVERIFY(qGray(img.pixel((minX + maxX) / 2, (minY + maxY) / 2)) < 60);
    }

    void plotLineweightWidth() {
        Document doc;
        SelectionSet sel;
        CommandProcessor proc(doc, sel);
        CadCanvas canvas(doc, sel, proc);
        auto l = std::make_shared<LineEntity>(Vec2{10, 25}, Vec2{90, 25});
        l->setLineweight(100); // 1.00 mm
        doc.addWithUndo({l}, "l");
        PlotJob job;
        job.layout.paperW = 100; job.layout.paperH = 50;
        job.layout.area = BoundingBox({0, 0}, {100, 50});
        job.layout.scale = 1.0;
        const double dpmm = 20;
        QImage img(2000, 1000, QImage::Format_RGB32);
        img.fill(Qt::white);
        QPainter p(&img);
        paintPlot(p, canvas, job, dpmm);
        p.end();
        int dark = 0;
        for (int y = 0; y < img.height(); ++y) if (qGray(img.pixel(1000, y)) < 128) ++dark;
        QVERIFY2(std::abs(dark / dpmm - 1.0) <= 0.1, qPrintable(QString("width %1 mm").arg(dark / dpmm)));
    }

    void pdfExportPageSize() {
        Fx f;
        f.type({"SHEET", "DE", "1", "0,0"});
        SelectionSet sel;
        CadCanvas canvas(f.doc, f.sel, f.proc);
        auto info = findSheet(f.doc);
        QVERIFY(info);
        PlotJob job;
        job.layout.paperW = 420; job.layout.paperH = 297;
        job.layout.area = info->area;
        job.layout.scale = 1.0;
        QTemporaryDir dir;
        const QString path = dir.filePath("a3.pdf");
        QString err;
        QVERIFY2(exportPdf(canvas, job, path, &err), qPrintable(err));
        QFile file(path);
        QVERIFY(file.open(QIODevice::ReadOnly));
        const QByteArray data = file.readAll();
        QVERIFY(data.startsWith("%PDF-"));
        QVERIFY(data.size() > 5000);
        // MediaBox in points: 420 x 297 mm = 1190.55 x 841.89 pt.
        const std::string s = data.toStdString();
        std::smatch m;
        QVERIFY(std::regex_search(s, m, std::regex(R"(/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\])")));
        const double w = std::stod(m[1]), h = std::stod(m[2]);
        QVERIFY2(std::abs(w - 420 / 25.4 * 72) < 1.0 && std::abs(h - 297 / 25.4 * 72) < 1.0,
                 qPrintable(QString("MediaBox %1 x %2").arg(w).arg(h)));
        // Text is embedded as vector text (a font object is present).
        QVERIFY(data.contains("/Font"));
    }

    void renderSheetPreviewImage() {
        // Produces a review image of the DE sheet (saved next to the build) and checks colours.
        Fx f;
        f.type({"SHEET", "DE", "1", "0,0"});
        CadCanvas canvas(f.doc, f.sel, f.proc);
        PlotJob job;
        job.layout.paperW = 420; job.layout.paperH = 297;
        job.layout.area = findSheet(f.doc)->area;
        job.layout.scale = 1.0;
        const double dpmm = 4;
        QImage img(int(420 * dpmm), int(297 * dpmm), QImage::Format_RGB32);
        img.fill(Qt::white);
        QPainter p(&img);
        paintPlot(p, canvas, job, dpmm);
        p.end();
        img.save("sheet-de-a3-preview.png");
        // Gold band (y 110..111.6 mm, x 230..410) is gold.
        const QColor gold = img.pixelColor(int(320 * dpmm), int((297 - 110.8) * dpmm));
        QVERIFY2(gold.red() > 200 && gold.green() > 150 && gold.blue() < 80, qPrintable(gold.name()));
        // Frame line at x = 20 mm is dark.
        QVERIFY(qGray(img.pixel(int(20 * dpmm), int(200 * dpmm))) < 100);
    }
};

QTEST_MAIN(TestSheetsPlot)
#include "test_sheets_plot.moc"
