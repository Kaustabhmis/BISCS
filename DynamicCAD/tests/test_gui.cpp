// DYNAMIC CAD - GUI integration tests (headless, offscreen platform).
// Drives the real MainWindow with simulated mouse and keyboard input.
#include "canvas/CadCanvas.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/PolylineEntity.h"
#include "entities/LineEntity.h"
#include "ui/CommandLine.h"
#include "snapping/SnapEngine.h"
#include "ui/MainWindow.h"

#include <QLineEdit>
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
        QCOMPARE(w.document().entityCount(), std::size_t(13));
        QVERIFY(w.currentFile().isEmpty()); // never overwrite the DXF on Save
        QVERIFY(w.windowTitle().contains("mixed_R2010.dxf (imported)"));
        QVERIFY(w.commandLine()->history().contains("Not imported yet"));
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
        QCOMPARE(w.document().entityCount(), std::size_t(13));
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
