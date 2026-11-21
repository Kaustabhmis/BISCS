// DYNAMIC CAD - text, dimension, leader and measurement tests.
#include "commands/AnnotationCommands.h"
#include "commands/CommandProcessor.h"
#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "fileio/DynFormat.h"

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
        proc.setPickTolerance(0.5);
    }
    void type(std::initializer_list<const char*> l) { for (const char* s : l) proc.submit(s); }
    template <class T> const T& at(std::size_t i) { return static_cast<const T&>(*doc.entities().at(i)); }
    bool said(const std::string& part) const {
        for (auto& m : msgs) if (m.find(part) != std::string::npos) return true;
        return false;
    }
};
bool near(double a, double b, double e = 1e-9) { return std::abs(a - b) <= e; }
} // namespace

class TestAnnotation : public QObject {
    Q_OBJECT
private slots:
    void layout() {
        setTextWidthFunction(nullptr); // estimate: 0.6 x height per character
        auto l = layoutText("ABCD", 10, TextJustify::Left, "Arial");
        QCOMPARE(l.lines.size(), std::size_t(1));
        QCOMPARE(l.box.max.x, 24.0);
        QCOMPARE(l.box.max.y, 10.0);
        auto c = layoutText("ABCD", 10, TextJustify::Center, "Arial");
        QCOMPARE(c.lines[0].start.x, -12.0);
        auto m = layoutText("A\nB", 3, TextJustify::TopLeft, "Arial");
        QCOMPARE(m.lines.size(), std::size_t(2));
        QCOMPARE(m.lines[0].start.y, -3.0);
        QCOMPARE(m.lines[1].start.y, -3.0 - 5.0);
        auto w = layoutText("one two three four", 1, TextJustify::Left, "Arial", 5.0); // wraps at 5 units
        QVERIFY(w.lines.size() >= 3);
        for (const auto& line : w.lines) QVERIFY(textWidth(line.text, "Arial", 1) <= 5.0 + 1e-9 || line.text.find(' ') == std::string::npos);
        QCOMPARE(formatMeasurement(100.0, 2, true), std::string("100"));
        QCOMPARE(formatMeasurement(12.5, 2, true), std::string("12.5"));
        QCOMPARE(formatMeasurement(12.5, 2, false), std::string("12.50"));
        QCOMPARE(formatMeasurement(-0.0001, 2, true), std::string("0"));
    }

    void textEntity() {
        setTextWidthFunction(nullptr);
        TextEntity t({10, 20}, "HELLO", 5, 90);
        // Rotated 90: the box extends upwards from the insertion point.
        const BoundingBox b = t.bounds();
        QVERIFY(near(b.min.x, 10 - 5) && near(b.max.y, 20 + 15)); // width 15 along +Y
        QCOMPARE(t.distanceTo({8, 25}), 0.0);                     // inside the box
        QVERIFY(t.distanceTo({100, 100}) > 50);
        auto m = t.transformed(Affine2D::scaling(-1, 1));           // mirrored: stays readable
        const auto& mt = static_cast<const TextEntity&>(*m);
        QVERIFY(near(mt.rotationDeg(), 90) || near(mt.rotationDeg(), -90));
        QCOMPARE(mt.insert(), Vec2(-10, 20));
        auto s = t.transformed(Affine2D::scaling(2, 2));
        QCOMPARE(static_cast<const TextEntity&>(*s).height(), 10.0);
    }

    void dimensions() {
        setTextWidthFunction(nullptr);
        DimensionEntity lin(DimKind::Linear, {0, 0}, {100, 30}, {50, 50}, 0);
        QCOMPARE(lin.measurement(), 100.0);
        QCOMPARE(QString::fromStdString(lin.displayText()), QString("100"));
        const auto g = lin.graphics();
        QCOMPARE(g.arrows.size(), std::size_t(2));
        QCOMPARE(g.texts.size(), std::size_t(1));
        // Dimension line at y = 50 from x = 0 to 100; arrow tips exactly there.
        bool found = false;
        for (const auto& l : g.lines) found |= (l.first == Vec2(0, 50) && l.second == Vec2(100, 50));
        QVERIFY(found);
        QCOMPARE(g.arrows[0][0], Vec2(0, 50));
        // Extension lines start 0.625 from the measured points and pass 1.25 beyond.
        bool ext = false;
        for (const auto& l : g.lines) ext |= (nearlyEqual(l.first, {0, 0.625}, 1e-12) && nearlyEqual(l.second, {0, 51.25}, 1e-12));
        QVERIFY(ext);
        QVERIFY(g.texts[0].position.y > 50); // text above the line

        DimensionEntity ver(DimKind::Linear, {0, 0}, {100, 30}, {150, 10}, 90);
        QCOMPARE(ver.measurement(), 30.0);
        DimensionEntity ali(DimKind::Aligned, {0, 0}, {30, 40}, {-10, 10});
        QCOMPARE(ali.measurement(), 50.0);
        DimensionEntity rad(DimKind::Radius, {0, 0}, {10, 0}, {20, 20});
        QCOMPARE(QString::fromStdString(rad.displayText()), QString("R10"));
        DimensionEntity dia(DimKind::Diameter, {0, 0}, {10, 0}, {3, 3});
        QCOMPARE(QString::fromStdString(dia.displayText()), QString::fromUtf8("Ø20"));
        QCOMPARE(dia.graphics().arrows.size(), std::size_t(2));
        DimensionEntity ang(DimKind::Angular, {0, 0}, {10, 0}, {5, 5});
        ang.setC({0, 10});
        QVERIFY(near(ang.measurement(), 90));
        QCOMPARE(QString::fromStdString(ang.displayText()), QString::fromUtf8("90°"));
        ang.setPoint(3, {-5, -5}); // location in the other sector: 270 degrees
        QVERIFY(near(ang.measurement(), 270));
        DimensionEntity ov = lin;
        ov.setTextOverride("<> TYP");
        QCOMPARE(QString::fromStdString(ov.displayText()), QString("100 TYP"));
        ov.setTextOverride("SEE NOTE");
        QCOMPARE(QString::fromStdString(ov.displayText()), QString("SEE NOTE"));
        // Short dimension: arrows flip outside.
        DimensionEntity tiny(DimKind::Aligned, {0, 0}, {3, 0}, {1, 5});
        const auto tg = tiny.graphics();
        QVERIFY(tg.arrows[0][1].x < 0); // arrow body outside on the left
        // Transform: measurement follows the geometry, MOVE keeps it.
        auto moved = lin.transformed(Affine2D::translation({5, 5}));
        QCOMPARE(static_cast<const DimensionEntity&>(*moved).measurement(), 100.0);
        auto scaled = lin.transformed(Affine2D::scaling(2, 2));
        QCOMPARE(static_cast<const DimensionEntity&>(*scaled).measurement(), 200.0);
        auto rotated = ver.transformed(Affine2D::rotationDeg(90));
        QCOMPARE(static_cast<const DimensionEntity&>(*rotated).measurement(), 30.0);
    }

    void textCommands() {
        setTextWidthFunction(nullptr);
        Fx f;
        f.type({"DT", "10,10", "5", "0", "Hello world", "Second line", ""});
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        QCOMPARE(QString::fromStdString(f.at<TextEntity>(0).text()), QString("Hello world")); // spaces kept
        QCOMPARE(f.at<TextEntity>(1).insert(), Vec2(10, 10 - 5 * kLineSpacing));
        QVERIFY(!f.proc.isActive());
        f.type({"TEXT", "J", "C", "0,0", "", "", "Centred", ""}); // defaults: last height, rotation 0
        QVERIFY(f.at<TextEntity>(2).justify() == TextJustify::Center);
        QCOMPARE(f.at<TextEntity>(2).height(), 5.0);
        f.type({"T", "0,100", "H", "3", "80,60", "Paragraph one", "Paragraph two", ""});
        const auto& mt = f.at<TextEntity>(3);
        QVERIFY(mt.multiline());
        QCOMPARE(mt.wrapWidth(), 80.0);
        QCOMPARE(mt.insert(), Vec2(0, 100));
        QCOMPARE(QString::fromStdString(mt.text()), QString("Paragraph one\nParagraph two"));
        // In text mode, words that look like commands or snaps are just text.
        f.type({"DT", "0,-50", "", "", "END ZOOM 1,2", ""});
        QCOMPARE(QString::fromStdString(f.at<TextEntity>(4).text()), QString("END ZOOM 1,2"));
    }

    void dimensionCommands() {
        setTextWidthFunction(nullptr);
        Fx f;
        f.type({"DLI", "0,0", "100,30", "50,60"});         // above: horizontal
        f.type({"DLI", "0,0", "100,30", "150,10"});        // right: vertical
        f.type({"DLI", "0,0", "100,30", "R", "45", "0,50"});
        f.type({"DAL", "0,0", "30,40", "-10,10"});
        f.type({"DLI", "0,0", "10,0", "T", "<> MAX", "5,10"});
        QCOMPARE(f.doc.entityCount(), std::size_t(5));
        QCOMPARE(f.at<DimensionEntity>(0).measurement(), 100.0);
        QCOMPARE(f.at<DimensionEntity>(1).measurement(), 30.0);
        QVERIFY(near(f.at<DimensionEntity>(2).measurement(), 130.0 / std::sqrt(2.0), 1e-9));
        QCOMPARE(f.at<DimensionEntity>(3).measurement(), 50.0);
        QCOMPARE(QString::fromStdString(f.at<DimensionEntity>(4).displayText()), QString("10 MAX"));

        // Object-based: pick a line, a circle, two lines.
        Fx g;
        g.doc.addWithUndo({std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{40, 0}),
                           std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{0, 30}),
                           std::make_shared<CircleEntity>(Vec2{100, 0}, 15),
                           std::make_shared<ArcEntity>(Vec2{200, 0}, 10, 0, 60)}, "x");
        g.type({"DLI", "", "20,0", "20,-10"});          // select the line
        g.type({"DRA", "115,0", "130,10"});
        g.type({"DDI", "85,0", "60,0"});
        g.type({"DAN", "20,0", "0,15", "10,10"});         // two lines
        g.type({"DAN", "205,8.66", "215,10"});            // arc
        g.type({"DAN", "", "0,0", "10,0", "10,10", "5,2"}); // vertex + 2 points
        QCOMPARE(g.doc.entityCount(), std::size_t(10));
        QCOMPARE(g.at<DimensionEntity>(4).measurement(), 40.0);
        QCOMPARE(g.at<DimensionEntity>(5).measurement(), 15.0);
        QCOMPARE(g.at<DimensionEntity>(6).measurement(), 30.0);
        QVERIFY(near(g.at<DimensionEntity>(7).measurement(), 90.0));
        QVERIFY(near(g.at<DimensionEntity>(8).measurement(), 60.0));
        QVERIFY(near(g.at<DimensionEntity>(9).measurement(), 45.0));
        // STRETCH a line and its dimension together: the value updates.
        g.type({"S", "35,-20", "50,5", "0,0", "10,0"});
        QCOMPARE(g.at<DimensionEntity>(4).measurement(), 50.0);
    }

    void leaderAndMeasure() {
        setTextWidthFunction(nullptr);
        Fx f;
        f.type({"LE", "0,0", "10,10", "20,10", "", "6 HOLES DIA 17.5", "EQUI-SPACED", ""});
        const auto& l = f.at<LeaderEntity>(0);
        QCOMPARE(l.points().size(), std::size_t(3));
        QCOMPARE(QString::fromStdString(l.text()), QString("6 HOLES DIA 17.5\nEQUI-SPACED"));
        const auto g = l.graphics();
        QCOMPARE(g.arrows[0][0], Vec2(0, 0));
        QVERIFY(g.texts[0].position.x > 20); // text to the right of the landing
        f.type({"DI", "0,0", "30,40"});
        QVERIFY(f.said("Distance = 50.0000"));
        QVERIFY(f.said("Delta X = 30.0000"));
        f.type({"AA", "0,0", "10,0", "10,5", "0,5", ""});
        QVERIFY(f.said("Area = 50.0000,  Perimeter = 30.0000"));
        f.doc.addWithUndo({std::make_shared<CircleEntity>(Vec2{100, 0}, 10)}, "c");
        f.type({"AA", "O", "110,0"});
        QVERIFY(f.said("Area = 314.1593"));
        f.type({"ID", "12.5,-3"});
        QVERIFY(f.said("X = 12.5000     Y = -3.0000"));
    }

    void saveAndReload() {
        Document d;
        auto t = std::make_shared<TextEntity>(Vec2{1, 2}, "Line A\nLine B", 3.5, 30, TextJustify::Middle);
        t->setWrapWidth(40);
        auto dim = std::make_shared<DimensionEntity>(DimKind::Angular, Vec2{0, 0}, Vec2{10, 0}, Vec2{5, 5});
        dim->setC({0, 10});
        dim->setTextOverride("<> REF");
        DimStyle st;
        st.textHeight = 3.5;
        st.precision = 1;
        dim->setDimStyle(st);
        auto lin = std::make_shared<DimensionEntity>(DimKind::Linear, Vec2{0, 0}, Vec2{10, 5}, Vec2{5, 20}, 90);
        auto ld = std::make_shared<LeaderEntity>(std::vector<Vec2>{{0, 0}, {5, 5}}, "NOTE");
        d.addWithUndo({t, dim, lin, ld}, "x");
        const QByteArray data = serializeDyn(d);
        Document b;
        const FileResult r = deserializeDyn(data, b);
        QVERIFY2(r.ok, r.error.c_str());
        QVERIFY(r.warnings.empty());
        QCOMPARE(serializeDyn(b), data);
        const auto& bd = static_cast<const DimensionEntity&>(*b.entities()[1]);
        QCOMPARE(bd.dimStyle().precision, 1);
        QCOMPARE(QString::fromStdString(bd.textOverride()), QString("<> REF"));
        QCOMPARE(static_cast<const DimensionEntity&>(*b.entities()[2]).angleDeg(), 90.0);
    }
};

QTEST_GUILESS_MAIN(TestAnnotation)
#include "test_annotation.moc"
