// DYNAMIC CAD - selection tests.
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "selection/SelectionSet.h"

#include <QtTest>

using namespace dyncad;

class TestSelection : public QObject {
    Q_OBJECT
    Document doc;
    EntityPtr l1, l2, c1, r1;
private slots:
    void initTestCase() {
        l1 = std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{100, 0});
        l2 = std::make_shared<LineEntity>(Vec2{0, 1}, Vec2{100, 1}); // drawn later, 1 unit above
        c1 = std::make_shared<CircleEntity>(Vec2{50, 50}, 10);
        r1 = std::make_shared<PolylineEntity>(std::vector<Vec2>{{200, 0}, {300, 0}, {300, 100}, {200, 100}}, true);
        doc.addWithUndo({l1, l2, c1, r1}, "setup");
    }
    void pickNearest() {
        QCOMPARE(pickEntity(doc, {50, 0.2}, 0.5), l1->id());
        QCOMPARE(pickEntity(doc, {50, 0.8}, 0.5), l2->id());
        QCOMPARE(pickEntity(doc, {50, 0.5}, 0.5), l2->id()); // tie -> top-most
        QCOMPARE(pickEntity(doc, {60.2, 50}, 0.5), c1->id());
        QCOMPARE(pickEntity(doc, {50, 50}, 0.5), kInvalidEntityId); // centre of circle is empty
        QCOMPARE(pickEntity(doc, {250, 50}, 0.5), kInvalidEntityId); // inside rectangle
        QCOMPARE(pickEntity(doc, {200.3, 50}, 0.5), r1->id());
    }
    void windowVsCrossing() {
        const BoundingBox box({-10, -10}, {65, 65});
        auto win = selectInRect(doc, box, RectSelectMode::Window);
        QCOMPARE(win.size(), std::size_t(1)); // only the circle is fully inside
        QCOMPARE(win[0], c1->id());
        auto cross = selectInRect(doc, box, RectSelectMode::Crossing);
        QCOMPARE(cross.size(), std::size_t(3)); // lines touched too, not the rectangle
        auto inside = selectInRect(doc, BoundingBox({210, 10}, {290, 90}), RectSelectMode::Crossing);
        QVERIFY(inside.empty()); // box inside closed polyline touches no edge
    }
    void setOperations() {
        SelectionSet s;
        int changes = 0;
        s.onChanged = [&] { ++changes; };
        s.add(l1->id());
        s.add(l1->id()); // duplicate: no change
        s.add({c1->id(), l2->id()});
        QCOMPARE(s.size(), std::size_t(3));
        QCOMPARE(s.ids().front(), l1->id());
        s.remove(c1->id());
        QVERIFY(!s.contains(c1->id()));
        QCOMPARE(changes, 3);
        doc.eraseWithUndo({l2->id()});
        s.prune(doc);
        QCOMPARE(s.size(), std::size_t(1));
        doc.undo();
        s.clear();
        QVERIFY(s.empty());
    }
};

QTEST_GUILESS_MAIN(TestSelection)
#include "test_selection.moc"
