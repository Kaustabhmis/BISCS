// DYNAMIC CAD - DXF export (AutoCAD 2000) and round trip through the DXF reader.
#include "commands/CommandProcessor.h"
#include "commands/SheetCommands.h"
#include "dxf/DxfReader.h"
#include "dxf/DxfWriter.h"
#include "entities/Annotation.h"
#include "entities/ArcEntity.h"
#include "entities/BlockEntities.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/HatchEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "entities/XLineEntity.h"

#include <QTemporaryDir>
#include <QtTest>

#include <set>

using namespace dyncad;

namespace {

// A drawing with every object type, styles and a block.
void buildSample(Document& doc) {
    StyleTables t = doc.styles();
    Layer steel{"STEEL"};
    steel.color = CadColor::fromIndex(1);
    steel.lineweight = 50;
    Layer hidden{"HIDDEN LINES"};
    hidden.linetype = "DASHED";
    hidden.on = false;
    Layer rgb{"RGB"};
    rgb.color = CadColor::fromRgb(0x336699);
    rgb.locked = true;
    rgb.plot = false;
    QVERIFY(t.addLayer(steel) && t.addLayer(hidden) && t.addLayer(rgb));
    t.setLtscale(2.5);
    doc.setStylesWithUndo(t, "layers");

    std::vector<EntityPtr> v;
    auto add = [&](Entity* e, const char* layer = "0") { e->setLayer(layer); v.push_back(EntityPtr(e)); return e; };
    add(new LineEntity({0, 0}, {100.125, 50.5}), "STEEL");
    auto* c = add(new CircleEntity({10, 20}, 7.25));
    c->setColor(CadColor::fromRgb(0xF4B400));
    c->setLineweight(35);
    add(new ArcEntity({50, 50}, 20, 30, 300), "STEEL");
    add(new PointEntity({-5, -5}));
    auto* pl = add(new PolylineEntity({{0, 0}, {10, 0}, {10, 10}, {0, 10}}, {0, 0.5, 0, -1}, true), "HIDDEN LINES");
    pl->setLinetype("CENTER");
    pl->setLtscale(0.5);
    auto* wide = new PolylineEntity({{20, 0}, {30, 5}}, false);
    wide->setWidth(1.5);
    add(wide);
    EllipseGeom eg;
    eg.center = {200, 100};
    eg.major = {30, 10};
    eg.ratio = 0.4;
    eg.startParam = 0.5;
    eg.endParam = 4.0;
    add(new EllipseEntity(eg));
    add(new SplineEntity(geom::clampedUniformSpline({{0, 0}, {10, 20}, {30, -10}, {50, 5}, {60, 0}})));
    add(new XLineEntity({0, 0}, {1, 1}, false));
    add(new XLineEntity({5, 5}, {0, 2}, true));
    add(new TextEntity({0, -20}, "Flange \xC3\x98" "150 \xC2\xB1" "0.5", 3.5, 15, TextJustify::Center));
    auto* mt = add(new TextEntity({0, -40}, "Line one\nLine two {braces} back\\slash \xE2\x86\x92 arrow", 2.5, 0, TextJustify::TopLeft));
    static_cast<TextEntity*>(mt)->setWrapWidth(80);
    add(new DimensionEntity(DimKind::Linear, {0, 0}, {100, 0}, {50, -15}, 0));
    add(new DimensionEntity(DimKind::Aligned, {0, 0}, {30, 40}, {-10, 30}));
    add(new DimensionEntity(DimKind::Radius, {10, 20}, {17.25, 20}, {25, 25}));
    add(new DimensionEntity(DimKind::Diameter, {10, 20}, {10, 27.25}, {0, 35}));
    auto* ang = new DimensionEntity(DimKind::Angular, {0, 0}, {50, 0}, {30, 20});
    ang->setC({0, 40});
    add(ang);
    add(new LeaderEntity({{100, 100}, {120, 110}, {140, 110}}, "NOTE A"));
    add(new HatchEntity({HatchLoop{{{300, 0}, {340, 0}, {340, 30}, {300, 30}}, {0, 0, 0, 0}},
                         HatchLoop{{{310, 10}, {320, 10}, {320, 20}, {310, 20}}, {0, 0, 0, 0}}},
                        makeHatchPattern("ANSI31", 2, 0)), "STEEL");
    auto* solid = add(new HatchEntity({HatchLoop{{{400, 0}, {420, 0}, {420, 20}}, {0, 0.3, 0}}}, makeHatchPattern("SOLID", 1, 0)));
    solid->setColor(CadColor::fromIndex(3));
    doc.addWithUndo(v, "sample");
    // Block with a nested block, inserted scaled and rotated.
    auto inner = std::make_shared<BlockDef>();
    inner->name = "BOLT";
    inner->entities = {std::make_shared<CircleEntity>(Vec2{0, 0}, 3)};
    auto outer = std::make_shared<BlockDef>();
    outer->name = "PLATE WITH BOLT";
    auto r = std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {40, 0}, {40, 20}, {0, 20}}, true);
    r->setLayer("0");
    outer->entities = {r, std::make_shared<InsertEntity>(inner, Vec2{20, 10})};
    doc.defineBlockWithUndo(outer, {}, {std::make_shared<InsertEntity>(outer, Vec2{500, 500}, 2, 2, 30)});
}

std::vector<std::pair<int, std::string>> groups(const QByteArray& data) {
    std::vector<std::pair<int, std::string>> g;
    const QList<QByteArray> lines = data.split('\n');
    for (int i = 0; i + 1 < lines.size(); i += 2) g.push_back({lines[i].trimmed().toInt(), lines[i + 1].toStdString()});
    return g;
}

} // namespace

class TestDxfExport : public QObject {
    Q_OBJECT
private slots:
    void structureAndHandles() {
        Document doc;
        buildSample(doc);
        DxfExportResult r;
        const QByteArray data = exportDxf(doc, &r);
        QVERIFY(r.ok);
        { QFile out("dxf-export-sample.dxf"); if (out.open(QIODevice::WriteOnly)) out.write(data); } // for external validation
        QCOMPARE(r.entities, doc.entityCount());
        QCOMPARE(r.blocks, std::size_t(2));
        const auto g = groups(data);
        QVERIFY(g.size() > 500);
        QCOMPARE(g.back(), (std::pair<int, std::string>{0, "EOF"}));
        // Sections in order.
        std::vector<std::string> sections;
        for (std::size_t i = 0; i + 1 < g.size(); ++i)
            if (g[i] == std::pair<int, std::string>{0, "SECTION"}) sections.push_back(g[i + 1].second);
        QCOMPARE(sections, (std::vector<std::string>{"HEADER", "CLASSES", "TABLES", "BLOCKS", "ENTITIES", "OBJECTS"}));
        // AC1015, unique handles, all below $HANDSEED, every owner (330) is an existing handle or 0.
        std::set<unsigned long long> handles;
        unsigned long long seed = 0;
        bool acad = false;
        for (std::size_t i = 0; i + 1 < g.size(); ++i) {
            if (g[i].first == 9 && g[i].second == "$ACADVER") acad = g[i + 1].second == "AC1015";
            if (g[i].first == 9 && g[i].second == "$HANDSEED") seed = std::stoull(g[i + 1].second, nullptr, 16);
            if (g[i].first == 5 || g[i].first == 105) {
                if (i > 0 && g[i - 1].first == 9) continue; // $HANDSEED value
                const auto h = std::stoull(g[i].second, nullptr, 16);
                QVERIFY2(handles.insert(h).second, g[i].second.c_str());
            }
        }
        QVERIFY(acad);
        QVERIFY(seed > *handles.rbegin());
        for (const auto& [code, val] : g)
            if (code == 330 || code == 340 || code == 350 || code == 390) {
                const auto h = std::stoull(val, nullptr, 16);
                QVERIFY2(h == 0 || handles.count(h), (std::to_string(code) + " -> " + val).c_str());
            }
        // Latin-1 characters as ANSI_1252 bytes; no UTF-8 multi-byte sequences in an R2000 file.
        QVERIFY(data.contains("Flange \xD8" "150 \xB1" "0.5"));
        QVERIFY(!data.contains("\xC3"));
    }

    void roundTripThroughReader() {
        Document doc;
        buildSample(doc);
        const QByteArray data = exportDxf(doc);
        Document back;
        const DxfImportResult r = importDxf(data, back);
        QVERIFY2(r.ok, r.error.c_str());
        QCOMPARE(r.acadVersion, std::string("AC1015"));
        QCOMPARE(r.units, std::string("mm"));
        QVERIFY(!r.unitsAssumed);
        QCOMPARE(r.unsupportedTotal(), std::size_t(0));
        QCOMPARE(back.styles().ltscale(), 2.5);
        // Layers with their properties.
        const Layer* steel = back.styles().layer("STEEL");
        QVERIFY(steel);
        QCOMPARE(steel->color, CadColor::fromIndex(1));
        QCOMPARE(steel->lineweight, 50);
        const Layer* hidden = back.styles().layer("HIDDEN LINES");
        QVERIFY(hidden && !hidden->on);
        QCOMPARE(upperName(hidden->linetype), std::string("DASHED"));
        const Layer* rgb = back.styles().layer("RGB");
        QVERIFY(rgb && rgb->locked && !rgb->plot);
        QCOMPARE(rgb->color, CadColor::fromRgb(0x336699));
        // Count by type: blocks are expanded by the importer (outer polyline + nested circle),
        // the leader text comes back as a separate text, the filled polyline as hatch + polyline.
        std::map<EntityType, int> n;
        for (const auto& e : back.entities()) ++n[e->type()];
        QCOMPARE(n[EntityType::Line], 1);
        QCOMPARE(n[EntityType::Circle], 2);       // circle + bolt from the nested block
        QCOMPARE(n[EntityType::Arc], 1);
        QCOMPARE(n[EntityType::Point], 1);
        QCOMPARE(n[EntityType::Polyline], 3);     // closed bulged + wide + plate outline
        QCOMPARE(n[EntityType::Ellipse], 1);
        QCOMPARE(n[EntityType::Spline], 1);
        QCOMPARE(n[EntityType::XLine], 2);
        QCOMPARE(n[EntityType::Text], 3);         // text, mtext, leader note
        QCOMPARE(n[EntityType::Dimension], 5);
        QCOMPARE(n[EntityType::Leader], 1);
        QCOMPARE(n[EntityType::Hatch], 2);
        // Geometry is exact (shortest round-trip number formatting).
        for (const auto& e : back.entities()) {
            switch (e->type()) {
            case EntityType::Line: {
                const auto& l = static_cast<const LineEntity&>(*e);
                QCOMPARE(l.end(), Vec2(100.125, 50.5));
                QCOMPARE(l.layer(), std::string("STEEL"));
                break;
            }
            case EntityType::Arc: {
                const auto& a = static_cast<const ArcEntity&>(*e);
                QCOMPARE(a.startDeg(), 30.0);
                QCOMPARE(a.endDeg(), 300.0);
                break;
            }
            case EntityType::Ellipse: {
                const auto& g = static_cast<const EllipseEntity&>(*e).geom();
                QCOMPARE(g.major, Vec2(30, 10));
                QCOMPARE(g.ratio, 0.4);
                QCOMPARE(g.startParam, 0.5);
                QCOMPARE(g.endParam, 4.0);
                break;
            }
            case EntityType::Spline: {
                const auto& c = static_cast<const SplineEntity&>(*e).curve();
                const NurbsCurve ref = geom::clampedUniformSpline({{0, 0}, {10, 20}, {30, -10}, {50, 5}, {60, 0}});
                QCOMPARE(c.knots, ref.knots);
                QCOMPARE(c.ctrl.size(), ref.ctrl.size());
                for (std::size_t i = 0; i < c.ctrl.size(); ++i) QCOMPARE(c.ctrl[i], ref.ctrl[i]);
                break;
            }
            case EntityType::Circle: {
                const auto& c = static_cast<const CircleEntity&>(*e);
                if (c.radius() == 7.25) {
                    QCOMPARE(c.color(), CadColor::fromRgb(0xF4B400));
                    QCOMPARE(c.lineweight(), 35);
                } else {
                    // Nested bolt: 500,500 + rot30(scale2 * (20,10)).
                    QCOMPARE(c.radius(), 6.0);
                    const double r = degToRad(30.0);
                    const Vec2 p{500 + 2 * (20 * std::cos(r) - 10 * std::sin(r)), 500 + 2 * (20 * std::sin(r) + 10 * std::cos(r))};
                    QVERIFY(nearlyEqual(c.center(), p, 1e-9));
                }
                break;
            }
            case EntityType::Polyline: {
                const auto& p = static_cast<const PolylineEntity&>(*e);
                if (p.layer() == "HIDDEN LINES") {
                    QCOMPARE(p.bulges(), (std::vector<double>{0, 0.5, 0, -1}));
                    QVERIFY(p.isClosed());
                    QCOMPARE(upperName(p.linetype()), std::string("CENTER"));
                    QCOMPARE(p.ltscale(), 0.5);
                }
                if (p.vertices().size() == 2) QCOMPARE(p.width(), 1.5);
                break;
            }
            case EntityType::Text: {
                const auto& t = static_cast<const TextEntity&>(*e);
                if (t.justify() == TextJustify::Center) {
                    QCOMPARE(t.text(), std::string("Flange \xC3\x98" "150 \xC2\xB1" "0.5"));
                    QCOMPARE(t.rotationDeg(), 15.0);
                    QCOMPARE(t.insert(), Vec2(0, -20));
                }
                if (t.justify() == TextJustify::TopLeft) {
                    QCOMPARE(t.text(), std::string("Line one\nLine two {braces} back\\slash \xE2\x86\x92 arrow"));
                    QCOMPARE(t.wrapWidth(), 80.0);
                }
                break;
            }
            case EntityType::Dimension: {
                const auto& d = static_cast<const DimensionEntity&>(*e);
                if (d.kind() == DimKind::Linear) QCOMPARE(d.measurement(), 100.0);
                if (d.kind() == DimKind::Aligned) QCOMPARE(d.measurement(), 50.0);
                if (d.kind() == DimKind::Radius) QCOMPARE(d.measurement(), 7.25);
                if (d.kind() == DimKind::Diameter) QCOMPARE(d.measurement(), 14.5);
                if (d.kind() == DimKind::Angular) QVERIFY(std::abs(d.measurement() - 90.0) < 1e-9);
                break;
            }
            case EntityType::Hatch: {
                const auto& h = static_cast<const HatchEntity&>(*e);
                if (!h.pattern().solid) {
                    QCOMPARE(h.loops().size(), std::size_t(2));
                    QVERIFY(std::abs(h.area() - (1200 - 100)) < 1e-9);
                    QCOMPARE(h.pattern().name, std::string("ANSI31"));
                } else {
                    QCOMPARE(h.color(), CadColor::fromIndex(3));
                    QCOMPARE(h.loops()[0].bulges[1], 0.3);
                }
                break;
            }
            default: break;
            }
        }
    }

    void sheetExportsAndReimports() {
        Document doc;
        SelectionSet sel;
        CommandProcessor proc(doc, sel);
        registerCoreCommands(proc, doc);
        proc.submit("SHEET");
        proc.submit("DE");
        proc.submit("1:2");
        proc.submit("0,0");
        QTemporaryDir dir;
        const QString path = dir.filePath("sheet.dxf");
        const DxfExportResult r = exportDxfFile(doc, path);
        QFile::remove("dxf-export-sheet.dxf");
        QFile::copy(path, "dxf-export-sheet.dxf");
        QVERIFY2(r.ok, r.error.c_str());
        Document back;
        const DxfImportResult in = importDxfFile(path, back);
        QVERIFY2(in.ok, in.error.c_str());
        QCOMPARE(in.unsupportedTotal(), std::size_t(0));
        QVERIFY(back.entityCount() > 100); // frame block expanded on import
        const BoundingBox a = doc.extents(), b = back.extents();
        QVERIFY(nearlyEqual(a.min, b.min, 1e-6) && nearlyEqual(a.max, b.max, 1e-6));
    }

    void emptyDrawing() {
        Document doc;
        DxfExportResult r;
        const QByteArray data = exportDxf(doc, &r);
        QVERIFY(r.ok);
        Document back;
        QVERIFY(importDxf(data, back).ok);
        QCOMPARE(back.entityCount(), std::size_t(0));
    }
};

QTEST_MAIN(TestDxfExport)
#include "test_dxf_export.moc"
