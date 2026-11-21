// DYNAMIC CAD - GUI integration tests (headless, offscreen platform).
// Drives the real MainWindow with simulated mouse and keyboard input.
#include "canvas/CadCanvas.h"
#include "entities/Annotation.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/PolylineEntity.h"
#include "entities/LineEntity.h"
#include "ui/CommandLine.h"
#include "snapping/SnapEngine.h"
#include "ui/LayerPanel.h"
#include "ui/MainWindow.h"
#include "ui/PropertiesPanel.h"
#include <QComboBox>
#include <QTableWidget>

#include <QLineEdit>
#include <QTabWidget>
#include <QTemporaryDir>
#include <QtTest>

using namespace dyncad;

class TestGui : public QObject {
    Q_OBJECT
    QPoint screenOf(MainWindow& w, Vec2 world) {
        const Vec2 s = w.canvas()->view().worldToScreen(world);
        return QPoint(int(std::lround(s.x)), int(std::lround(s.y)));
    }
private slots:
    void initTestCase() {
        QCoreApplication::setOrganizationName("DynamicEngineersTest");
        QCoreApplication::setApplicationName("DynamicCADTest");
    }

    void drawWithCommandLineSelectAndDelete() {
        MainWindow w;
        w.resize(1200, 800);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        auto& doc = w.document();

        // Type into the command line widget exactly like a user.
        QLineEdit* in = w.commandLine()->input();
        for (const char* line : {"L", "0,0", "100,0", "@0,50", ""}) {
            in->setFocus();
            QTest::keyClicks(in, line);
            QTest::keyClick(in, Qt::Key_Return);
        }
        QCOMPARE(doc.entityCount(), std::size_t(2));
        w.executeCommandText("C");
        w.executeCommandText("200,100");
        w.executeCommandText("25");
        w.executeCommandText("REC");
        w.executeCommandText("300,0");
        w.executeCommandText("@50,40");
        QCOMPARE(doc.entityCount(), std::size_t(4));

        w.executeCommandText("ZOOM E");
        CadCanvas* c = w.canvas();

        // Click exactly on the first line -> selected.
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {50, 0}));
        QCOMPARE(w.selection().size(), std::size_t(1));
        QCOMPARE(w.selection().ids().front(), doc.entities()[0]->id());
        // Shift+click removes it again.
        QTest::mouseClick(c, Qt::LeftButton, Qt::ShiftModifier, screenOf(w, {50, 0}));
        QVERIFY(w.selection().empty());

        // Window selection (left -> right) around the circle only.
        QTest::mousePress(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {160, 60}));
        QTest::mouseMove(c, screenOf(w, {240, 140}));
        QTest::mouseRelease(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {240, 140}));
        QCOMPARE(w.selection().size(), std::size_t(1));
        QVERIFY(doc.findEntity(w.selection().ids().front())->type() == EntityType::Circle);

        // Delete key erases it; Ctrl+Z restores it.
        c->setFocus();
        QTest::keyClick(c, Qt::Key_Delete);
        QCOMPARE(doc.entityCount(), std::size_t(3));
        QVERIFY(w.selection().empty());
        QTest::keyClick(c, Qt::Key_Z, Qt::ControlModifier);
        QCOMPARE(doc.entityCount(), std::size_t(4));
        QTest::keyClick(c, Qt::Key_Y, Qt::ControlModifier);
        QCOMPARE(doc.entityCount(), std::size_t(3));

        // Crossing selection (right -> left) touching both lines.
        QTest::mousePress(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {110, 20}));
        QTest::mouseMove(c, screenOf(w, {90, -5}));
        QTest::mouseRelease(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {90, -5}));
        QCOMPARE(w.selection().size(), std::size_t(2));
        QTest::keyClick(c, Qt::Key_Escape);
        QVERIFY(w.selection().empty());
    }

    void mouseDrawingAndTypingOnCanvas() {
        MainWindow w;
        w.resize(1000, 700);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        CadCanvas* c = w.canvas();
        c->setFocus();
        // Typing on the canvas goes to the command line.
        QTest::keyClicks(c, "l");
        QCOMPARE(w.commandLine()->input()->text(), QString("l"));
        QTest::keyClick(w.commandLine()->input(), Qt::Key_Return);
        QVERIFY(w.processor().isActive());

        const Vec2 a = c->view().screenToWorld({200, 300});
        const Vec2 b = c->view().screenToWorld({500, 300});
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, QPoint(200, 300));
        QTest::mouseMove(c, QPoint(500, 300));
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, QPoint(500, 300));
        QTest::mouseClick(c, Qt::RightButton, Qt::NoModifier, QPoint(500, 300)); // right-click = Enter
        QVERIFY(!w.processor().isActive());
        QCOMPARE(w.document().entityCount(), std::size_t(1));
        const auto& l = static_cast<const LineEntity&>(*w.document().entities()[0]);
        QVERIFY(nearlyEqual(l.start(), a, 1e-9));
        QVERIFY(nearlyEqual(l.end(), b, 1e-9));
    }

    void snapPlacesPointsOnGrid() {
        MainWindow w;
        w.resize(1000, 700);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        CadCanvas* c = w.canvas();
        c->setSnapEnabled(true);
        w.executeCommandText("C");
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, QPoint(333, 222));
        w.executeCommandText("7");
        QCOMPARE(w.document().entityCount(), std::size_t(1));
        const auto& circ = static_cast<const CircleEntity&>(*w.document().entities()[0]);
        const double step = c->currentGridStep();
        QVERIFY(std::abs(std::remainder(circ.center().x, step)) < 1e-9);
        QVERIFY(std::abs(std::remainder(circ.center().y, step)) < 1e-9);
    }

    void zoomWheelAndPan() {
        MainWindow w;
        w.resize(1000, 700);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        CadCanvas* c = w.canvas();
        const QPointF pos(321, 234);
        const Vec2 before = c->view().screenToWorld({pos.x(), pos.y()});
        const double s0 = c->view().scale();
        QWheelEvent wheel(pos, c->mapToGlobal(pos), QPoint(), QPoint(0, 120), Qt::NoButton, Qt::NoModifier,
                          Qt::NoScrollPhase, false);
        QApplication::sendEvent(c, &wheel);
        QVERIFY(c->view().scale() > s0);
        QVERIFY(nearlyEqual(c->view().screenToWorld({pos.x(), pos.y()}), before, 1e-9));

        QTest::mousePress(c, Qt::MiddleButton, Qt::NoModifier, QPoint(300, 300));
        QMouseEvent move(QEvent::MouseMove, QPointF(350, 280), c->mapToGlobal(QPointF(350, 280)), Qt::NoButton,
                         Qt::MiddleButton, Qt::NoModifier);
        const Vec2 w0 = c->view().screenToWorld({300, 300});
        QApplication::sendEvent(c, &move);
        QTest::mouseRelease(c, Qt::MiddleButton, Qt::NoModifier, QPoint(350, 280));
        QVERIFY(nearlyEqual(c->view().worldToScreen(w0), {350, 280}, 1e-6));
    }

    void saveAndReopen() {
        QTemporaryDir dir;
        const QString path = dir.filePath("gui.dyn");
        {
            MainWindow w;
            w.executeCommandText("REC");
            w.executeCommandText("0,0");
            w.executeCommandText("10,10");
            QVERIFY(w.isWindowModified() || w.document().isModified());
            QVERIFY(w.saveToFile(path));
            QVERIFY(!w.document().isModified());
            QVERIFY(w.windowTitle().startsWith("gui.dyn"));
        }
        MainWindow w2;
        QVERIFY(w2.openFile(path));
        QCOMPARE(w2.document().entityCount(), std::size_t(1));
        QVERIFY(!w2.document().isModified());
    }

    void importDxfIntoWindow() {
        MainWindow w;
        w.resize(1200, 800);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        QVERIFY(w.importDxfPath(QString(DYNCAD_DXF_FIXTURES) + "/mixed_R2010.dxf", false));
        QCOMPARE(w.document().entityCount(), std::size_t(15));
        QVERIFY(w.currentFile().isEmpty()); // never overwrite the DXF on Save
        QVERIFY(w.windowTitle().contains("mixed_R2010.dxf (imported)"));
        QVERIFY(w.commandLine()->history().contains("paper-space"));
        // Imported arcs are selectable: pick the quarter arc r=20 at 45 degrees.
        const Vec2 onArc = Vec2::fromPolar(20, degToRad(45));
        QTest::mouseClick(w.canvas(), Qt::LeftButton, Qt::NoModifier, screenOf(w, onArc));
        QCOMPARE(w.selection().size(), std::size_t(1));
        QCOMPARE(w.document().findEntity(w.selection().ids().front())->type(), EntityType::Arc);
        // Screenshot of the sample flange for visual review.
        w.setTheme(ThemeKind::Dark);
        QVERIFY(w.importDxfPath(QString(DYNCAD_DXF_FIXTURES) + "/../../../docs/samples/sample-flange.dxf", false));
        QTest::mouseMove(w.canvas(), screenOf(w, {60, 60}));
        QApplication::processEvents();
        w.grab().toImage().save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_dxf_import.png"));
        QVERIFY(w.importDxfPath(QString(DYNCAD_DXF_FIXTURES) + "/mixed_R2010.dxf", false));
        // A broken file reports an error and keeps the current drawing.
        QVERIFY(!w.importDxfPath("/nonexistent/broken.dxf", false));
        QCOMPARE(w.document().entityCount(), std::size_t(15));
    }

    void ribbonDrawToolsWithMouse() {
        MainWindow w;
        w.resize(1300, 800);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        auto* c = w.canvas();
        // Every Draw/Shapes action is a real, enabled command (no dead buttons).
        const QStringList tools{"Line", "Polyline", "Arc", "Circle", "Ellipse", "Spline", "Rectangle", "Square", "Polygon", "Point", "Arrow"};
        QStringList seen;
        for (QAction* a : w.findChildren<QAction*>()) {
            const QString t = a->text().remove('&');
            if (!tools.contains(t)) continue;
            QVERIFY(a->isEnabled());
            a->trigger();
            QVERIFY2(w.processor().isActive(), qPrintable(t));
            w.processor().cancel();
            seen << t;
        }
        seen.removeDuplicates();
        QCOMPARE(seen.size(), tools.size());

        auto click = [&](QPoint p) { QTest::mouseMove(c, p); QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, p); };
        w.executeCommandText("ARROW");
        click({200, 400}); click({500, 400});
        w.executeCommandText("POLYGON");
        w.executeCommandText("5");
        click({700, 300}); w.executeCommandText(""); click({760, 300});
        w.executeCommandText("ELLIPSE");
        click({300, 200}); click({500, 200}); click({400, 160});
        w.executeCommandText("SPLINE");
        click({600, 500}); click({650, 450}); click({700, 520}); click({760, 470});
        QTest::mouseClick(c, Qt::RightButton, Qt::NoModifier, QPoint(760, 470)); // right-click = Enter
        QVERIFY(!w.processor().isActive());
        int arrows = 0, polygons = 0, ellipses = 0, splines = 0;
        for (const auto& e : w.document().entities()) {
            if (e->type() == EntityType::Ellipse) ++ellipses;
            if (e->type() == EntityType::Spline) ++splines;
            if (e->type() == EntityType::Polyline) {
                const auto& p = static_cast<const PolylineEntity&>(*e);
                if (p.isFilled()) ++arrows;
                else if (p.vertices().size() == 5) ++polygons;
            }
        }
        QCOMPARE(arrows, 1);
        QCOMPARE(polygons, 1);
        QCOMPARE(ellipses, 1);
        QCOMPARE(splines, 1);
        // The arrow tip lands exactly where the mouse clicked.
        const Vec2 tip = c->view().screenToWorld({500, 400});
        bool found = false;
        for (const auto& e : w.document().entities())
            if (e->type() == EntityType::Polyline && static_cast<const PolylineEntity&>(*e).isFilled())
                found = nearlyEqual(static_cast<const PolylineEntity&>(*e).vertices()[0], tip, 1e-9);
        QVERIFY(found);
    }

    void objectSnapWithMouse() {
        MainWindow w;
        w.resize(1200, 800);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        auto* c = w.canvas();
        c->setOsnapEnabled(true);
        c->setSnapModes(kDefaultSnapModes);
        w.executeCommandText("C");
        w.executeCommandText("100,100");
        w.executeCommandText("40");
        w.executeCommandText("ZOOM E");
        // Start a line near (not on) the circle's right quadrant: it must snap exactly.
        w.executeCommandText("L");
        const QPoint nearQuad = screenOf(w, {140, 100}) + QPoint(3, -2);
        QTest::mouseMove(c, nearQuad);
        QVERIFY(c->currentSnap() && c->currentSnap()->mode == SnapQuadrant);
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, nearQuad);
        // End near the centre-ish of the curve's top: centre snap is offered on the curve.
        const QPoint nearTop = screenOf(w, {100, 140}) + QPoint(2, 2);
        QTest::mouseMove(c, nearTop);
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, nearTop);
        w.executeCommandText("");
        const auto& l = static_cast<const LineEntity&>(*w.document().entities().back());
        QCOMPARE(l.start(), Vec2(140, 100));
        QVERIFY(nearlyEqual(l.end(), {100, 140}, 1e-12));

        // One-shot override from the command line: PER from (0,0) onto that line (foot = (120,120)).
        w.executeCommandText("L");
        w.executeCommandText("0,0");
        w.executeCommandText("PER");
        const QPoint onLine = screenOf(w, {120.5, 119.5});
        QTest::mouseMove(c, onLine);
        QVERIFY(c->currentSnap() && c->currentSnap()->mode == SnapPerpendicular);
        w.setTheme(ThemeKind::Dark);
        QApplication::processEvents();
        w.grab().toImage().save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_osnap.png"));
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, onLine);
        w.executeCommandText("");
        const auto& per = static_cast<const LineEntity&>(*w.document().entities().back());
        const Vec2 dir = (l.end() - l.start()).normalized();
        QVERIFY(std::abs((per.end() - per.start()).dot(dir)) < 1e-9); // really perpendicular

        // OSNAP off: no snapping.
        c->setOsnapEnabled(false);
        w.executeCommandText("L");
        QTest::mouseMove(c, nearQuad);
        QVERIFY(!c->currentSnap());
        w.processor().cancel();
    }

    void gripDragAndClipboard() {
        MainWindow w;
        w.resize(1200, 800);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        auto* c = w.canvas();
        c->setOsnapEnabled(false);
        w.executeCommandText("L");
        w.executeCommandText("0,0");
        w.executeCommandText("100,0");
        w.executeCommandText("");
        w.executeCommandText("ZOOM E");
        const EntityId id = w.document().entities()[0]->id();
        // Select the line, click its end grip, click the new position.
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {30, 0}));
        QCOMPARE(w.selection().size(), std::size_t(1));
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {100, 0}));
        QCOMPARE(QString::fromStdString(w.processor().activeName()), QString("GRIP"));
        w.executeCommandText("100,40");
        const auto& l = static_cast<const LineEntity&>(*w.document().findEntity(id));
        QCOMPARE(l.end(), Vec2(100, 40));
        QCOMPARE(l.start(), Vec2(0, 0));

        // Ctrl+C / Ctrl+V through the real clipboard.
        w.selection().clear();
        w.selection().add(id);
        c->setFocus();
        QTest::keyClick(c, Qt::Key_C, Qt::ControlModifier);
        QTest::keyClick(c, Qt::Key_V, Qt::ControlModifier);
        QCOMPARE(QString::fromStdString(w.processor().activeName()), QString("PASTECLIP"));
        w.executeCommandText("500,500");
        QCOMPARE(w.document().entityCount(), std::size_t(2));
        const auto& pasted = static_cast<const LineEntity&>(*w.document().entities()[1]);
        QCOMPARE(pasted.start(), Vec2(500, 500)); // lower-left corner at the insertion point
        QCOMPARE(pasted.end(), Vec2(600, 540));
        // Ctrl+X removes the original.
        w.selection().add(id);
        QTest::keyClick(c, Qt::Key_X, Qt::ControlModifier);
        QCOMPARE(w.document().entityCount(), std::size_t(1));
        // Modify ribbon: every editing action starts a real command.
        int checked = 0;
        for (QAction* a : w.findChildren<QAction*>()) {
            const QString t = a->text().remove('&');
            static const QStringList tools{"Move", "Copy", "Rotate", "Scale", "Mirror", "Stretch", "Array", "Offset",
                                           "Trim", "Extend", "Fillet", "Chamfer", "Break", "Join", "Explode"};
            if (!tools.contains(t)) continue;
            w.selection().clear();
            a->trigger();
            QVERIFY2(w.processor().isActive(), qPrintable(t));
            w.processor().cancel();
            ++checked;
        }
        QCOMPARE(checked, 15);
        if (auto* rib = w.findChild<QTabWidget*>("Ribbon")) {
            rib->setCurrentIndex(1); // Modify tab
            w.setTheme(ThemeKind::Dark);
            QApplication::processEvents();
            w.grab().toImage().save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_modify_tab.png"));
        }
    }

    void layersColoursAndProperties() {
        MainWindow w;
        w.setTheme(ThemeKind::Dark);
        w.resize(1200, 800);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        auto* c = w.canvas();
        c->setGridVisible(false);
        c->setOsnapEnabled(false);
        auto& doc = w.document();
        // New layer via the panel, make it red + CENTER, make it current.
        const QString name = w.layerPanel()->newLayer();
        StyleTables t = doc.styles();
        t.layer(name.toStdString())->color = CadColor::fromIndex(1);
        doc.setStylesWithUndo(t, "red");
        QVERIFY(w.layerPanel()->setCurrent(name));
        w.executeCommandText("L"); w.executeCommandText("0,0"); w.executeCommandText("100,0"); w.executeCommandText("");
        w.executeCommandText("ZOOM E");
        QApplication::processEvents();
        QCOMPARE(QString::fromStdString(doc.entities()[0]->layer()), name);
        // The line is drawn in red on screen.
        auto redAt = [&](Vec2 world) {
            const QImage img = c->grab().toImage();
            const QPoint s = screenOf(w, world);
            for (int dy = -1; dy <= 1; ++dy) {
                const QColor px = img.pixelColor(s.x(), s.y() + dy);
                // Red-dominant (a 1 px line between two pixel rows is anti-aliased to half intensity).
                if (px.red() > px.green() + 60 && px.red() > px.blue() + 60) return true;
            }
            return false;
        };
        QTest::mouseMove(c, QPoint(5, 5));
        QVERIFY(redAt({50, 0}));
        // Dashed linetype leaves gaps along the line.
        t = doc.styles();
        t.layer(name.toStdString())->linetype = "DASHED";
        t.setLtscale(1.0);
        doc.setStylesWithUndo(t, "dashed");
        QApplication::processEvents();
        int gaps = 0, dashes = 0;
        for (double x = 2; x < 98; x += 0.5) (redAt({x, 0}) ? dashes : gaps)++;
        QVERIFY2(gaps > 20 && dashes > 20, qPrintable(QString("%1 gaps %2 dashes").arg(gaps).arg(dashes)));
        // Turning the layer off hides and protects its objects.
        t = doc.styles();
        t.layer(name.toStdString())->on = false;
        doc.setStylesWithUndo(t, "off");
        QApplication::processEvents();
        QVERIFY(!redAt({50, 0}));
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {50, 0}));
        QVERIFY(w.selection().empty());
        QTest::keyClick(c, Qt::Key_Escape); // that click started a selection window: cancel it
        w.executeCommandText("U");
        QApplication::processEvents();
        QTest::mouseClick(c, Qt::LeftButton, Qt::NoModifier, screenOf(w, {30, 0}));
        QCOMPARE(w.selection().size(), std::size_t(1));
        // Properties panel: edit the line end, and the layer panel lists the layer.
        QApplication::processEvents();
        QVERIFY(w.propertiesPanel()->editGeometry("End", "100, 25"));
        QCOMPARE(static_cast<const LineEntity&>(*doc.entities()[0]).end(), Vec2(100, 25));
        QVERIFY(!w.propertiesPanel()->editGeometry("End", "garbage"));
        QApplication::processEvents();
        QCOMPARE(w.layerPanel()->table()->rowCount(), 2);
        // Ribbon layer combo moves the selected line back to layer 0.
        auto combos = w.findChildren<QComboBox*>();
        QComboBox* layerCombo = nullptr;
        for (auto* cb : combos) if (cb->toolTip().startsWith("Current layer")) layerCombo = cb;
        QVERIFY(layerCombo);
        layerCombo->setCurrentIndex(layerCombo->findData("0"));
        emit layerCombo->activated(layerCombo->currentIndex());
        QCOMPARE(QString::fromStdString(doc.entities()[0]->layer()), QString("0"));
        QVERIFY(w.layerPanel()->deleteLayer(name) == false); // still current
        w.layerPanel()->setCurrent("0");
        QVERIFY(w.layerPanel()->deleteLayer(name));          // now empty and not current
        w.executeCommandText("LTSCALE 2");
        QCOMPARE(doc.styles().ltscale(), 2.0);
    }

    void layersScreenshot() {
        MainWindow w;
        w.setTheme(ThemeKind::Dark);
        w.resize(1400, 860);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        QVERIFY(w.importDxfPath(QString(DYNCAD_DXF_FIXTURES) + "/../../../docs/samples/sample-flange.dxf", false));
        StyleTables t = w.document().styles();
        t.layer("CENTER")->linetype = "CENTER";
        t.layer("PART")->lineweight = 50;
        t.setLtscale(1.5);
        w.document().setStylesWithUndo(t, "styles");
        w.executeCommandText("LWDISPLAY");
        w.executeCommandText("LAYER");
        w.executeCommandText("ZOOM E");
        QTest::mouseMove(w.canvas(), QPoint(10, 10));
        QApplication::processEvents();
        QApplication::processEvents();
        w.grab().toImage().save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_layers.png"));
        w.executeCommandText("LWDISPLAY");
    }

    void annotationInWindow() {
        MainWindow w;
        w.setTheme(ThemeKind::Dark);
        w.resize(1400, 860);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        QLineEdit* in = w.commandLine()->input();
        auto typeLine = [&](const char* s) { in->setFocus(); QTest::keyClicks(in, s); QTest::keyClick(in, Qt::Key_Return); };
        // A flange-like part with dimensions and notes.
        for (const char* l : {"REC", "F", "10", "0,0", "200,120", "C", "100,60", "30", "C", "25,25", "8.75",
                              "C", "175,25", "8.75", "C", "25,95", "8.75", "C", "175,95", "8.75", "REC", "F", "0", ""})
            w.executeCommandText(l);
        w.processor().cancel();
        for (const char* l : {"DLI", "0,0", "200,0", "100,-20", "DLI", "200,0", "200,120", "225,60",
                              "DLI", "25,25", "175,25", "100,10", "DDI", "130,60", "150,85", "DRA", "33.75,95", "60,115"})
            w.executeCommandText(l);
        // TEXT typed through the command line: Space must be a space here.
        typeLine("DT");
        typeLine("0,-45");
        typeLine("5");
        typeLine("0");
        typeLine("BASE PLATE - PL 10 THK");
        typeLine("");
        QVERIFY(!w.processor().isActive());
        const auto* t = dynamic_cast<const TextEntity*>(w.document().entities().back().get());
        QVERIFY(t);
        QCOMPARE(QString::fromStdString(t->text()), QString("BASE PLATE - PL 10 THK"));
        for (const char* l : {"LE", "181.2,31.2", "215,-20", "235,-20", ""}) w.executeCommandText(l);
        typeLine("4 HOLES DIA 17.5");
        typeLine("");
        w.executeCommandText("ZOOM E");
        QTest::mouseMove(w.canvas(), QPoint(10, 10));
        QApplication::processEvents();
        if (auto* rib = w.findChild<QTabWidget*>("Ribbon")) rib->setCurrentIndex(2); // Annotate
        QApplication::processEvents();
        w.grab().toImage().save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_annotation.png"));
        int dims = 0;
        for (const auto& e : w.document().entities()) dims += e->type() == EntityType::Dimension;
        QCOMPARE(dims, 5);
    }

    void hatchAndBlocksScreenshot() {
        MainWindow w;
        w.setTheme(ThemeKind::Dark);
        w.resize(1400, 860);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        for (const char* l : {"REC", "0,0", "120,80", "C", "35,40", "15", "C", "85,40", "15",
                              "H", "ANSI31", "S", "1.5", "60,70", "",
                              "REC", "150,0", "@60,80", "H", "SOLID", "180,40", "",
                              "REC", "240,0", "@60,80", "H", "NET", "S", "2", "270,40", ""})
            w.executeCommandText(l);
        // A block of a bolt symbol, inserted three times.
        for (const char* l : {"C", "0,120", "6", "L", "-9,120", "9,120", "", "L", "0,111", "0,129", ""}) w.executeCommandText(l);
        for (int i = 0; i < 3; ++i) w.selection().add(w.document().entities()[w.document().entityCount() - 1 - i]->id());
        QLineEdit* in = w.commandLine()->input();
        auto typeLine = [&](const char* s) { in->setFocus(); QTest::keyClicks(in, s); QTest::keyClick(in, Qt::Key_Return); };
        typeLine("B"); typeLine("BOLT M12"); typeLine("0,120");
        for (const char* l : {"I", ""}) (void)l;
        typeLine("I"); typeLine("BOLT M12"); typeLine("100,120"); typeLine("1.5"); typeLine("45");
        typeLine("I"); typeLine("BOLT M12"); typeLine("200,120"); typeLine("2"); typeLine("0");
        w.executeCommandText("ZOOM E");
        QTest::mouseMove(w.canvas(), QPoint(10, 10));
        QApplication::processEvents();
        w.grab().toImage().save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_hatch_blocks.png"));
        int inserts = 0, hatches = 0;
        for (const auto& e : w.document().entities()) { inserts += e->type() == EntityType::Insert; hatches += e->type() == EntityType::Hatch; }
        QCOMPARE(inserts, 3);
        QCOMPARE(hatches, 3);
    }

    void toolsScreenshot() {
        MainWindow w;
        w.setTheme(ThemeKind::Dark);
        w.resize(1400, 860);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        for (const char* l : {"L", "0,0", "60,40", "",
                              "PL", "80,0", "120,0", "A", "120,40", "L", "80,40", "C",
                              "A", "140,0", "160,30", "190,10",
                              "C", "230,20", "20",
                              "EL", "C", "300,20", "330,20", "15",
                              "SPL", "350,0", "370,40", "390,0", "410,40", "430,10", "",
                              "REC", "F", "6", "0,70", "60,110",
                              "REC", "F", "0", "80,70", "@40,40",
                              "SQ", "140,70", "40",
                              "POL", "6", "230,90", "I", "22",
                              "POL", "3", "300,90", "C", "15",
                              "PO", "360,90",
                              "ARW", "S", "8", "380,75", "440,105",
                              "ARW", "D", "380,120", "440,120", "ARW", "D", "", ""})
            w.executeCommandText(l);
        w.executeCommandText("ZOOM E");
        QTest::mouseMove(w.canvas(), QPoint(10, 10));
        QApplication::processEvents();
        w.grab().toImage().save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_draw_tools.png"));
        QVERIFY(w.document().entityCount() >= 14);
    }

    void renderScreenshot() {
        // Renders the full window for visual review (written to the build dir).
        MainWindow w;
        w.setTheme(ThemeKind::Dark);
        w.resize(1400, 860);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        for (const char* l : {"REC", "0,0", "420,297", "L", "40,40", "200,40", "@0,120", "@-160,0", "C", "C", "120,100",
                              "35", "C", "120,100", "D", "30", "REC", "250,60", "@120,80", "C", "310,100", "20"})
            w.executeCommandText(l);
        w.executeCommandText("ZOOM E");
        QTest::mouseClick(w.canvas(), Qt::LeftButton, Qt::NoModifier, screenOf(w, {155, 100}));
        QTest::mouseMove(w.canvas(), screenOf(w, {260, 230}));
        QApplication::processEvents();
        const QImage img = w.grab().toImage();
        QVERIFY(!img.isNull());
        img.save(QDir(QCoreApplication::applicationDirPath()).filePath("screenshot_main_window.png"));
    }
};

QTEST_MAIN(TestGui)
#include "test_gui.moc"
