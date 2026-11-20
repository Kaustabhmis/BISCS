// DYNAMIC CAD - performance measurements (reported, with generous limits so
// regressions are caught without making the suite flaky on slow machines).
#include "canvas/CadCanvas.h"
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "fileio/DynFormat.h"
#include "ui/MainWindow.h"

#include <QElapsedTimer>
#include <QTemporaryDir>
#include <QtTest>

#include <random>

using namespace dyncad;

class TestPerformance : public QObject {
    Q_OBJECT
    static void fill(Document& doc, int n) {
        std::mt19937 rng(7);
        std::uniform_real_distribution<double> d(0, 10000);
        std::vector<EntityPtr> v;
        v.reserve(n);
        for (int i = 0; i < n; ++i) {
            if (i % 4 == 0) v.push_back(std::make_shared<CircleEntity>(Vec2{d(rng), d(rng)}, 1 + d(rng) / 200));
            else {
                const Vec2 a{d(rng), d(rng)};
                v.push_back(std::make_shared<LineEntity>(a, a + Vec2{d(rng) / 50, d(rng) / 50}));
            }
        }
        doc.addWithUndo(v, "fill");
    }
private slots:
    void largeDrawing_data() {
        QTest::addColumn<int>("count");
        QTest::newRow("10k") << 10000;
        QTest::newRow("100k") << 100000;
    }
    void largeDrawing() {
        QFETCH(int, count);
        MainWindow w;
        w.resize(1600, 900);
        w.show();
        QVERIFY(QTest::qWaitForWindowExposed(&w));
        QElapsedTimer t;
        t.start();
        fill(w.document(), count);
        const qint64 tAdd = t.restart();
        w.canvas()->zoomExtents();
        QImage img(w.canvas()->size(), QImage::Format_ARGB32_Premultiplied);
        w.canvas()->render(&img);
        const qint64 tRenderAll = t.restart();
        w.canvas()->zoomBy(20); // typical zoomed-in working view
        w.canvas()->render(&img);
        const qint64 tRenderZoom = t.restart();
        for (int i = 0; i < 100; ++i) pickEntity(w.document(), {i * 100.0, i * 50.0}, 1.0);
        const qint64 tPick = t.restart();
        const auto sel = selectInRect(w.document(), BoundingBox({0, 0}, {5000, 5000}), RectSelectMode::Crossing);
        const qint64 tWindow = t.restart();
        QTemporaryDir dir;
        QVERIFY(saveDynFile(w.document(), dir.filePath("big.dyn")).ok);
        const qint64 tSave = t.restart();
        Document d2;
        QVERIFY(loadDynFile(d2, dir.filePath("big.dyn")).ok);
        const qint64 tLoad = t.restart();
        QCOMPARE(d2.entityCount(), std::size_t(count));

        qInfo().noquote() << QStringLiteral(
                                 "%1 entities: add %2 ms | render extents %3 ms | render zoomed %4 ms | "
                                 "100 picks %5 ms (%6 ms each) | crossing select %7 ms (%8 hits) | save %9 ms | load %10 ms")
                                 .arg(count).arg(tAdd).arg(tRenderAll).arg(tRenderZoom).arg(tPick)
                                 .arg(tPick / 100.0, 0, 'f', 2).arg(tWindow).arg(sel.size()).arg(tSave).arg(tLoad);
        // Generous ceilings: catch pathological regressions only.
        QVERIFY(tPick / 100.0 < 50.0);
        QVERIFY(tRenderAll < 20000);
    }
};

QTEST_MAIN(TestPerformance)
#include "test_performance.moc"
