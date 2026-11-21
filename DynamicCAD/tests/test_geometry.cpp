// DYNAMIC CAD - geometry engine tests.
#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Arc.h"
#include "geometry/Geometry.h"

#include <QtTest>

using namespace dyncad;

class TestGeometry : public QObject {
    Q_OBJECT
private slots:
    void pointSegmentDistance() {
        QCOMPARE(geom::distancePointToSegment({5, 3}, {0, 0}, {10, 0}), 3.0);
        QCOMPARE(geom::distancePointToSegment({-4, 3}, {0, 0}, {10, 0}), 5.0); // beyond end -> endpoint
        QCOMPARE(geom::distancePointToSegment({1, 1}, {2, 2}, {2, 2}), std::sqrt(2.0)); // degenerate
    }
    void clipSegment() {
        const BoundingBox r({0, 0}, {10, 10});
        auto c = geom::clipSegment({-5, 5}, {15, 5}, r);
        QVERIFY(c);
        QCOMPARE(c->first.x, 0.0);
        QCOMPARE(c->second.x, 10.0);
        QVERIFY(!geom::clipSegment({-5, -5}, {-1, 20}, r));
        // Inside segment is returned unchanged (exact).
        auto in = geom::clipSegment({1.1, 2.2}, {3.3, 4.4}, r);
        QVERIFY(in && in->first == Vec2(1.1, 2.2) && in->second == Vec2(3.3, 4.4));
        QVERIFY(geom::segmentIntersectsRect({-1, -1}, {11, 11}, r)); // diagonal through
        QVERIFY(!geom::segmentIntersectsRect({11, 0}, {20, 10}, r));
    }
    void circleRect() {
        const BoundingBox r({0, 0}, {10, 10});
        QVERIFY(geom::circleIntersectsRect({5, 5}, 3, r));      // circle inside rect
        QVERIFY(!geom::circleIntersectsRect({5, 5}, 100, r));   // rect inside circle: curve misses
        QVERIFY(geom::circleIntersectsRect({15, 5}, 5, r));     // tangent to edge
        QVERIFY(!geom::circleIntersectsRect({20, 20}, 5, r));
        QVERIFY(geom::circleIntersectsRect({5, 5}, std::hypot(5, 5), r)); // through corners
    }
    void circleFrom3Points() {
        auto c = geom::circleFrom3Points({10, 0}, {0, 10}, {-10, 0});
        QVERIFY(c);
        QVERIFY(nearlyEqual(c->first, {0, 0}, 1e-12));
        QCOMPARE(c->second, 10.0);
        QVERIFY(!geom::circleFrom3Points({0, 0}, {1, 1}, {2, 2}));
        // Off-origin precision: large coordinates.
        auto big = geom::circleFrom3Points({1e6 + 5, 2e6}, {1e6, 2e6 + 5}, {1e6 - 5, 2e6});
        QVERIFY(big);
        QVERIFY(nearlyEqual(big->first, {1e6, 2e6}, 1e-6));
        QVERIFY(std::abs(big->second - 5.0) < 1e-6);
    }
    void areaAndLength() {
        const std::vector<Vec2> sq{{0, 0}, {4, 0}, {4, 3}, {0, 3}};
        QCOMPARE(geom::polygonSignedArea(sq), 12.0);
        std::vector<Vec2> cw(sq.rbegin(), sq.rend());
        QCOMPARE(geom::polygonSignedArea(cw), -12.0);
        QCOMPARE(geom::polylineLength(sq, true), 14.0);
        QCOMPARE(geom::polylineLength(sq, false), 11.0);
        // Far from origin: shoelace translated to first vertex stays exact.
        std::vector<Vec2> far;
        for (auto v : sq) far.push_back(v + Vec2{1e8, 1e8});
        QCOMPARE(geom::polygonSignedArea(far), 12.0);
    }
    void orthoAndSnap() {
        QCOMPARE(geom::orthoConstrain({0, 0}, {10, 3}), Vec2(10, 0));
        QCOMPARE(geom::orthoConstrain({0, 0}, {2, -7}), Vec2(0, -7));
        QCOMPARE(geom::snapToGrid({12.4, -7.6}, 5), Vec2(10, -10));
        QCOMPARE(geom::snapToGrid({1.26, 0.74}, 0.5), Vec2(1.5, 0.5));
    }
    void gridStep() {
        QCOMPARE(geom::gridStepForScale(1.0, 12.0), 20.0);   // 12 units raw -> 20
        QCOMPARE(geom::gridStepForScale(12.0, 12.0), 1.0);
        QCOMPARE(geom::gridStepForScale(3.0, 12.0), 5.0);
        QCOMPARE(geom::gridStepForScale(1000.0, 12.0), 0.02);
        for (double s : {1e-5, 0.37, 1.0, 7.7, 1234.5, 1e7}) {
            const double step = geom::gridStepForScale(s, 12.0);
            QVERIFY(step * s >= 12.0 * (1 - 1e-9));
            QVERIFY(step * s < 12.0 * 2.5 + 1e-9); // never more than one 1-2-5 jump too coarse
        }
    }
    void angles() {
        QCOMPARE(geom::angleDeg({0, 0}, {1, 0}), 0.0);
        QCOMPARE(geom::angleDeg({0, 0}, {0, 1}), 90.0);
        QCOMPARE(geom::angleDeg({0, 0}, {0, -1}), 270.0);
    }

    void arcBasics() {
        const ArcGeom a = geom::arcFromDegrees({0, 0}, 10, 0, 90);
        QVERIFY(std::abs(a.sweep - kPi / 2) < 1e-15);
        QVERIFY(nearlyEqual(a.endPoint(), {0, 10}, 1e-12));
        QVERIFY(std::abs(a.length() - 5 * kPi) < 1e-12);
        QVERIFY(a.containsAngle(degToRad(45)));
        QVERIFY(!a.containsAngle(degToRad(180)));
        // Wrap-around arc 350..10 degrees
        const ArcGeom w = geom::arcFromDegrees({0, 0}, 1, 350, 10);
        QVERIFY(std::abs(radToDeg(w.sweep) - 20) < 1e-12);
        QVERIFY(w.containsAngle(0));
        QVERIFY(!w.containsAngle(degToRad(180)));
        const BoundingBox wb = geom::arcBounds(w);
        QCOMPARE(wb.max.x, 1.0); // passes through angle 0
        // Quarter arc bounds exclude the circle's other extremes.
        const BoundingBox b = geom::arcBounds(a);
        QVERIFY(nearlyEqual(b.min, {0, 0}, 1e-12));
        QVERIFY(nearlyEqual(b.max, {10, 10}, 1e-12));
    }
    void arcDistanceAndRect() {
        const ArcGeom a = geom::arcFromDegrees({0, 0}, 10, 0, 90);
        QVERIFY(std::abs(geom::distancePointToArc({0, 12}, a) - 2) < 1e-12);
        QVERIFY(std::abs(geom::distancePointToArc({-10, 0}, a) - std::hypot(20, 0) / 2 * std::sqrt(2.0)) < 1e-12);
        QCOMPARE(geom::distancePointToArc({0, 0}, a), 10.0);
        QVERIFY(geom::arcIntersectsRect(a, BoundingBox({6, 6}, {8, 8})));    // crosses at 45 deg
        QVERIFY(!geom::arcIntersectsRect(a, BoundingBox({-8, 6}, {-6, 8}))); // on the circle, not the arc
        QVERIFY(geom::arcIntersectsRect(a, BoundingBox({9, -1}, {11, 1})));  // contains start point
        QVERIFY(!geom::arcIntersectsRect(a, BoundingBox({-1, -1}, {1, 1}))); // inside, untouched
    }
    void bulges() {
        // bulge 1 = semicircle, CCW: from (1,0) to (-1,0) passes through (0,1).
        auto a = geom::arcFromBulge({1, 0}, {-1, 0}, 1.0);
        QVERIFY(a);
        QVERIFY(nearlyEqual(a->center, {0, 0}, 1e-15));
        QVERIFY(std::abs(a->radius - 1) < 1e-15);
        QVERIFY(nearlyEqual(a->pointAtAngle(a->startAngle + a->sweep / 2), {0, 1}, 1e-12));
        // Negative bulge goes the other way.
        auto c = geom::arcFromBulge({1, 0}, {-1, 0}, -1.0);
        QVERIFY(nearlyEqual(c->pointAtAngle(c->startAngle + c->sweep / 2), {0, -1}, 1e-12));
        // Small bulge: quarter circle (bulge = tan(22.5 deg)).
        auto q = geom::arcFromBulge({10, 0}, {0, 10}, std::tan(kPi / 8));
        QVERIFY(nearlyEqual(q->center, {0, 0}, 1e-12));
        QVERIFY(std::abs(q->radius - 10) < 1e-12);
        // Large bulge (>1): 270 degree arc.
        auto big = geom::arcFromBulge({10, 0}, {0, -10}, std::tan(3 * kPi / 8));
        QVERIFY(nearlyEqual(big->center, {0, 0}, 1e-12));
        QVERIFY(std::abs(radToDeg(big->sweep) - 270) < 1e-9);
        QVERIFY(!geom::arcFromBulge({1, 1}, {1, 1}, 1.0));
        QVERIFY(!geom::arcFromBulge({0, 0}, {1, 1}, 0.0));
        QVERIFY(std::abs(geom::arcSegmentArea(*a) - kPi / 2) < 1e-12);
    }
    void tessellationAccuracy() {
        const ArcGeom a = geom::arcFromDegrees({3, 4}, 1000, 10, 300);
        const auto pts = geom::tessellateArc(a, 0.01);
        QVERIFY(pts.size() > 10);
        QCOMPARE(pts.front(), a.startPoint());
        QCOMPARE(pts.back(), a.endPoint());
        for (std::size_t i = 1; i < pts.size(); ++i) {
            const Vec2 mid = (pts[i - 1] + pts[i]) * 0.5; // chord midpoint = worst deviation
            QVERIFY(1000 - distance(mid, a.center) <= 0.01 + 1e-9);
        }
    }
    void affine() {
        const Affine2D r = Affine2D::rotationDeg(90);
        QCOMPARE(r.apply({1, 0}), Vec2(0, 1)); // exact for 90 degrees
        const Affine2D m = Affine2D::translation({10, 0}) * Affine2D::scaling(2, 2);
        QCOMPARE(m.apply({1, 1}), Vec2(12, 2)); // scale first, then translate
        QVERIFY(m.isSimilarity());
        QVERIFY(!Affine2D::scaling(2, 3).isSimilarity());
        QVERIFY(Affine2D::scaling(-1, 1).isSimilarity());
        QCOMPARE(Affine2D::scaling(-1, 1).det(), -1.0);
        QCOMPARE(m.uniformScale(), 2.0);
    }
    void entityTransforms() {
        const Affine2D mirrorX = Affine2D::scaling(-1, 1);
        ArcEntity arc({0, 0}, 5, 0, 90);
        auto ma = arc.transformed(mirrorX);
        const auto& a2 = static_cast<const ArcEntity&>(*ma);
        QVERIFY(std::abs(a2.startDeg() - 90) < 1e-12 && std::abs(a2.endDeg() - 180) < 1e-12);
        QVERIFY(!arc.transformed(Affine2D::scaling(1, 2)));      // would be an ellipse
        CircleEntity c({1, 1}, 2);
        auto c2 = c.transformed(Affine2D::translation({5, 0}) * Affine2D::scaling(3, 3));
        QCOMPARE(static_cast<const CircleEntity&>(*c2).radius(), 6.0);
        QCOMPARE(static_cast<const CircleEntity&>(*c2).center(), Vec2(8, 3));
        PolylineEntity p({{1, 0}, {-1, 0}}, {1.0, 1.0}, true);
        auto p2 = p.transformed(mirrorX);
        QCOMPARE(static_cast<const PolylineEntity&>(*p2).bulges()[0], -1.0);
        QVERIFY(std::abs(static_cast<const PolylineEntity&>(*p2).area() - kPi) < 1e-12);
        PolylineEntity straight({{0, 0}, {1, 0}, {1, 1}}, false);
        QVERIFY(straight.transformed(Affine2D::scaling(1, 5))); // straight polylines allow any affine
        LineEntity l({0, 0}, {1, 0});
        l.setLayer("X");
        QCOMPARE(l.transformed(Affine2D::rotationDeg(90))->layer(), std::string("X"));
    }
    void entities() {
        LineEntity l({0, 0}, {3, 4});
        QCOMPARE(l.length(), 5.0);
        QCOMPARE(l.distanceTo({0, 5}), 3.0);
        QVERIFY(l.insideRect(BoundingBox({-1, -1}, {4, 5})));
        QVERIFY(!l.insideRect(BoundingBox({1, 1}, {4, 5})));
        QVERIFY(l.crossesRect(BoundingBox({1, 1}, {4, 5})));

        CircleEntity c({10, 10}, 5);
        QCOMPARE(c.distanceTo({10, 10}), 5.0);
        QCOMPARE(c.distanceTo({18, 10}), 3.0);
        QCOMPARE(c.bounds().min, Vec2(5, 5));
        QVERIFY(std::abs(c.area() - kPi * 25) < 1e-12);

        PolylineEntity p({{0, 0}, {10, 0}, {10, 10}, {0, 10}}, true);
        QCOMPARE(p.segmentCount(), std::size_t(4));
        QCOMPARE(p.length(), 40.0);
        QCOMPARE(p.area(), 100.0);
        QCOMPARE(p.distanceTo({5, 5}), 5.0);
        QCOMPARE(p.distanceTo({-2, 5}), 2.0); // closing segment counts
        QVERIFY(!p.crossesRect(BoundingBox({2, 2}, {8, 8}))); // rect inside, no edge touched
        auto clone = p.clone();
        QCOMPARE(static_cast<PolylineEntity&>(*clone).vertices().size(), std::size_t(4));
    }
};

QTEST_GUILESS_MAIN(TestGeometry)
#include "test_geometry.moc"
