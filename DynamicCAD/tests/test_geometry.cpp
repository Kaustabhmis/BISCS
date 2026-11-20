// DYNAMIC CAD - geometry engine tests.
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
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
