// DYNAMIC CAD - object snap, intersection and polar tracking tests.
#include "commands/CommandProcessor.h"
#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Intersections.h"
#include "snapping/SnapEngine.h"

#include <QtTest>

using namespace dyncad;

namespace {
bool near(const Vec2& a, const Vec2& b, double eps = 1e-9) { return nearlyEqual(a, b, eps); }
}

class TestSnapping : public QObject {
    Q_OBJECT
    Document doc;
    SnapEngine eng;
private slots:
    void initTestCase() {
        doc.addWithUndo({std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{100, 0}),        // horizontal
                         std::make_shared<LineEntity>(Vec2{50, -50}, Vec2{50, 50}),     // vertical, crosses at (50,0)
                         std::make_shared<CircleEntity>(Vec2{200, 0}, 20),
                         std::make_shared<ArcEntity>(Vec2{300, 0}, 10, 0, 180),
                         std::make_shared<PolylineEntity>(std::vector<Vec2>{{400, 0}, {440, 0}, {440, 30}}, false),
                         std::make_shared<PointEntity>(Vec2{500, 500})},
                        "setup");
    }

    void intersectionsMath() {
        auto p = geom::intersect(Primitive::segment({0, 0}, {10, 10}), Primitive::segment({0, 10}, {10, 0}));
        QCOMPARE(p.size(), std::size_t(1));
        QVERIFY(near(p[0], {5, 5}));
        QVERIFY(geom::intersect(Primitive::segment({0, 0}, {1, 0}), Primitive::segment({0, 1}, {1, 1})).empty()); // parallel
        QVERIFY(geom::intersect(Primitive::segment({0, 0}, {4, 0}), Primitive::segment({5, -1}, {5, 1})).empty()); // beyond end
        auto lc = geom::intersect(Primitive::segment({-20, 0}, {20, 0}), Primitive::fromArc({{0, 0}, 10, 0, 2 * kPi}));
        QCOMPARE(lc.size(), std::size_t(2));
        auto la = geom::intersect(Primitive::segment({-20, 0.5}, {20, 0.5}), Primitive::fromArc(geom::arcFromDegrees({0, 0}, 10, 0, 90)));
        QCOMPARE(la.size(), std::size_t(1)); // only the part on the arc
        QVERIFY(la[0].x > 0);
        auto cc = geom::intersectCircles({0, 0}, 5, {8, 0}, 5);
        QCOMPARE(cc.size(), std::size_t(2));
        QVERIFY(near(cc[0], {4, 3}) || near(cc[0], {4, -3}));
        QCOMPARE(geom::intersectCircles({0, 0}, 5, {10, 0}, 5).size(), std::size_t(1)); // tangent
        auto t = geom::tangentPoints({10, 0}, {0, 0}, 5);
        QCOMPARE(t.size(), std::size_t(2));
        for (const Vec2& q : t) QVERIFY(std::abs((q - Vec2{0, 0}).dot(q - Vec2{10, 0})) < 1e-9); // radius ⟂ tangent
        QVERIFY(geom::tangentPoints({1, 0}, {0, 0}, 5).empty());
    }

    void endpointMidpointNode() {
        auto s = eng.find(doc, {99, 1}, 3, kDefaultSnapModes);
        QVERIFY(s && s->mode == SnapEndpoint && s->point == Vec2(100, 0));
        s = eng.find(doc, {441, 15.5}, 3, kDefaultSnapModes); // middle of the polyline's vertical segment
        QVERIFY(s && s->mode == SnapMidpoint && s->point == Vec2(440, 15));
        s = eng.find(doc, {420, 1}, 3, kDefaultSnapModes); // polyline segment midpoint
        QVERIFY(s && s->mode == SnapMidpoint && s->point == Vec2(420, 0));
        s = eng.find(doc, {501, 499}, 3, kDefaultSnapModes);
        QVERIFY(s && s->mode == SnapNode && s->point == Vec2(500, 500));
        QVERIFY(!eng.find(doc, {700, 700}, 3, kDefaultSnapModes));
    }

    void intersectionBeatsNearby() {
        auto s = eng.find(doc, {51, 1}, 3, kDefaultSnapModes);
        QVERIFY(s && s->mode == SnapIntersection);
        QVERIFY(near(s->point, {50, 0}));
    }

    void centerAndQuadrant() {
        // Hovering over the circle's curve offers its centre.
        auto s = eng.find(doc, {200 + 20 * std::cos(1.0), 20 * std::sin(1.0)}, 3, SnapCenter);
        QVERIFY(s && s->mode == SnapCenter && s->point == Vec2(200, 0));
        s = eng.find(doc, {220.5, 0.5}, 3, kDefaultSnapModes);
        QVERIFY(s && s->mode == SnapQuadrant && near(s->point, {220, 0}));
        // Arc 0..180: quadrant at 270 deg does not exist on it.
        QVERIFY(!eng.find(doc, {300, -10}, 2, SnapQuadrant));
        s = eng.find(doc, {300.5, 10.5}, 2, SnapQuadrant);
        QVERIFY(s && near(s->point, {300, 10}));
    }

    void perpendicularTangentNearest() {
        const Vec2 base{30, 40};
        auto s = eng.find(doc, {31, 1}, 3, SnapPerpendicular, base);
        QVERIFY(s && s->mode == SnapPerpendicular && near(s->point, {30, 0}));
        QVERIFY(!eng.find(doc, {31, 1}, 3, SnapPerpendicular)); // needs a base point
        // Tangent from (200,40) to circle (200,0) r 20: points at +-30 deg from top.
        const Vec2 tb{200, 40};
        auto tps = geom::tangentPoints(tb, {200, 0}, 20);
        auto tt = eng.find(doc, tps[0] + Vec2{0.5, 0.5}, 3, SnapTangent, tb);
        QVERIFY(tt && tt->mode == SnapTangent && near(tt->point, tps[0]));
        auto n = eng.find(doc, {70, 1.5}, 3, SnapNearest);
        QVERIFY(n && n->mode == SnapNearest && near(n->point, {70, 0}));
        // Precise snaps win over nearest even if slightly further.
        auto w = eng.find(doc, {98, 0}, 3, SnapNearest | SnapEndpoint);
        QVERIFY(w && w->mode == SnapEndpoint);
    }

    void ellipseAndSplineIntersections() {
        Document d;
        d.addWithUndo({std::make_shared<EllipseEntity>(EllipseGeom{{0, 0}, {20, 0}, 0.5}),
                       std::make_shared<LineEntity>(Vec2{0, -20}, Vec2{0, 20})},
                      "x");
        auto s = eng.find(d, {0.5, 9.5}, 2, SnapIntersection);
        QVERIFY(s && s->mode == SnapIntersection);
        QVERIFY(near(s->point, {0, 10}, 1e-5)); // ellipse is approximated to 1e-7 of its size
    }

    void polarTracking() {
        auto p = polarTrack({0, 0}, {100, 3}, 45, 5);
        QVERIFY(p && p->angleDeg == 0.0 && p->point == Vec2(100, 0));
        p = polarTrack({0, 0}, {70, 71}, 45, 5);
        QVERIFY(p && p->angleDeg == 45.0 && std::abs(p->point.x - p->point.y) < 1e-9);
        p = polarTrack({10, 10}, {9, 80}, 45, 5);
        QVERIFY(p && p->angleDeg == 90.0 && p->point.x == 10.0); // exact vertical
        QVERIFY(!polarTrack({0, 0}, {100, 30}, 45, 5));          // too far from any polar ray
        p = polarTrack({0, 0}, {-50, -0.5}, 15, 1);
        QVERIFY(p && p->angleDeg == 180.0 && p->point.y == 0.0);
    }

    void snapOverrideKeywords() {
        Document d;
        SelectionSet sel;
        CommandProcessor proc(d, sel);
        registerCoreCommands(proc, d);
        proc.submit("L");
        QVERIFY(!proc.snapOverride());
        QVERIFY(proc.submit("mid"));
        QVERIFY(proc.snapOverride() && *proc.snapOverride() == SnapMidpoint);
        QVERIFY(proc.isActive());
        proc.submit("0,0"); // the override is used for one point only
        QVERIFY(!proc.snapOverride());
        proc.submit("end");
        proc.cancel();
        QVERIFY(!proc.snapOverride());
        QVERIFY(snapModeFromKeyword("TAN") == SnapTangent);
        QVERIFY(!snapModeFromKeyword("CENTER"));
    }

    void directDistanceFollowsPolarTrackedCursor() {
        Document d;
        SelectionSet sel;
        CommandProcessor proc(d, sel);
        registerCoreCommands(proc, d);
        proc.submit("L");
        proc.submit("0,0");
        proc.setCursor({70, 72});
        proc.setTrackedCursor(polarTrack({0, 0}, {70, 72}, 45, 5)->point);
        proc.submit("10");
        const auto& l = static_cast<const LineEntity&>(*d.entities()[0]);
        QVERIFY(near(l.end(), Vec2::fromPolar(10, kPi / 4), 1e-12));
    }
};

QTEST_GUILESS_MAIN(TestSnapping)
#include "test_snapping.moc"
