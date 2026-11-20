// DYNAMIC CAD - command-line parsing and interactive command tests.
#include "commands/CommandProcessor.h"
#include "entities/CircleEntity.h"
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
