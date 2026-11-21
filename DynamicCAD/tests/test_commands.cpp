// DYNAMIC CAD - command-line parsing and interactive command tests.
#include "commands/CommandProcessor.h"
#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "commands/DrawCommands.h"
#include "commands/ShapeCommands.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"

#include <QtTest>

using namespace dyncad;

namespace {
struct Fixture {
    Document doc;
    SelectionSet sel;
    CommandProcessor proc{doc, sel};
    std::vector<std::string> messages;
    Fixture() {
        registerCoreCommands(proc, doc);
        proc.onMessage = [this](const std::string& m) { messages.push_back(m); };
    }
    void type(std::initializer_list<const char*> lines) {
        for (const char* l : lines) proc.submit(l);
    }
    template <class T> const T& at(std::size_t i) { return static_cast<const T&>(*doc.entities().at(i)); }
};
} // namespace

class TestCommands : public QObject {
    Q_OBJECT
private slots:
    void parser() {
        const std::optional<Vec2> last = Vec2{10, 20};
        auto p = parseInput("3.5,-4", last);
        QCOMPARE(int(p.kind), int(ParsedInput::Kind::Point));
        QCOMPARE(p.point, Vec2(3.5, -4));
        p = parseInput(" @5,5 ", last);
        QCOMPARE(p.point, Vec2(15, 25));
        p = parseInput("@10<90", last);
        QVERIFY(nearlyEqual(p.point, {10, 30}, 1e-12));
        p = parseInput("10<180", last);
        QVERIFY(nearlyEqual(p.point, {-10, 0}, 1e-12));
        p = parseInput("#1,2", last);
        QCOMPARE(p.point, Vec2(1, 2));
        p = parseInput("@", last);
        QCOMPARE(p.point, Vec2(10, 20));
        p = parseInput("1e3", last);
        QCOMPARE(int(p.kind), int(ParsedInput::Kind::Number));
        QCOMPARE(p.number, 1000.0);
        p = parseInput("+2.5", last);
        QCOMPARE(p.number, 2.5);
        p = parseInput("close", last);
        QCOMPARE(int(p.kind), int(ParsedInput::Kind::Keyword));
        QCOMPARE(QString::fromStdString(p.keyword), QString("CLOSE"));
        QCOMPARE(int(parseInput("", last).kind), int(ParsedInput::Kind::Empty));
        for (const char* bad : {"1,", ",2", "1,2,3", "a,b", "@x", "1.2.3", "5<", "1,2;", "nan,1", "inf"})
            QVERIFY2(parseInput(bad, last).kind == ParsedInput::Kind::Invalid ||
                         parseInput(bad, last).kind == ParsedInput::Kind::Keyword,
                     bad);
        QVERIFY(parseInput("1,2,3", last).kind == ParsedInput::Kind::Invalid);
        QVERIFY(parseInput("1,2;", last).kind == ParsedInput::Kind::Invalid);
        // Locale independence: comma is never a decimal separator.
        QVERIFY(!parseNumber("1,5"));
    }

    void lineChainWithUndoAndClose() {
        Fixture f;
        f.type({"L", "0,0", "100,0", "@0,50", "@-30,0", "U", "@-100,0", "c"});
        QVERIFY(!f.proc.isActive());
        QCOMPARE(f.doc.entityCount(), std::size_t(4));
        QCOMPARE(f.at<LineEntity>(1).end(), Vec2(100, 50));
        QCOMPARE(f.at<LineEntity>(2).end(), Vec2(0, 50));
        QCOMPARE(f.at<LineEntity>(3).start(), Vec2(0, 50));
        QCOMPARE(f.at<LineEntity>(3).end(), Vec2(0, 0));
        // Each segment is its own undo step.
        f.type({"U"});
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
    }

    void lineEnterFinishesAndRepeat() {
        Fixture f;
        f.type({"line", "1,1", "2,2", ""});
        QVERIFY(!f.proc.isActive());
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
        f.type({""}); // Enter repeats LINE
        QVERIFY(f.proc.isActive());
        QCOMPARE(QString::fromStdString(f.proc.activeName()), QString("LINE"));
        f.proc.cancel();
    }

    void lineRejectsZeroLengthAndCloseTooEarly() {
        Fixture f;
        f.type({"L", "5,5", "5,5", "C", "6,5", "C"});
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
        QVERIFY(f.proc.isActive());
    }

    void directDistanceAndOrtho() {
        Fixture f;
        f.proc.setOrtho(true);
        f.type({"L", "10,10"});
        f.proc.setCursor({50, 13}); // nearly horizontal -> ortho snaps to 0 deg
        f.type({"25"});
        QCOMPARE(f.at<LineEntity>(0).end(), Vec2(35, 10));
        // Mouse picks are ortho-constrained relative to the last point.
        f.proc.pointInput({36, 80});
        QCOMPARE(f.at<LineEntity>(1).end(), Vec2(35, 80));
        // Typed coordinates are exact, never constrained.
        f.type({"0,0"});
        QCOMPARE(f.at<LineEntity>(2).end(), Vec2(0, 0));
    }

    void circleVariants() {
        Fixture f;
        f.type({"C", "10,10", "5"});
        f.type({"CIRCLE", "0,0", "D", "30"});
        f.type({"C", "2P", "0,0", "10,0"});
        f.type({"C", "3P", "10,0", "0,10", "-10,0"});
        f.type({"C", "1,1", "4,5"}); // radius by point = 5
        QCOMPARE(f.doc.entityCount(), std::size_t(5));
        QCOMPARE(f.at<CircleEntity>(0).radius(), 5.0);
        QCOMPARE(f.at<CircleEntity>(1).radius(), 15.0);
        QCOMPARE(f.at<CircleEntity>(2).center(), Vec2(5, 0));
        QCOMPARE(f.at<CircleEntity>(2).radius(), 5.0);
        QVERIFY(nearlyEqual(f.at<CircleEntity>(3).center(), {0, 0}, 1e-12));
        QCOMPARE(f.at<CircleEntity>(3).radius(), 10.0);
        QCOMPARE(f.at<CircleEntity>(4).radius(), 5.0);
    }

    void circleRejectsBadInput() {
        Fixture f;
        f.type({"C", "0,0", "0", "-3"});
        QVERIFY(f.proc.isActive());
        QCOMPARE(f.doc.entityCount(), std::size_t(0));
        f.proc.cancel();
        f.type({"C", "3P", "0,0", "1,1", "2,2"}); // collinear rejected
        QVERIFY(f.proc.isActive());
        QCOMPARE(f.doc.entityCount(), std::size_t(0));
    }

    void rectangle() {
        Fixture f;
        f.type({"REC", "10,20", "@100,50"});
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
        const auto& p = f.at<PolylineEntity>(0);
        QVERIFY(p.isClosed());
        QCOMPARE(p.vertices().size(), std::size_t(4));
        QCOMPARE(p.area(), 5000.0);
        QCOMPARE(p.length(), 300.0);
        QCOMPARE(p.bounds().max, Vec2(110, 70));
        f.type({"RECTANGLE", "0,0", "0,10"}); // zero width rejected
        QVERIFY(f.proc.isActive());
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
    }


    void plineWithArcs() {
        Fixture f;
        // Straight 10 east, then a tangent semicircle up to (10,10), straight back west, close.
        f.type({"PL", "0,0", "10,0", "A", "10,10", "L", "0,10", "C"});
        QVERIFY(!f.proc.isActive());
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
        const auto& p = f.at<PolylineEntity>(0);
        QVERIFY(p.isClosed());
        QCOMPARE(p.vertices().size(), std::size_t(4));
        QVERIFY(std::abs(p.bulges()[1] - 1.0) < 1e-12); // tangent semicircle
        QVERIFY(std::abs(p.area() - (100 + kPi * 25 / 2)) < 1e-9);
        QVERIFY(std::abs(p.bounds().max.x - 15) < 1e-12);
        // Undo inside PLINE, Enter finishes open; Esc keeps what was drawn.
        f.type({"PL", "0,0", "5,0", "5,5", "U", "8,0", ""});
        QCOMPARE(f.at<PolylineEntity>(1).vertices().back(), Vec2(8, 0));
        QVERIFY(!f.at<PolylineEntity>(1).isClosed());
        f.type({"PL", "0,0", "1,1", "2,0"});
        f.proc.cancel();
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
        f.type({"U"}); // one undo step removes the whole polyline
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
    }

    void arcVariants() {
        Fixture f;
        f.type({"A", "10,0", "0,10", "-10,0"});            // 3 points, counter-clockwise
        f.type({"ARC", "-10,0", "0,10", "10,0"});          // same arc picked clockwise
        f.type({"A", "C", "0,0", "5,0", "0,5"});            // centre, start, end
        f.type({"A", "C", "0,0", "5,0", "-90"});            // included angle, clockwise
        QCOMPARE(f.doc.entityCount(), std::size_t(4));
        for (int i : {0, 1}) {
            const auto& a = f.at<ArcEntity>(std::size_t(i));
            QVERIFY(nearlyEqual(a.center(), {0, 0}, 1e-12));
            QVERIFY(std::abs(a.radius() - 10) < 1e-12);
            QVERIFY(std::abs(a.startDeg() - 0) < 1e-9 && std::abs(a.endDeg() - 180) < 1e-9);
        }
        QCOMPARE(f.at<ArcEntity>(2).startDeg(), 0.0);
        QCOMPARE(f.at<ArcEntity>(2).endDeg(), 90.0);
        QCOMPARE(f.at<ArcEntity>(3).startDeg(), -90.0);
        QCOMPARE(f.at<ArcEntity>(3).endDeg(), 0.0);
        f.type({"A", "0,0", "1,1", "2,2"}); // collinear rejected, still active
        QVERIFY(f.proc.isActive());
    }

    void polygonVariants() {
        Fixture f;
        f.type({"POL", "6", "0,0", "I", "10"});      // hexagon inscribed r=10
        f.type({"POLYGON", "4", "0,0", "C", "5"});   // square circumscribed apothem 5
        f.type({"POL", "", "E", "0,0", "10,0"});     // Enter keeps 4 sides; by edge
        f.type({"POL", "3", "0,0", "", "10,0"});      // Enter = Inscribed; vertex at (10,0)
        QCOMPARE(f.doc.entityCount(), std::size_t(4));
        const auto& hex = f.at<PolylineEntity>(0);
        QCOMPARE(hex.vertices().size(), std::size_t(6));
        QVERIFY(std::abs(hex.area() - 3 * std::sqrt(3.0) / 2 * 100) < 1e-9);
        QVERIFY(std::abs(hex.bounds().min.y - (-std::sqrt(75.0))) < 1e-9); // bottom edge horizontal
        QVERIFY(std::abs(f.at<PolylineEntity>(1).area() - 100) < 1e-9);
        const auto& edge = f.at<PolylineEntity>(2);
        QVERIFY(std::abs(edge.area() - 100) < 1e-9);
        QVERIFY(nearlyEqual(edge.bounds().max, {10, 10}, 1e-9));
        QVERIFY(nearlyEqual(f.at<PolylineEntity>(3).vertices()[0], {10, 0}, 1e-12));
        f.type({"POL", "2"}); // invalid side count
        QVERIFY(f.proc.isActive());
    }

    void ellipseVariants() {
        Fixture f;
        f.type({"EL", "-10,0", "10,0", "4"});         // axis ends + half other axis
        f.type({"ELLIPSE", "C", "0,0", "0,3", "8"});   // centre; the longer axis becomes major
        f.type({"EL", "0,0", "10,0", "5,2"});          // other axis by point (distance 2)
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
        const EllipseGeom& a = static_cast<const EllipseEntity&>(*f.doc.entities()[0]).geom();
        QVERIFY(std::abs(a.majorRadius() - 10) < 1e-12 && std::abs(a.minorRadius() - 4) < 1e-12);
        const EllipseGeom& b = static_cast<const EllipseEntity&>(*f.doc.entities()[1]).geom();
        QVERIFY(std::abs(b.majorRadius() - 8) < 1e-12 && std::abs(b.minorRadius() - 3) < 1e-12);
        QVERIFY(std::abs(std::abs(b.major.x) - 8) < 1e-12); // major axis is horizontal
        const EllipseGeom& c = static_cast<const EllipseEntity&>(*f.doc.entities()[2]).geom();
        QCOMPARE(c.center, Vec2(5, 0));
        QVERIFY(std::abs(c.minorRadius() - 2) < 1e-12);
    }

    void splineVariants() {
        Fixture f;
        f.type({"SPL", "0,0", "10,10", "20,0", "30,10", ""});
        f.type({"SPLINE", "M", "0,0", "10,10", "20,0", "30,10", ""});  // control vertices
        f.type({"SPL", "0,0", "10,0", "10,10", "0,10", "C"});           // closed fit curve
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
        const auto& fit = f.at<SplineEntity>(0);
        for (Vec2 p : {Vec2{0, 0}, Vec2{10, 10}, Vec2{20, 0}, Vec2{30, 10}}) QVERIFY(fit.distanceTo(p) < 1e-6);
        const auto& cv = f.at<SplineEntity>(1);
        QCOMPARE(cv.curve().ctrl.size(), std::size_t(4));
        QVERIFY(cv.distanceTo({10, 10}) > 1.0); // CV curve does not pass through inner vertices
        QVERIFY(f.at<SplineEntity>(2).isClosed());
        f.type({"SPL", "1,1", ""}); // a single point cannot make a spline
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
    }

    void pointSquareArrow() {
        Fixture f;
        f.type({"PO", "3,4"});
        f.type({"SQ", "0,0", "7,3"});            // side = larger of dx, dy
        f.proc.setCursor({-1, -1});
        f.type({"SQUARE", "10,10", "5"});        // typed side, direction from cursor
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
        QCOMPARE(static_cast<const PointEntity&>(*f.doc.entities()[0]).position(), Vec2(3, 4));
        QCOMPARE(f.at<PolylineEntity>(1).area(), 49.0);
        QVERIFY(nearlyEqual(f.at<PolylineEntity>(2).bounds().min, {5, 5}, 0));

        ArrowCommand::setHeadSize(5);
        f.type({"ARW", "0,0", "20,0"});
        QCOMPARE(f.doc.entityCount(), std::size_t(5)); // shaft + filled head, one undo step
        QCOMPARE(f.at<LineEntity>(3).end(), Vec2(15, 0));
        const auto& head = f.at<PolylineEntity>(4);
        QVERIFY(head.isFilled());
        QCOMPARE(head.vertices()[0], Vec2(20, 0));
        f.type({"ARW", "S", "2", "D", "0,0", "0,10"}); // size 2, double-headed
        QCOMPARE(f.doc.entityCount(), std::size_t(8));
        QCOMPARE(ArrowCommand::headSize(), 2.0);
        f.type({"ARW", "D", "0,0", "1,0"}); // back to single; too short for its head
        QVERIFY(f.proc.isActive());
        f.proc.cancel();
        f.type({"U"});
        QCOMPARE(f.doc.entityCount(), std::size_t(5));
    }

    void rectangleOptions() {
        Fixture f;
        RectangleCommand::resetCornerOptions();
        f.type({"REC", "F", "5", "0,0", "40,20"});           // rounded corners r=5
        const auto& r = f.at<PolylineEntity>(0);
        QCOMPARE(r.vertices().size(), std::size_t(8));
        QVERIFY(std::abs(r.area() - (800 - 4 * (25 - kPi * 25 / 4))) < 1e-9);
        QVERIFY(nearlyEqual(r.bounds().max, {40, 20}, 1e-12));
        f.type({"REC", "C", "3", "0,0", "10,10"});          // chamfer 3
        QVERIFY(std::abs(f.at<PolylineEntity>(1).area() - (100 - 4 * 4.5)) < 1e-9);
        f.type({"REC", "F", "0", "0,0", "D", "30", "12", "-1,-1"}); // dimensions, placed down-left
        const auto& d = f.at<PolylineEntity>(2);
        QCOMPARE(d.vertices().size(), std::size_t(4));
        QVERIFY(nearlyEqual(d.bounds().min, {-30, -12}, 0));
        f.type({"REC", "F", "50", "0,0", "10,10"}); // fillet too large: sharp corners
        QCOMPARE(f.at<PolylineEntity>(3).vertices().size(), std::size_t(4));
        RectangleCommand::resetCornerOptions();
    }

    void eraseWithPreselectionAndUndo() {
        Fixture f;
        f.type({"L", "0,0", "10,0", "", "C", "0,0", "3"});
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        f.sel.add(f.doc.entities()[0]->id());
        f.type({"E"});
        QVERIFY(!f.proc.isActive());
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
        QVERIFY(f.sel.empty());
        f.type({"U"});
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        f.type({"REDO"});
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
    }

    void eraseSelectThenEnter() {
        Fixture f;
        f.type({"C", "0,0", "3"});
        f.type({"ERASE"});
        QVERIFY(f.proc.isSelecting());
        f.sel.add(f.doc.entities()[0]->id()); // canvas would do this on click
        f.type({""});
        QCOMPARE(f.doc.entityCount(), std::size_t(0));
        f.type({"ERASE", ""}); // nothing selected -> cancelled, no undo step
        QVERIFY(!f.proc.isActive());
    }

    void transparentActions() {
        Fixture f;
        int zooms = 0;
        std::vector<std::string> lastArgs;
        f.proc.registerAction("ZOOM", {"Z"}, [&](const std::vector<std::string>& a) { ++zooms; lastArgs = a; }, true);
        f.type({"L", "0,0", "ZOOM E", "'Z 2", "10,0", ""});
        QCOMPARE(zooms, 2);
        QCOMPARE(QString::fromStdString(lastArgs.at(0)), QString("2"));
        QCOMPARE(f.doc.entityCount(), std::size_t(1)); // LINE kept going through both zooms
        // Short aliases are not captured without the apostrophe (they may be options).
        f.type({"L", "0,0", "Z"});
        QVERIFY(f.proc.isActive());
        QCOMPARE(zooms, 2);
        f.proc.cancel();
        // Non-transparent actions (UNDO) are never run mid-command; "U" stays LINE's Undo option.
        f.type({"L", "0,0", "5,0", "U"});
        QVERIFY(f.proc.isActive());
        f.proc.cancel();
    }

    void unknownAndInvalidInput() {
        Fixture f;
        QVERIFY(!f.proc.submit("FOO"));
        QVERIFY(f.messages.back().find("Unknown command") != std::string::npos);
        f.type({"L"});
        QVERIFY(!f.proc.submit("1,2,3"));
        QVERIFY(f.proc.isActive());
        f.proc.cancel();
        QVERIFY(!f.proc.isActive());
    }

    void previewFollowsCursor() {
        Fixture f;
        f.type({"C", "0,0"});
        f.proc.setCursor({3, 4});
        auto prev = f.proc.previewEntities();
        QVERIFY(!prev.empty());
        QCOMPARE(static_cast<CircleEntity&>(*prev[0]).radius(), 5.0);
        QCOMPARE(f.doc.entityCount(), std::size_t(0)); // previews never touch the document
    }
};

QTEST_GUILESS_MAIN(TestCommands)
#include "test_commands.moc"
