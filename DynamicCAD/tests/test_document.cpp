// DYNAMIC CAD - document, undo/redo tests.
#include "document/Document.h"
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"

#include <QtTest>

using namespace dyncad;

namespace {
EntityPtr line(double x) { return std::make_shared<LineEntity>(Vec2{x, 0}, Vec2{x, 10}); }
std::vector<double> xs(const Document& d) {
    std::vector<double> out;
    for (auto& e : d.entities()) out.push_back(static_cast<LineEntity&>(*e).start().x);
    return out;
}
} // namespace

class TestDocument : public QObject {
    Q_OBJECT
private slots:
    void addUndoRedo() {
        Document d;
        int notified = 0;
        d.addListener([&] { ++notified; });
        QVERIFY(!d.isModified());
        d.addWithUndo({line(1)}, "Line");
        d.addWithUndo({line(2), line(3)}, "Lines");
        QCOMPARE(d.entityCount(), std::size_t(3));
        QVERIFY(d.isModified());
        QCOMPARE(QString::fromStdString(d.undoStack().undoText()), QString("Lines"));
        d.undo();
        QCOMPARE(d.entityCount(), std::size_t(1));
        d.undo();
        QCOMPARE(d.entityCount(), std::size_t(0));
        QVERIFY(!d.isModified()); // back at clean state
        d.undo(); // no-op
        d.redo();
        d.redo();
        QCOMPARE(xs(d), (std::vector<double>{1, 2, 3}));
        QVERIFY(notified >= 6);
    }
    void idsAreStableAcrossUndo() {
        Document d;
        auto e = line(5);
        d.addWithUndo({e}, "Line");
        const EntityId id = e->id();
        QVERIFY(id != kInvalidEntityId);
        d.undo();
        QVERIFY(!d.findEntity(id));
        d.redo();
        QCOMPARE(d.findEntity(id), e);
    }
    void eraseRestoresDrawOrder() {
        Document d;
        std::vector<EntityPtr> all;
        for (int i = 0; i < 10; ++i) all.push_back(line(i));
        d.addWithUndo(all, "Lines");
        QCOMPARE(d.eraseWithUndo({all[0]->id(), all[4]->id(), all[9]->id(), 999999}), std::size_t(3));
        QCOMPARE(xs(d), (std::vector<double>{1, 2, 3, 5, 6, 7, 8}));
        d.undo();
        QCOMPARE(xs(d), (std::vector<double>{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}));
        d.redo();
        QCOMPARE(d.entityCount(), std::size_t(7));
        QCOMPARE(d.eraseWithUndo({123456}), std::size_t(0)); // nothing -> no undo step
    }
    void newEditDiscardsRedo() {
        Document d;
        d.addWithUndo({line(1)}, "a");
        d.markSaved();
        d.undo();
        QVERIFY(d.isModified());
        d.addWithUndo({line(2)}, "b"); // saved state now unreachable
        QVERIFY(!d.undoStack().canRedo());
        QVERIFY(d.isModified());
        d.undo();
        QVERIFY(d.isModified()); // empty doc != saved doc (which had line 1)
    }
    void extentsAndReset() {
        Document d;
        QVERIFY(!d.extents().isValid());
        d.addWithUndo({std::make_shared<CircleEntity>(Vec2{100, 100}, 10), line(-5)}, "x");
        const BoundingBox b = d.extents();
        QCOMPARE(b.min, Vec2(-5, 0));
        QCOMPARE(b.max, Vec2(110, 110));
        d.reset({line(1)}, "in");
        QCOMPARE(d.entityCount(), std::size_t(1));
        QVERIFY(!d.undoStack().canUndo());
        QVERIFY(!d.isModified());
        QCOMPARE(QString::fromStdString(d.units()), QString("in"));
    }
    void largeEraseUndoIsFast() {
        Document d;
        std::vector<EntityPtr> all;
        for (int i = 0; i < 100000; ++i) all.push_back(line(i));
        d.addWithUndo(all, "many");
        std::vector<EntityId> ids;
        for (int i = 0; i < 100000; i += 2) ids.push_back(all[i]->id());
        QElapsedTimer t;
        t.start();
        d.eraseWithUndo(ids);
        d.undo();
        d.redo();
        d.undo();
        const qint64 ms = t.elapsed();
        qInfo() << "erase/undo/redo/undo of 50k of 100k entities:" << ms << "ms";
        QCOMPARE(d.entityCount(), std::size_t(100000));
        QCOMPARE(static_cast<LineEntity&>(*d.entities()[12345]).start().x, 12345.0);
        QVERIFY(ms < 5000);
    }
};

QTEST_GUILESS_MAIN(TestDocument)
#include "test_document.moc"
