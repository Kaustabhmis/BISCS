// DYNAMIC CAD - blocks (BLOCK/INSERT/EXPLODE/PURGE) and HATCH tests.
#include "commands/BlockHatchCommands.h"
#include "commands/CommandProcessor.h"
#include "dxf/DxfReader.h"
#include "entities/BlockEntities.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "fileio/DynFormat.h"
#include "snapping/SnapEngine.h"

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
    EntityId add(EntityPtr e) { doc.addWithUndo({e}, "add"); return e->id(); }
};
bool near(double a, double b, double e = 1e-9) { return std::abs(a - b) <= e; }
} // namespace

class TestBlocksHatch : public QObject {
    Q_OBJECT
private slots:
    void blockCreateInsertExplode() {
        Fx f;
        auto c = f.add(std::make_shared<CircleEntity>(Vec2{10, 10}, 5));
        auto l = f.add(std::make_shared<LineEntity>(Vec2{0, 10}, Vec2{20, 10}));
        f.sel.add(c);
        f.sel.add(l);
        f.type({"B", "BOLT HEAD", "10,10"});  // name with a space; pre-selection used
        QCOMPARE(f.doc.entityCount(), std::size_t(1));
        QVERIFY(f.doc.findBlock("bolt head"));
        const auto& ins = static_cast<const InsertEntity&>(*f.doc.entities()[0]);
        QCOMPARE(ins.position(), Vec2(10, 10));
        QVERIFY(nearlyEqual(ins.bounds().min, {0, 5}, 1e-12)); // looks exactly like before
        f.type({"U"});                                           // one undo restores the objects
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        QVERIFY(!f.doc.findBlock("BOLT HEAD"));
        f.type({"REDO"});
        // INSERT scaled and rotated.
        f.type({"I", "BOLT HEAD", "100,0", "2", "90"});
        QCOMPARE(f.doc.entityCount(), std::size_t(2));
        const auto& i2 = static_cast<const InsertEntity&>(*f.doc.entities()[1]);
        const auto& world = i2.worldEntities();
        QCOMPARE(world.size(), std::size_t(2));
        QCOMPARE(static_cast<const CircleEntity&>(*world[0]).radius(), 10.0);
        QVERIFY(nearlyEqual(static_cast<const LineEntity&>(*world[1]).start(), {100, -20}, 1e-12)); // rotated 90
        // Snaps reach into blocks: the circle's centre and the insertion point.
        SnapEngine se;
        auto s = se.find(f.doc, {100.5, 0.5}, 1, kDefaultSnapModes);
        QVERIFY(s && nearlyEqual(s->point, {100, 0}, 1e-12));
        // EXPLODE gives back separate objects at the same place.
        f.sel.add(f.doc.entities()[1]->id());
        f.type({"X"});
        QCOMPARE(f.doc.entityCount(), std::size_t(3));
        QCOMPARE(static_cast<const CircleEntity&>(*f.doc.entities()[2 - 1]).radius(), 10.0);
        // PURGE keeps the used block.
        f.type({"PURGE"});
        QVERIFY(f.doc.findBlock("BOLT HEAD"));
        f.type({"ERASE"});
    }

    void insertInheritanceAndTransform() {
        auto def = std::make_shared<BlockDef>();
        def->name = "B";
        auto onZero = std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{1, 0});
        onZero->setLayer("0");
        onZero->setColor(CadColor::byBlock());
        auto own = std::make_shared<CircleEntity>(Vec2{0, 0}, 1);
        own->setLayer("HOLES");
        def->entities = {onZero, own};
        InsertEntity ins(def, {5, 5}, 3, 1, 0);
        ins.setLayer("PART");
        ins.setColor(CadColor::fromIndex(2));
        const auto& w = ins.worldEntities();
        QCOMPARE(QString::fromStdString(w[0]->layer()), QString("PART")); // layer 0 -> insert layer
        QVERIFY(w[0]->color() == CadColor::fromIndex(2));                 // ByBlock -> insert colour
        QCOMPARE(QString::fromStdString(w[1]->layer()), QString("HOLES"));
        QVERIFY(w[1]->type() == EntityType::Ellipse);                      // circle in a 3x1 block
        // Properties change: the world cache follows.
        auto copy = ins.clone();
        copy->setColor(CadColor::fromIndex(5));
        QVERIFY(static_cast<InsertEntity&>(*copy).worldEntities()[0]->color() == CadColor::fromIndex(5));
        // Rotate + mirror an insert: decomposed back into position/rotation/scale.
        auto r = ins.transformed(Affine2D::rotationDeg(90));
        QCOMPARE(static_cast<const InsertEntity&>(*r).rotationDeg(), 90.0);
        QCOMPARE(static_cast<const InsertEntity&>(*r).position(), Vec2(-5, 5));
        auto m = ins.transformed(Affine2D::scaling(-1, 1));
        const auto& mi = static_cast<const InsertEntity&>(*m);
        QVERIFY(nearlyEqual(mi.worldEntities()[0]->bounds().min, {-8, 5}, 1e-12));
    }

    void hatchPatternsAndArea() {
        // 100 x 50 rectangle with a hole of r = 10.
        std::vector<HatchLoop> loops{{{{0, 0}, {100, 0}, {100, 50}, {0, 50}}, {0, 0, 0, 0}},
                                     {{{60, 25}, {40, 25}}, {1, 1}}};
        HatchEntity solid(loops, makeHatchPattern("SOLID", 1, 0));
        QVERIFY(near(solid.area(), 5000 - kPi * 100, 1e-9));
        QVERIFY(solid.contains({10, 10}));
        QVERIFY(!solid.contains({50, 25})); // in the hole (even-odd)
        QCOMPARE(solid.distanceTo({10, 10}), 0.0);
        HatchEntity lines({loops[0]}, makeHatchPattern("LINE", 10, 0)); // horizontal lines every 31.75
        const auto segs = lines.patternSegments();
        QVERIFY(!segs.empty());
        for (const auto& sgm : segs) {
            QVERIFY(near(sgm.first.y, sgm.second.y, 1e-9));             // horizontal
            QVERIFY(sgm.first.x >= -1e-9 && sgm.second.x <= 100 + 1e-9); // clipped to the boundary
            QVERIFY(near(std::remainder(sgm.first.y, 31.75), 0, 1e-9));
        }
        HatchEntity ansi({loops[0], loops[1]}, makeHatchPattern("ANSI31", 1, 0));
        for (const auto& sgm : ansi.patternSegments()) {
            const Vec2 mid = (sgm.first + sgm.second) * 0.5;
            QVERIFY(distance(mid, {50, 25}) >= 10 - 1e-6); // no hatch line inside the hole
        }
        bool trunc = false;
        HatchEntity dense({loops[0]}, makeHatchPattern("ANSI31", 0.001, 0));
        dense.patternSegments(1000, &trunc);
        QVERIFY(trunc); // safety limit for absurdly dense patterns
        auto moved = ansi.transformed(Affine2D::translation({10, 0}) * Affine2D::rotationDeg(30));
        QVERIFY(near(static_cast<const HatchEntity&>(*moved).area(), ansi.area(), 1e-6));
        QVERIFY(near(static_cast<const HatchEntity&>(*moved).pattern().families[0].angleDeg, 75, 1e-9));
    }

    void hatchCommand() {
        Fx f;
        f.add(std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {100, 0}, {100, 60}, {0, 60}}, true));
        f.add(std::make_shared<CircleEntity>(Vec2{30, 30}, 10));
        f.add(std::make_shared<CircleEntity>(Vec2{70, 30}, 10));
        f.add(std::make_shared<LineEntity>(Vec2{200, 0}, Vec2{300, 0})); // not closed: ignored
        f.type({"H", "P", "ANSI37", "S", "2", "50,30", ""});           // pick between the holes
        QCOMPARE(f.doc.entityCount(), std::size_t(5));
        const auto& h = static_cast<const HatchEntity&>(*f.doc.entities()[4]);
        QCOMPARE(h.loops().size(), std::size_t(3)); // outer + 2 islands
        QCOMPARE(QString::fromStdString(h.pattern().name), QString("ANSI37"));
        QVERIFY(near(h.area(), 6000 - 2 * kPi * 100, 1e-6));
        f.type({"H", "SOLID", "30,30", ""}); // inside a hole: the circle alone
        const auto& h2 = static_cast<const HatchEntity&>(*f.doc.entities()[5]);
        QCOMPARE(h2.loops().size(), std::size_t(1));
        QVERIFY(h2.pattern().solid);
        f.type({"H", "250,50"}); // nothing closed around this point
        QCOMPARE(f.doc.entityCount(), std::size_t(6));
        QVERIFY(f.msgs.back().find("No closed boundary") != std::string::npos);
        f.proc.cancel();
        HatchCommand::setDefaults("ANSI31", 1, 0);
    }

    void saveReloadAndClipboard() {
        Document d;
        auto inner = std::make_shared<BlockDef>();
        inner->name = "INNER";
        inner->entities = {std::make_shared<CircleEntity>(Vec2{0, 0}, 1)};
        auto outer = std::make_shared<BlockDef>();
        outer->name = "OUTER";
        outer->entities = {std::make_shared<InsertEntity>(inner, Vec2{5, 0}), std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{5, 0})};
        auto hatch = std::make_shared<HatchEntity>(std::vector<HatchLoop>{{{{0, 0}, {10, 0}, {10, 10}}, {0, 0.3, 0}}},
                                                   makeHatchPattern("ANSI32", 2, 15));
        d.addWithUndo({std::make_shared<InsertEntity>(outer, Vec2{100, 100}, 2, 2, 45), hatch}, "x");
        QCOMPARE(d.blocks().size(), std::size_t(1)); // OUTER registered on insertion (INNER is nested)
        const QByteArray data = serializeDyn(d);
        Document b;
        const FileResult r = deserializeDyn(data, b);
        QVERIFY2(r.ok, r.error.c_str());
        QVERIFY(r.warnings.empty());
        QCOMPARE(serializeDyn(b), data);
        const auto& bi = static_cast<const InsertEntity&>(*b.entities()[0]);
        QCOMPARE(bi.worldEntities().size(), std::size_t(2));
        QVERIFY(b.findBlock("INNER") && b.findBlock("OUTER"));
        // Clipboard carries block definitions to another drawing.
        const auto pasted = deserializeEntities(serializeEntities({d.entities()[0]}));
        QCOMPARE(pasted.size(), std::size_t(1));
        Document other;
        other.addWithUndo({pasted[0]}, "paste");
        QVERIFY(other.findBlock("OUTER"));
        // Circular block references are rejected without hanging.
        const QByteArray cyc = R"({"format":"DynamicCAD-Drawing","formatVersion":7,"blocks":[
            {"name":"A","entities":[{"type":"INSERT","block":"B","position":[0,0]}]},
            {"name":"B","entities":[{"type":"INSERT","block":"A","position":[0,0]}]}],
            "entities":[{"type":"INSERT","block":"A","position":[0,0]}]})";
        Document c;
        QVERIFY(deserializeDyn(cyc, c).ok);
    }

    void dxfHatchImport() {
        const QByteArray data =
            "0\nSECTION\n2\nENTITIES\n"
            "0\nHATCH\n8\n0\n10\n0\n20\n0\n2\nANSI31\n70\n0\n71\n0\n91\n2\n"
            "92\n2\n72\n1\n73\n1\n93\n4\n10\n0\n20\n0\n42\n0\n10\n100\n20\n0\n42\n0\n10\n100\n20\n50\n42\n0\n10\n0\n20\n50\n42\n0\n97\n0\n"
            "92\n1\n93\n4\n72\n1\n10\n40\n20\n20\n11\n60\n21\n20\n72\n1\n10\n60\n20\n20\n11\n60\n21\n30\n"
            "72\n2\n10\n55\n20\n30\n40\n5\n50\n0\n51\n180\n73\n1\n72\n1\n10\n50\n20\n30\n11\n40\n21\n20\n97\n0\n"
            "75\n0\n76\n1\n52\n0\n41\n1\n77\n0\n78\n1\n53\n45\n43\n0\n44\n0\n45\n-2.245\n46\n2.245\n79\n0\n98\n0\n"
            "0\nHATCH\n8\n0\n2\nSOLID\n70\n1\n91\n1\n92\n2\n72\n0\n73\n1\n93\n3\n10\n0\n20\n0\n10\n10\n20\n0\n10\n0\n20\n10\n97\n0\n"
            "0\nENDSEC\n0\nEOF\n";
        Document d;
        const DxfImportResult r = importDxf(data, d);
        QVERIFY2(r.ok, r.error.c_str());
        QCOMPARE(d.entityCount(), std::size_t(2));
        const auto& h = static_cast<const HatchEntity&>(*d.entities()[0]);
        QCOMPARE(h.loops().size(), std::size_t(2));
        QCOMPARE(h.pattern().families.size(), std::size_t(1));
        QVERIFY(near(h.pattern().families[0].angleDeg, 45));
        QVERIFY(h.loops()[1].bulges[2] != 0); // the arc edge became a bulge
        const auto& s = static_cast<const HatchEntity&>(*d.entities()[1]);
        QVERIFY(s.pattern().solid);
        QVERIFY(near(s.area(), 50));
    }
};

QTEST_GUILESS_MAIN(TestBlocksHatch)
#include "test_blocks_hatch.moc"
