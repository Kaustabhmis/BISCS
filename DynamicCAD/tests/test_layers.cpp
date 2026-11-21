// DYNAMIC CAD - layers, colours, linetypes, lineweights, MATCHPROP tests.
#include "commands/CommandProcessor.h"
#include "commands/ModifyCommands.h"
#include "dxf/DxfReader.h"
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "fileio/DynFormat.h"
#include "snapping/SnapEngine.h"

#include <QTemporaryDir>
#include <QtTest>

using namespace dyncad;

class TestLayers : public QObject {
    Q_OBJECT
private slots:
    void colors() {
        CadColor c;
        QVERIFY(CadColor::parse("1", c) && c == CadColor::fromIndex(1));
        QVERIFY(CadColor::parse("#FF8000", c) && c.rgb == 0xFF8000);
        QVERIFY(CadColor::parse("bylayer", c) && c.kind == CadColor::Kind::ByLayer);
        QVERIFY(!CadColor::parse("256", c) && !CadColor::parse("#12", c) && !CadColor::parse("red", c));
        QCOMPARE(QString::fromStdString(CadColor::fromRgb(0x0A0B0C).toString()), QString("#0A0B0C"));
        QCOMPARE(colorIndexToRgb(1), 0xFF0000u);
        QCOMPARE(colorIndexToRgb(5), 0x0000FFu);
        QCOMPARE(colorIndexToRgb(7), 0xFFFFFFu);
        QCOMPARE(colorIndexToRgb(250), 0x333333u);
        QCOMPARE(colorIndexToRgb(10), 0xFF0000u); // hue 0, full value
        QCOMPARE(QString::fromStdString(lineweightToString(35)), QString("0.35 mm"));
        QVERIFY(sameName("ByLayer", "BYLAYER") && !sameName("ByLayers", "BYLAYER"));
    }

    void tables() {
        StyleTables t;
        QVERIFY(t.hasLayer("0"));
        Layer l;
        l.name = "Dims";
        QVERIFY(t.addLayer(l));
        QVERIFY(t.layer("DIMS")); // case-insensitive
        QVERIFY(!t.addLayer(Layer{"bad/name"}));
        QVERIFY(t.setCurrentLayer("dims"));
        QCOMPARE(QString::fromStdString(t.currentLayer()), QString("Dims"));
        QVERIFY(!t.removeLayer("Dims")); // current
        QVERIFY(!t.removeLayer("0"));
        QVERIFY(t.renameLayer("Dims", "DIM"));
        QCOMPARE(QString::fromStdString(t.currentLayer()), QString("DIM"));
        QVERIFY(!t.renameLayer("0", "X"));
        t.layer("DIM")->frozen = true;
        t.setCurrentLayer("0");
        QVERIFY(!t.setCurrentLayer("DIM")); // frozen layers cannot be current
        QVERIFY(t.linetype("center") && t.linetype("CENTER")->pattern.size() == 4);
    }

    void resolveAndCurrentLayer() {
        Document d;
        StyleTables t = d.styles();
        Layer part{"PART"};
        part.color = CadColor::fromIndex(1);
        part.linetype = "CENTER";
        part.lineweight = 50;
        t.addLayer(part);
        t.setCurrentLayer("PART");
        t.setLtscale(2.0);
        d.setStylesWithUndo(t, "setup");
        auto a = std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{1, 0}); // no layer: takes the current one
        auto b = std::make_shared<LineEntity>(Vec2{0, 1}, Vec2{1, 1});
        b->setColor(CadColor::fromRgb(0x123456));
        b->setLinetype("Continuous");
        b->setLineweight(kLwDefault);
        b->setLtscale(0.5);
        d.addWithUndo({a, b}, "x");
        QCOMPARE(QString::fromStdString(a->layer()), QString("PART"));
        const auto ra = d.resolve(*a);
        QCOMPARE(ra.rgb, 0xFF0000u);
        QVERIFY(ra.linetype && ra.linetype->name == "CENTER");
        QCOMPARE(ra.lineweight, 50);
        QCOMPARE(ra.ltscale, 2.0);
        const auto rb = d.resolve(*b);
        QCOMPARE(rb.rgb, 0x123456u);
        QVERIFY(!rb.linetype);
        QCOMPARE(rb.lineweight, kLwDefaultValue);
        QCOMPARE(rb.ltscale, 1.0);
        // Undo of the table change brings back layer 0 as current.
        d.undo(); // entities
        d.undo(); // tables
        QCOMPARE(QString::fromStdString(d.styles().currentLayer()), QString("0"));
        QVERIFY(!d.styles().hasLayer("PART"));
    }

    void visibilityAffectsPickSnapSelect() {
        Document d;
        StyleTables t = d.styles();
        t.addLayer(Layer{"HID"});
        t.addLayer(Layer{"LOCK"});
        d.setStylesNoUndo(t);
        auto h = std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0});
        h->setLayer("HID");
        auto k = std::make_shared<LineEntity>(Vec2{0, 5}, Vec2{10, 5});
        k->setLayer("LOCK");
        d.addWithUndo({h, k}, "x");
        StyleTables t2 = d.styles();
        t2.layer("HID")->on = false;
        t2.layer("LOCK")->locked = true;
        d.setStylesWithUndo(t2, "hide");
        QCOMPARE(pickEntity(d, {5, 0}, 0.5), kInvalidEntityId);
        QCOMPARE(pickEntity(d, {5, 5}, 0.5), kInvalidEntityId); // locked: not selectable
        QVERIFY(selectInRect(d, BoundingBox({-1, -1}, {11, 6}), RectSelectMode::Window).empty());
        SnapEngine se;
        QVERIFY(!se.find(d, {10, 0}, 1, kDefaultSnapModes));    // hidden: no snaps
        QVERIFY(se.find(d, {10, 5}, 1, kDefaultSnapModes));     // locked: still snaps
        d.undo();
        QCOMPARE(pickEntity(d, {5, 0}, 0.5), h->id());
    }

    void renameDeleteAndMatchProp() {
        Document d;
        SelectionSet sel;
        CommandProcessor proc(d, sel);
        registerCoreCommands(proc, d);
        StyleTables t = d.styles();
        t.addLayer(Layer{"A"});
        t.addLayer(Layer{"EMPTY"});
        d.setStylesNoUndo(t);
        auto src = std::make_shared<CircleEntity>(Vec2{0, 0}, 5);
        src->setLayer("A");
        src->setColor(CadColor::fromIndex(3));
        src->setLinetype("HIDDEN");
        auto dst = std::make_shared<LineEntity>(Vec2{20, 0}, Vec2{30, 0});
        d.addWithUndo({src, dst}, "x");
        QVERIFY(d.renameLayerWithUndo("A", "PART"));
        QCOMPARE(QString::fromStdString(d.findEntity(src->id())->layer()), QString("PART"));
        d.undo();
        QCOMPARE(QString::fromStdString(d.findEntity(src->id())->layer()), QString("A")); // one undo restores both
        QVERIFY(d.styles().hasLayer("A"));
        QVERIFY(!d.deleteLayerWithUndo("A"));     // in use
        QVERIFY(d.deleteLayerWithUndo("EMPTY"));
        QVERIFY(!d.deleteLayerWithUndo("0"));

        proc.setPickTolerance(0.5);
        proc.submit("MA");
        proc.submit("5,0");      // source: the circle
        sel.add(dst->id());      // canvas click
        proc.submit("");
        const auto& m = *d.findEntity(dst->id());
        QCOMPARE(QString::fromStdString(m.layer()), QString("A"));
        QVERIFY(m.color() == CadColor::fromIndex(3));
        QCOMPARE(QString::fromStdString(m.linetype()), QString("HIDDEN"));
        proc.submit("U");
        QCOMPARE(QString::fromStdString(d.findEntity(dst->id())->linetype()), QString("ByLayer"));
    }

    void stylesSurviveSaveAndTransform() {
        Document d;
        StyleTables t = d.styles();
        Layer l{"CUT"};
        l.color = CadColor::fromRgb(0xAABBCC);
        l.frozen = true;
        l.lineweight = 70;
        t.addLayer(l);
        t.addLinetype(Linetype{"MYDASH", "custom", {2.0, -1.0, 0.0, -1.0}});
        t.setLtscale(3);
        d.setStylesNoUndo(t);
        auto e = std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{10, 0});
        e->setLayer("CUT");
        e->setColor(CadColor::fromIndex(42));
        e->setLinetype("MYDASH");
        e->setLineweight(35);
        e->setLtscale(0.25);
        d.addWithUndo({e}, "x");
        // Transform keeps every display property.
        auto moved = e->transformed(Affine2D::translation({1, 1}));
        QVERIFY(moved->style() == e->style());
        QTemporaryDir dir;
        QVERIFY(saveDynFile(d, dir.filePath("s.dyn")).ok);
        Document b;
        const FileResult r = loadDynFile(b, dir.filePath("s.dyn"));
        QVERIFY2(r.ok, r.error.c_str());
        QVERIFY(b.styles() == d.styles());
        QVERIFY(b.entities()[0]->style() == e->style());
        QCOMPARE(serializeDyn(b), serializeDyn(d));
        QVERIFY(b.styles().layer("CUT")->frozen);
        QCOMPARE(b.styles().linetype("mydash")->pattern.size(), std::size_t(4));
        // A v4 file without tables opens with layer 0 only, and unknown layers are created.
        Document old;
        QVERIFY(deserializeDyn(R"({"format":"DynamicCAD-Drawing","formatVersion":4,"entities":[
            {"type":"LINE","layer":"WALLS","start":[0,0],"end":[1,0]}]})", old).ok);
        QVERIFY(old.styles().hasLayer("WALLS") && old.styles().hasLayer("0"));
    }

    void dxfLayersColorsLinetypes() {
        const QByteArray data =
            "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1024\n9\n$INSUNITS\n70\n4\n9\n$LTSCALE\n40\n2.5\n9\n$CLAYER\n8\nPART\n0\nENDSEC\n"
            "0\nSECTION\n2\nTABLES\n"
            "0\nTABLE\n2\nLTYPE\n0\nLTYPE\n2\nCENTER2\n3\nCenter (.5x)\n72\n65\n73\n4\n40\n15\n49\n10\n49\n-2.5\n49\n0\n49\n-2.5\n0\nENDTAB\n"
            "0\nTABLE\n2\nLAYER\n"
            "0\nLAYER\n2\nPART\n70\n0\n62\n1\n6\nCONTINUOUS\n370\n50\n"
            "0\nLAYER\n2\nCENTRE\n70\n0\n62\n-3\n6\nCENTER2\n"
            "0\nLAYER\n2\nFROZEN\n70\n1\n62\n5\n6\nCONTINUOUS\n"
            "0\nLAYER\n2\nLOCKED\n70\n4\n62\n6\n420\n16744448\n6\nCONTINUOUS\n"
            "0\nENDTAB\n0\nENDSEC\n"
            "0\nSECTION\n2\nBLOCKS\n0\nBLOCK\n8\n0\n2\nB\n70\n0\n10\n0\n20\n0\n"
            "0\nLINE\n8\n0\n62\n0\n6\nBYBLOCK\n10\n0\n20\n0\n11\n1\n21\n0\n0\nENDBLK\n8\n0\n0\nENDSEC\n"
            "0\nSECTION\n2\nENTITIES\n"
            "0\nLINE\n8\nPART\n10\n0\n20\n0\n11\n10\n21\n0\n"
            "0\nLINE\n8\nPART\n62\n3\n6\nCENTER2\n370\n25\n48\n0.5\n10\n0\n20\n1\n11\n10\n21\n1\n"
            "0\nLINE\n8\nPART\n420\n255\n10\n0\n20\n2\n11\n10\n21\n2\n"
            "0\nINSERT\n8\nCENTRE\n62\n4\n2\nB\n10\n0\n20\n5\n"
            "0\nLINE\n8\nFROZEN\n10\n0\n20\n9\n11\n1\n21\n9\n"
            "0\nENDSEC\n0\nEOF\n";
        Document d;
        const DxfImportResult r = importDxf(data, d);
        QVERIFY2(r.ok, r.error.c_str());
        const StyleTables& t = d.styles();
        QCOMPARE(t.ltscale(), 2.5);
        QCOMPARE(QString::fromStdString(t.currentLayer()), QString("PART"));
        QVERIFY(t.layer("PART")->color == CadColor::fromIndex(1));
        QCOMPARE(t.layer("PART")->lineweight, 50);
        QVERIFY(!t.layer("CENTRE")->on);                       // negative colour = off
        QVERIFY(t.layer("CENTRE")->color == CadColor::fromIndex(3));
        QVERIFY(t.layer("FROZEN")->frozen);
        QVERIFY(t.layer("LOCKED")->locked);
        QVERIFY(t.layer("LOCKED")->color == CadColor::fromRgb(0xFF8000)); // 420 true colour wins
        QVERIFY(t.linetype("CENTER2") && t.linetype("CENTER2")->pattern.size() == 4);
        const auto& e = d.entities();
        QCOMPARE(e.size(), std::size_t(5));
        QVERIFY(e[0]->color().kind == CadColor::Kind::ByLayer);
        QVERIFY(e[1]->color() == CadColor::fromIndex(3));
        QCOMPARE(QString::fromStdString(e[1]->linetype()), QString("CENTER2"));
        QCOMPARE(e[1]->lineweight(), 25);
        QCOMPARE(e[1]->ltscale(), 0.5);
        QVERIFY(e[2]->color() == CadColor::fromRgb(0x0000FF));
        // ByBlock line inside the INSERT takes the insert's colour (4) and the block layer-0 rule.
        QCOMPARE(QString::fromStdString(e[3]->layer()), QString("CENTRE"));
        QVERIFY(e[3]->color() == CadColor::fromIndex(4));
        QVERIFY(!d.isVisible(*e[4])); // on a frozen layer
        bool warned = false;
        for (auto& w : r.warnings) warned |= w.find("hidden") != std::string::npos;
        QVERIFY(warned);
    }
};

QTEST_GUILESS_MAIN(TestLayers)
#include "test_layers.moc"
