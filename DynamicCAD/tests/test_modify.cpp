// DYNAMIC CAD - editing command tests (MOVE ... JOIN, TRIM ... STRETCH).
#include "commands/CommandProcessor.h"
#include "commands/CurveEdit.h"
#include "commands/GripAndClipboard.h"
#include "fileio/DynFormat.h"
#include "commands/ModifyCommands.h"
#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"

#include <QtTest>

using namespace dyncad;

namespace {
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
    EntityId add(EntityPtr e) { doc.addWithUndo({e}, "add"); return e->id(); }
    void select(std::initializer_list<EntityId> ids) { for (auto id : ids) sel.add(id); }
    template <class T> const T& get(EntityId id) { return static_cast<const T&>(*doc.findEntity(id)); }
    template <class T> const T& at(std::size_t i) { return static_cast<const T&>(*doc.entities().at(i)); }
};
bool near(const Vec2& a, const Vec2& b, double e = 1e-9) { return nearlyEqual(a, b, e); }
} // namespace

class TestModify : public QObject {
    Q_OBJECT
private slots:
    void moveKeepsIdAndOrderAndUndoes() {
        Fx f;
        auto a = f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0}));
        auto b = f.add(std::make_shared<CircleEntity>(Vec2{5, 5}, 2));
        f.select({a, b});
        f.type({"M", "0,0", "@100,50"});
        QVERIFY(!f.proc.isActive());
        QCOMPARE(f.doc.entities()[0]->id(), a); // same id, same draw order
        QCOMPARE(f.get<LineEntity>(a).start(), Vec2(100, 50));
        QCOMPARE(f.get<CircleEntity>(b).center(), Vec2(105, 55));
        QVERIFY(f.sel.empty());
        f.type({"U"});
        QCOMPARE(f.get<LineEntity>(a).start(), Vec2(0, 0));
        f.type({"REDO"});
        QCOMPARE(f.get<CircleEntity>(b).center(), Vec2(105, 55));
    }

    void moveWithSelectionPrompt() {
        Fx f;
        auto a = f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0}));
        f.type({"MOVE"});
        QVERIFY(f.proc.isSelecting());
        f.sel.add(a); // canvas click
        f.type({"", "5,5", "6,7"});
        QCOMPARE(f.get<LineEntity>(a).end(), Vec2(11, 2));
    }

    void copyMultiple() {
        Fx f;
        auto a = f.add(std::make_shared<CircleEntity>(Vec2{0, 0}, 1));
        f.select({a});
        f.type({"CO", "0,0", "10,0", "20,0", "@0,5", ""});
        QCOMPARE(f.doc.entityCount(), std::size_t(4));
        QCOMPARE(f.at<CircleEntity>(3).center(), Vec2(0, 5)); // @ is a displacement from the base point
        QCOMPARE(f.get<CircleEntity>(a).center(), Vec2(0, 0));
    }

    void rotateScaleMirror() {
        Fx f;
        auto l = f.add(std::make_shared<LineEntity>(Vec2{10, 0}, Vec2{20, 0}));
        f.select({l});
        f.type({"RO", "0,0", "90"});
        QCOMPARE(f.get<LineEntity>(l).start(), Vec2(0, 10)); // exact for 90 deg
        f.select({l});
        f.type({"RO", "0,0", "C", "-90"});                     // rotated copy
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        QCOMPARE(f.at<LineEntity>(1).end(), Vec2(20, 0));
        f.select({l});
        f.type({"SC", "0,0", "2"});
        QCOMPARE(f.get<LineEntity>(l).end(), Vec2(0, 40));
        f.select({l});
        f.type({"SC", "0,0", "R", "20", "10"});                 // reference: 20 -> 10
        QCOMPARE(f.get<LineEntity>(l).end(), Vec2(0, 20));
        f.select({l});
        f.type({"MI", "-5,0", "-5,100", ""});                    // keep source
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
        QCOMPARE(f.at<LineEntity>(2).start(), Vec2(-10, 10));
        auto arc = f.add(std::make_shared<ArcEntity>(Vec2{0, 0}, 5, 0, 90));
        f.select({arc});
        f.type({"MI", "0,0", "1,1", "Y"});                       // erase source; diagonal mirror
        const auto& m = f.get<ArcEntity>(arc);
        QVERIFY(std::abs(m.startDeg() - 0) < 1e-9 && std::abs(m.endDeg() - 90) < 1e-9); // symmetric about 45 deg
        QCOMPARE(f.doc.entityCount(), std::size_t(4));
    }

    void arrays() {
        Fx f;
        auto c = f.add(std::make_shared<CircleEntity>(Vec2{0, 0}, 1));
        f.select({c});
        f.type({"AR", "R", "3", "4", "10", "20"});
        QCOMPARE(f.doc.entityCount(), std::size_t(12));
        QCOMPARE(f.at<CircleEntity>(11).center(), Vec2(60, 20));
        Fx g;
        auto l = g.add(std::make_shared<LineEntity>(Vec2{10, 0}, Vec2{12, 0}));
        g.select({l});
        g.type({"AR", "P", "0,0", "4", "", ""}); // 4 items over 360, rotated
        QCOMPARE(g.doc.entityCount(), std::size_t(4));
        QVERIFY(near(g.at<LineEntity>(1).start(), {0, 10}));
        QVERIFY(near(g.at<LineEntity>(3).end(), {0, -12}));
        Fx h;
        auto l2 = h.add(std::make_shared<LineEntity>(Vec2{10, 0}, Vec2{12, 0}));
        h.select({l2});
        h.type({"AR", "P", "0,0", "3", "90", "N"}); // 3 items over 90 deg, not rotated
        QCOMPARE(h.doc.entityCount(), std::size_t(3));
        const auto& last = h.at<LineEntity>(2);
        QVERIFY(near(last.start(), {-1, 11}) && near(last.end(), {1, 11})); // translated, still horizontal
        h.select({l2});
        h.type({"AR", "R", "1", "1"}); // a 1x1 array is refused
        QVERIFY(h.proc.isActive());
        h.proc.cancel();
    }

    void explodeAndJoin() {
        Fx f;
        auto p = f.add(std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {10, 0}, {10, 10}},
                                                       std::vector<double>{0, 1, 0}, false));
        f.select({p});
        f.type({"X"});
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        QVERIFY(f.doc.entities()[0]->type() == EntityType::Line);
        QVERIFY(f.doc.entities()[1]->type() == EntityType::Arc);
        const auto& arc = f.at<ArcEntity>(1);
        QVERIFY(near(arc.center(), {10, 5}) && std::abs(arc.radius() - 5) < 1e-12);
        f.type({"U"});
        QCOMPARE(f.doc.entityCount(), std::size_t(1)); // one undo step restores the polyline

        // JOIN the exploded pieces back (in shuffled order / directions).
        Fx g;
        auto a = g.add(std::make_shared<LineEntity>(Vec2{10, 10}, Vec2{0, 10}));   // reversed
        auto b = g.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0}));
        auto c = g.add(std::make_shared<LineEntity>(Vec2{10, 0}, Vec2{10, 10}));
        auto d = g.add(std::make_shared<LineEntity>(Vec2{0, 10}, Vec2{0, 0}));
        auto far = g.add(std::make_shared<LineEntity>(Vec2{50, 50}, Vec2{60, 50})); // not connected
        g.select({a, b, c, d, far});
        g.type({"J"});
        QCOMPARE(g.doc.entityCount(), std::size_t(2));
        const auto& sq = static_cast<const PolylineEntity&>(*g.doc.entities()[1]);
        QVERIFY(sq.isClosed());
        QCOMPARE(sq.vertices().size(), std::size_t(4));
        QCOMPARE(sq.area(), 100.0);
        // Collinear lines become one line.
        Fx h;
        auto l1 = h.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{5, 0}));
        auto l2 = h.add(std::make_shared<LineEntity>(Vec2{12, 0}, Vec2{5, 0}));
        h.select({l1, l2});
        h.type({"J"});
        QCOMPARE(h.doc.entityCount(), std::size_t(1));
        QVERIFY(h.doc.entities()[0]->type() == EntityType::Line);
        QVERIFY(std::abs(static_cast<const LineEntity&>(*h.doc.entities()[0]).length() - 12) < 1e-12);
        // Arc + line keep the arc as a bulge.
        Fx k;
        auto ar = k.add(std::make_shared<ArcEntity>(Vec2{0, 0}, 10, 0, 90));
        auto ln = k.add(std::make_shared<LineEntity>(Vec2{0, 10}, Vec2{-20, 10}));
        k.select({ar, ln});
        k.type({"J"});
        const auto& pl = static_cast<const PolylineEntity&>(*k.doc.entities()[0]);
        QVERIFY(pl.hasArcs());
        QVERIFY(std::abs(pl.length() - (5 * kPi + 20)) < 1e-9);
    }

    void trimLinesArcsCirclesPolylines() {
        Fx f;
        f.proc.setPickTolerance(0.5);
        // A cross: trimming the right half of the horizontal line.
        auto h = f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{100, 0}));
        f.add(std::make_shared<LineEntity>(Vec2{50, -50}, Vec2{50, 50}));
        f.type({"TR", "80,0", ""});
        QVERIFY(!f.doc.findEntity(h));
        const auto& left = f.at<LineEntity>(1);
        QCOMPARE(left.start(), Vec2(0, 0));
        QCOMPARE(left.end(), Vec2(50, 0));
        f.type({"U"});
        QVERIFY(f.doc.findEntity(h)); // single undo restores

        // Middle part between two cutters is removed, both ends kept.
        Fx g;
        g.proc.setPickTolerance(0.5);
        auto l = g.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{100, 0}));
        g.add(std::make_shared<LineEntity>(Vec2{30, -5}, Vec2{30, 5}));
        g.add(std::make_shared<CircleEntity>(Vec2{70, 0}, 5)); // crosses at 65 and 75
        g.type({"TR", "50,0", ""});
        QVERIFY(!g.doc.findEntity(l));
        QCOMPARE(g.doc.entityCount(), std::size_t(4));
        QCOMPARE(g.at<LineEntity>(2).end(), Vec2(30, 0));
        QVERIFY(nearlyEqual(g.at<LineEntity>(3).start(), {65, 0}, 1e-12));

        // Trimming a circle between two lines leaves an arc.
        Fx c;
        c.proc.setPickTolerance(0.5);
        auto circ = c.add(std::make_shared<CircleEntity>(Vec2{0, 0}, 10));
        c.add(std::make_shared<LineEntity>(Vec2{-20, 0}, Vec2{20, 0}));
        c.type({"TR", "0,-10", ""}); // remove the bottom half
        QVERIFY(!c.doc.findEntity(circ));
        const auto& arc = static_cast<const ArcEntity&>(*c.doc.entities().back());
        QVERIFY(std::abs(arc.sweepDeg() - 180) < 1e-9);
        QVERIFY(arc.geom().containsAngle(kPi / 2) && !arc.geom().containsAngle(-kPi / 2));

        // Polyline (with an arc segment) trimmed at a cutter keeps width and type.
        Fx p;
        p.proc.setPickTolerance(0.5);
        auto pl = std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {40, 0}, {40, 20}}, std::vector<double>{0, 0.5, 0}, false);
        pl->setWidth(1.0);
        auto plId = p.add(pl);
        p.add(std::make_shared<LineEntity>(Vec2{20, -5}, Vec2{20, 5}));
        p.type({"TR", "5,0", ""});
        QVERIFY(!p.doc.findEntity(plId));
        const auto& rest = static_cast<const PolylineEntity&>(*p.doc.entities().back());
        QCOMPARE(rest.vertices().front(), Vec2(20, 0));
        QVERIFY(rest.hasArcs());
        QCOMPARE(rest.width(), 1.0);
        // An object with no cutting edge is erased (quick-trim behaviour).
        auto lone = p.add(std::make_shared<LineEntity>(Vec2{500, 500}, Vec2{510, 500}));
        p.type({"TR", "505,500", ""});
        QVERIFY(!p.doc.findEntity(lone));
    }

    void extendLineAndArc() {
        Fx f;
        f.proc.setPickTolerance(0.5);
        auto l = f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0}));
        f.add(std::make_shared<LineEntity>(Vec2{30, -10}, Vec2{30, 10}));
        f.add(std::make_shared<LineEntity>(Vec2{50, -10}, Vec2{50, 10}));
        f.type({"EX", "9,0", ""});
        QCOMPARE(f.get<LineEntity>(l).end(), Vec2(30, 0)); // nearest boundary
        QCOMPARE(f.doc.entities()[0]->id(), l);             // modified in place
        f.type({"EX", "29,0", ""});
        QCOMPARE(f.get<LineEntity>(l).end(), Vec2(50, 0));
        f.type({"EX", "1,0", ""});                           // the start end: nothing there
        QCOMPARE(f.get<LineEntity>(l).start(), Vec2(0, 0));

        Fx g;
        g.proc.setPickTolerance(0.5);
        auto a = g.add(std::make_shared<ArcEntity>(Vec2{0, 0}, 10, 0, 45));
        g.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{0, 20})); // boundary at 90 deg
        g.type({"EX", "7.07,7.07", ""});
        QVERIFY(std::abs(g.get<ArcEntity>(a).endDeg() - 90) < 1e-9);
    }

    void breakObjects() {
        Fx f;
        f.proc.setPickTolerance(0.5);
        auto l = f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{100, 0}));
        f.type({"BR", "30,0", "60,0"});
        QVERIFY(!f.doc.findEntity(l));
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        QCOMPARE(f.at<LineEntity>(0).end(), Vec2(30, 0));
        QCOMPARE(f.at<LineEntity>(1).start(), Vec2(60, 0));
        f.type({"BR", "10,0", "@"}); // split at a point, no gap
        QCOMPARE(f.doc.entityCount(), std::size_t(3));

        Fx c;
        c.proc.setPickTolerance(0.5);
        c.add(std::make_shared<CircleEntity>(Vec2{0, 0}, 10));
        c.type({"BR", "10,0", "0,10"}); // removes the quarter from 0 to 90 deg (counter-clockwise)
        const auto& arc = static_cast<const ArcEntity&>(*c.doc.entities()[0]);
        QVERIFY(std::abs(arc.sweepDeg() - 270) < 1e-9);
        QVERIFY(!arc.geom().containsAngle(kPi / 4));
    }

    void offsetVariants() {
        Fx f;
        f.proc.setPickTolerance(0.5);
        f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{100, 0}));
        f.add(std::make_shared<CircleEntity>(Vec2{200, 0}, 10));
        f.type({"O", "5", "50,0", "50,20", "200,10", "200,0", ""});
        QCOMPARE(f.doc.entityCount(), std::size_t(4));
        QCOMPARE(f.at<LineEntity>(2).start(), Vec2(0, 5));
        QCOMPARE(f.at<CircleEntity>(3).radius(), 5.0); // picked inside
        f.type({"O", "T", "50,0", "50,-12", ""});      // through point
        QCOMPARE(f.at<LineEntity>(4).start(), Vec2(0, -12));

        // Closed rectangle offset outward by 2: corners move diagonally.
        Fx g;
        g.proc.setPickTolerance(0.5);
        g.add(std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {10, 0}, {10, 10}, {0, 10}}, true));
        g.type({"O", "2", "5,0", "5,-3", ""});
        const auto& out = g.at<PolylineEntity>(1);
        QVERIFY(out.isClosed());
        QCOMPARE(out.vertices().size(), std::size_t(4));
        QVERIFY(std::abs(out.area() - 196.0) < 1e-9);
        g.type({"O", "2", "5,0", "5,3", ""}); // inward
        QVERIFY(std::abs(g.at<PolylineEntity>(2).area() - 36.0) < 1e-9);

        // Rounded rectangle (bulges) offset outward: arcs grow, lines shift.
        Fx h;
        h.proc.setPickTolerance(0.5);
        const double b = std::tan(kPi / 8);
        h.add(std::make_shared<PolylineEntity>(std::vector<Vec2>{{2, 0}, {8, 0}, {10, 2}, {10, 8}, {8, 10}, {2, 10}, {0, 8}, {0, 2}},
                                               std::vector<double>{0, b, 0, b, 0, b, 0, b}, true));
        h.type({"O", "1", "5,0", "5,-5", ""});
        const auto& r = h.at<PolylineEntity>(1);
        const double expected = 12 * 12 - 4 * (9 - kPi * 9 / 4); // 12x12 with r=3 corners
        QVERIFY2(std::abs(r.area() - expected) < 1e-9, qPrintable(QString::number(r.area())));
        // Too large inward offset fails cleanly.
        h.type({"O", "3", "5,0", "5,5", ""});
        QCOMPARE(h.doc.entityCount(), std::size_t(2));
    }

    void filletAndChamfer() {
        Fx f;
        f.proc.setPickTolerance(0.5);
        // Two lines meeting at (10,0) at a right angle (with overshoot to trim).
        f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{12, 0}));
        f.add(std::make_shared<LineEntity>(Vec2{10, -2}, Vec2{10, 10}));
        f.type({"F", "R", "3", "2,0", "10,8"});
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
        const auto& h = f.at<LineEntity>(0);
        const auto& v = f.at<LineEntity>(1);
        const auto& arc = f.at<ArcEntity>(2);
        QVERIFY(nearlyEqual(h.start(), {7, 0}, 1e-12) && h.end() == Vec2(0, 0));
        QVERIFY(nearlyEqual(v.start(), {10, 3}, 1e-12) && v.end() == Vec2(10, 10));
        QVERIFY(nearlyEqual(arc.center(), {7, 3}, 1e-12));
        QVERIFY(std::abs(arc.radius() - 3) < 1e-12 && std::abs(arc.sweepDeg() - 90) < 1e-9);
        f.type({"U"});
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        // Radius 0: sharp corner (trims the overshoots).
        f.type({"F", "R", "0", "2,0", "10,8"});
        QCOMPARE(f.at<LineEntity>(0).start(), Vec2(10, 0));
        QCOMPARE(f.at<LineEntity>(1).start(), Vec2(10, 0));
        CornerCommand::setRadius(0);

        Fx c;
        c.proc.setPickTolerance(0.5);
        c.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0}));
        c.add(std::make_shared<LineEntity>(Vec2{10, 0}, Vec2{10, 10}));
        c.type({"CHA", "D", "2", "3", "2,0", "10,8"});
        QCOMPARE(c.doc.entityCount(), std::size_t(3));
        QVERIFY(nearlyEqual(c.at<LineEntity>(2).start(), {8, 0}, 1e-12));
        QVERIFY(nearlyEqual(c.at<LineEntity>(2).end(), {10, 3}, 1e-12));
        CornerCommand::setChamferDistances(10, 10);

        // Polyline option: all corners of a square rounded.
        Fx p;
        p.proc.setPickTolerance(0.5);
        auto sq = p.add(std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {20, 0}, {20, 20}, {0, 20}}, true));
        p.type({"F", "R", "4", "P", "10,0"});
        const auto& r = p.get<PolylineEntity>(sq);
        QCOMPARE(r.vertices().size(), std::size_t(8));
        QVERIFY(std::abs(r.area() - (400 - 4 * (16 - kPi * 4))) < 1e-9);
        CornerCommand::setRadius(0);
        // Parallel lines cannot be filleted.
        Fx q;
        q.proc.setPickTolerance(0.5);
        q.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0}));
        q.add(std::make_shared<LineEntity>(Vec2{0, 5}, Vec2{10, 5}));
        q.type({"F", "2,0", "2,5"});
        QCOMPARE(q.doc.entityCount(), std::size_t(2));
        QVERIFY(q.msgs.back().find("parallel") != std::string::npos);
    }

    void stretch() {
        Fx f;
        auto pl = f.add(std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {10, 0}, {10, 10}, {0, 10}}, true));
        auto inside = f.add(std::make_shared<CircleEntity>(Vec2{12, 5}, 1));
        auto outside = f.add(std::make_shared<LineEntity>(Vec2{-50, 0}, Vec2{-40, 0}));
        // Crossing window around the right edge; stretch 5 to the right.
        f.type({"S", "8,-1", "15,11", "0,0", "5,0"});
        const auto& p = f.get<PolylineEntity>(pl);
        QCOMPARE(p.vertices()[0], Vec2(0, 0));
        QCOMPARE(p.vertices()[1], Vec2(15, 0));
        QCOMPARE(p.vertices()[2], Vec2(15, 10));
        QCOMPARE(p.area(), 150.0);
        QCOMPARE(f.get<CircleEntity>(inside).center(), Vec2(17, 5)); // fully inside: moved
        QCOMPARE(f.get<LineEntity>(outside).start(), Vec2(-50, 0));
        f.type({"U"});
        QCOMPARE(f.get<PolylineEntity>(pl).area(), 100.0);
    }

    void gripEditing() {
        LineEntity l({0, 0}, {10, 0});
        auto e = withGripMoved(l, 2, {10, 5});
        QCOMPARE(static_cast<LineEntity&>(*e).end(), Vec2(10, 5));
        e = withGripMoved(l, 1, {5, 3}); // midpoint grip moves the whole line
        QCOMPARE(static_cast<LineEntity&>(*e).start(), Vec2(0, 3));
        CircleEntity c({0, 0}, 5);
        QCOMPARE(static_cast<CircleEntity&>(*withGripMoved(c, 1, {8, 0})).radius(), 8.0);
        ArcEntity a({0, 0}, 10, 0, 180);
        auto a2 = withGripMoved(a, 1, {0, 20}); // drag the middle up: new 3-point arc
        QVERIFY(static_cast<ArcEntity&>(*a2).distanceTo({0, 20}) < 1e-9);
        QVERIFY(static_cast<ArcEntity&>(*a2).distanceTo({10, 0}) < 1e-9);
        PolylineEntity p({{0, 0}, {10, 0}, {10, 10}}, false);
        QCOMPARE(static_cast<PolylineEntity&>(*withGripMoved(p, 2, {20, 10})).vertices()[2], Vec2(20, 10));
        EllipseEntity el(EllipseGeom{{0, 0}, {10, 0}, 0.5});
        auto el2 = withGripMoved(el, 3, {0, 8}); // minor-axis grip
        QVERIFY(std::abs(static_cast<EllipseEntity&>(*el2).geom().minorRadius() - 8) < 1e-12);
        QVERIFY(!withGripMoved(l, 7, {0, 0}));    // no such grip
        QVERIFY(!withGripMoved(l, 0, {10, 0}));   // zero-length line refused

        Fx f;
        auto id = f.add(std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0}));
        f.proc.runCommandInstance(std::make_unique<GripCommand>(id, 0, Vec2{0, 0}));
        f.type({"@0,-5"}); // relative to the grip
        QCOMPARE(f.get<LineEntity>(id).start(), Vec2(0, -5));
        f.type({"U"});
        QCOMPARE(f.get<LineEntity>(id).start(), Vec2(0, 0));
    }

    void clipboardRoundTrip() {
        std::vector<EntityPtr> src{std::make_shared<LineEntity>(Vec2{10, 10}, Vec2{20, 10}),
                                   std::make_shared<CircleEntity>(Vec2{15, 20}, 5)};
        const QByteArray data = serializeEntities(src);
        auto back = deserializeEntities(data);
        QCOMPARE(back.size(), std::size_t(2));
        QVERIFY(deserializeEntities("not json").empty());
        QVERIFY(deserializeEntities(R"({"format":"DynamicCAD-Drawing","entities":[]})").empty());
        Fx f;
        f.proc.runCommandInstance(std::make_unique<PasteCommand>(back));
        f.type({"100,100"}); // lower-left of the pasted objects lands here
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        QCOMPARE(f.at<LineEntity>(0).start(), Vec2(100, 100));
        QCOMPARE(f.at<CircleEntity>(1).center(), Vec2(105, 110));
    }
};

QTEST_GUILESS_MAIN(TestModify)
#include "test_modify.moc"
