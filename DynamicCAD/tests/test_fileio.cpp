// DYNAMIC CAD - native .dyn format tests (round trip, precision, invalid files).
#include "entities/CircleEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "fileio/DynFormat.h"

#include <QTemporaryDir>
#include <QtTest>

#include <random>

using namespace dyncad;

class TestFileIO : public QObject {
    Q_OBJECT
private slots:
    void roundTripIsBitExact() {
        Document a;
        std::mt19937_64 rng(42);
        std::uniform_real_distribution<double> d(-1e7, 1e7);
        std::vector<EntityPtr> ents;
        for (int i = 0; i < 300; ++i) {
            ents.push_back(std::make_shared<LineEntity>(Vec2{d(rng), d(rng)}, Vec2{d(rng), d(rng)}));
            ents.push_back(std::make_shared<CircleEntity>(Vec2{d(rng), d(rng)}, std::abs(d(rng)) + 1e-6));
        }
        ents.push_back(std::make_shared<LineEntity>(Vec2{0.1, 0.2}, Vec2{1.0 / 3.0, 2.0 / 3.0}));
        auto pl = std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {10, 0}, {10, 5}}, false);
        pl->setLayer("OUTLINE");
        ents.push_back(pl);
        auto wide = std::make_shared<PolylineEntity>(std::vector<Vec2>{{0, 0}, {1, 0}}, false);
        wide->setWidth(0.35);
        ents.push_back(wide);
        a.addWithUndo(ents, "x");

        QTemporaryDir dir;
        const QString path = dir.filePath("roundtrip.dyn");
        QVERIFY(saveDynFile(a, path).ok);

        Document b;
        const FileResult r = loadDynFile(b, path);
        QVERIFY2(r.ok, r.error.c_str());
        QVERIFY(r.warnings.empty());
        QVERIFY(!b.isModified());
        QCOMPARE(b.entityCount(), a.entityCount());
        for (std::size_t i = 0; i < a.entityCount(); ++i) {
            const Entity& x = *a.entities()[i];
            const Entity& y = *b.entities()[i];
            QCOMPARE(int(x.type()), int(y.type()));
            QCOMPARE(x.layer(), y.layer());
            // Exact equality: no precision loss allowed.
            QCOMPARE(x.bounds().min, y.bounds().min);
            QCOMPARE(x.bounds().max, y.bounds().max);
            if (x.type() == EntityType::Circle)
                QCOMPARE(static_cast<const CircleEntity&>(x).radius(), static_cast<const CircleEntity&>(y).radius());
        }
        // Saving the loaded document produces identical bytes.
        QCOMPARE(serializeDyn(b), serializeDyn(a));
    }

    void invalidFilesAreRejectedSafely() {
        Document doc;
        doc.addWithUndo({std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{1, 1})}, "keep");
        const std::vector<QByteArray> bad = {
            "", "not json", "[]", "{}", "{\"format\":\"Other\",\"formatVersion\":1,\"entities\":[]}",
            "{\"format\":\"DynamicCAD-Drawing\",\"formatVersion\":99,\"entities\":[]}",
            "{\"format\":\"DynamicCAD-Drawing\",\"formatVersion\":1}",
            QByteArray("{\"format\":\"DynamicCAD-Drawing\",\"formatVersion\":1,\"entities\":[", 60),
        };
        for (const auto& data : bad) {
            const FileResult r = deserializeDyn(data, doc);
            QVERIFY2(!r.ok, data.constData());
            QVERIFY(!r.error.empty());
            QCOMPARE(doc.entityCount(), std::size_t(1)); // untouched on failure
        }
        Document d2;
        QVERIFY(!loadDynFile(d2, "/nonexistent/dir/file.dyn").ok);
    }

    void badEntitiesSkippedWithWarnings() {
        const QByteArray data = R"({"format":"DynamicCAD-Drawing","formatVersion":1,"units":"mm","entities":[
            {"type":"LINE","start":[0,0],"end":[10,0]},
            {"type":"CIRCLE","center":[0,0],"radius":-5},
            {"type":"SPLINE","points":[]},
            {"type":"LINE","start":[0,"x"],"end":[1,1]},
            {"type":"POLYLINE","vertices":[[0,0]]},
            42,
            {"type":"CIRCLE","center":[5,5],"radius":2}
        ]})";
        Document doc;
        const FileResult r = deserializeDyn(data, doc);
        QVERIFY(r.ok);
        QCOMPARE(doc.entityCount(), std::size_t(2));
        QCOMPARE(r.warnings.size(), std::size_t(5));
        QVERIFY(QString::fromStdString(r.warnings[1]).contains("SPLINE"));
    }

    void newEntityTypesValidated() {
        const QByteArray data = R"({"format":"DynamicCAD-Drawing","formatVersion":3,"units":"mm","entities":[
            {"type":"ELLIPSE","center":[0,0],"majorAxis":[10,0],"ratio":0.5},
            {"type":"ELLIPSE","center":[0,0],"majorAxis":[10,0],"ratio":1.5},
            {"type":"ELLIPSE","center":[0,0],"majorAxis":[0,0],"ratio":0.5},
            {"type":"SPLINE","degree":3,"knots":[0,0,0,0,1,1,1,1],"controlPoints":[[0,0],[1,1],[2,0],[3,1]]},
            {"type":"SPLINE","degree":3,"knots":[0,0,1],"controlPoints":[[0,0],[1,1],[2,0],[3,1]]},
            {"type":"SPLINE","degree":2,"knots":[0,0,0,1,1,1],"controlPoints":[[0,0],[1,1],[2,0]],"weights":[1,-1,1]},
            {"type":"POLYLINE","closed":true,"filled":true,"vertices":[[0,0],[1,0],[0,1]]}
        ]})";
        Document doc;
        const FileResult r = deserializeDyn(data, doc);
        QVERIFY(r.ok);
        QCOMPARE(doc.entityCount(), std::size_t(3));
        QCOMPARE(r.warnings.size(), std::size_t(4));
        QVERIFY(QString::fromStdString(r.warnings[2]).contains("knot"));
        QVERIFY(QString::fromStdString(r.warnings[3]).contains("weight"));
        // Version 1 files from v0.1.0 still open.
        Document v1;
        QVERIFY(deserializeDyn(R"({"format":"DynamicCAD-Drawing","formatVersion":1,"entities":[]})", v1).ok);
    }

    void sampleDrawingsLoad() {
        QDir dir(DYNCAD_SAMPLES_DIR);
        const QStringList files = dir.entryList({"*.dyn"});
        QVERIFY(!files.isEmpty());
        for (const QString& f : files) {
            Document doc;
            const FileResult r = loadDynFile(doc, dir.filePath(f));
            QVERIFY2(r.ok, qPrintable(f + ": " + QString::fromStdString(r.error)));
            QVERIFY2(r.warnings.empty(), qPrintable(f));
            QVERIFY(doc.entityCount() > 0);
        }
    }
};

QTEST_GUILESS_MAIN(TestFileIO)
#include "test_fileio.moc"
