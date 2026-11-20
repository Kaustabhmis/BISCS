// DYNAMIC CAD - view transform (zoom / pan / coordinate mapping) tests.
#include "canvas/ViewTransform.h"

#include <QtTest>

using namespace dyncad;

class TestView : public QObject {
    Q_OBJECT
private slots:
    void roundTrip() {
        ViewTransform v;
        v.setViewportSize(1000, 600);
        v.setView({123.456, -78.9}, 3.7);
        for (Vec2 w : {Vec2{0, 0}, Vec2{1e6, -1e6}, Vec2{123.456, -78.9}, Vec2{0.001, 0.002}}) {
            const Vec2 back = v.screenToWorld(v.worldToScreen(w));
            QVERIFY(nearlyEqual(back, w, std::max(1.0, std::abs(w.x)) * 1e-12));
        }
        QCOMPARE(v.worldToScreen({123.456, -78.9}), Vec2(500, 300)); // centre maps to centre
        QVERIFY(v.worldToScreen({124.456, -78.9}).x > 500);           // +X right
        QVERIFY(v.worldToScreen({123.456, -77.9}).y < 300);           // +Y up
    }
    void zoomKeepsAnchorFixed() {
        ViewTransform v;
        v.setViewportSize(800, 600);
        v.setView({0, 0}, 1.0);
        const Vec2 screen{123, 456};
        const Vec2 before = v.screenToWorld(screen);
        for (int i = 0; i < 50; ++i) v.zoomAt(screen, 1.25);
        QVERIFY(nearlyEqual(v.screenToWorld(screen), before, 1e-9));
        for (int i = 0; i < 50; ++i) v.zoomAt(screen, 0.8);
        QVERIFY(nearlyEqual(v.screenToWorld(screen), before, 1e-9));
        QVERIFY(std::abs(v.scale() - 1.0) < 1e-9);
    }
    void zoomClamped() {
        ViewTransform v;
        v.setViewportSize(800, 600);
        for (int i = 0; i < 500; ++i) v.zoomAt({400, 300}, 2.0);
        QCOMPARE(v.scale(), ViewTransform::kMaxScale);
        for (int i = 0; i < 500; ++i) v.zoomAt({400, 300}, 0.5);
        QCOMPARE(v.scale(), ViewTransform::kMinScale);
    }
    void pan() {
        ViewTransform v;
        v.setViewportSize(800, 600);
        v.setView({0, 0}, 2.0);
        const Vec2 w = v.screenToWorld({100, 100});
        v.panByPixels(30, -40);
        QVERIFY(nearlyEqual(v.worldToScreen(w), {130, 60}, 1e-9)); // content moves with the mouse
    }
    void fit() {
        ViewTransform v;
        v.setViewportSize(1000, 500);
        v.fitTo(BoundingBox({0, 0}, {420, 297}), 0.0);
        QCOMPARE(v.center(), Vec2(210, 148.5));
        QVERIFY(std::abs(v.scale() - 500.0 / 297.0) < 1e-12); // height-limited
        const BoundingBox vis = v.visibleWorldRect();
        QVERIFY(vis.contains(BoundingBox({0, 0}, {420, 297}).inflated(-1e-9)));
        v.fitTo(BoundingBox({5, 5}, {5, 5})); // single point keeps scale
        QCOMPARE(v.center(), Vec2(5, 5));
    }
};

QTEST_GUILESS_MAIN(TestView)
#include "test_view.moc"
