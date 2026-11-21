// DYNAMIC CAD - autosave, crash recovery and recent files.
#include "entities/LineEntity.h"
#include "fileio/AutoSave.h"
#include "fileio/DynFormat.h"
#include "ui/MainWindow.h"

#include <QSettings>
#include <QSysInfo>
#include <QTemporaryDir>
#include <QtTest>

using namespace dyncad;

class TestRecovery : public QObject {
    Q_OBJECT
    QTemporaryDir dir_;

private slots:
    void initTestCase() {
        QCoreApplication::setOrganizationName("DynamicEngineersTest");
        QCoreApplication::setApplicationName("DynamicCAD-test-recovery");
        QSettings().clear();
        qputenv("DYNCAD_AUTOSAVE_DIR", dir_.filePath("autosave").toUtf8());
    }

    void autoSaverOrphans() {
        QTemporaryDir d;
        Document doc;
        doc.addWithUndo({std::make_shared<LineEntity>(Vec2{0, 0}, Vec2{1, 1})}, "l");
        QString file;
        {
            AutoSaver live(d.path());
            QVERIFY(live.save(doc, "C:/drawings/a.dyn"));
            QVERIFY(live.hasSave());
            file = live.sessionFile();
            AutoSaver other(d.path());
            QVERIFY(other.orphans().empty()); // the first session is still running (lock held)
        }   // session ends without discard() = abnormal end
        AutoSaver next(d.path());
        const auto o = next.orphans();
        QCOMPARE(o.size(), std::size_t(1));
        QCOMPARE(o[0].file, file);
        QCOMPARE(o[0].original, QString("C:/drawings/a.dyn"));
        Document back;
        QVERIFY(loadDynFile(back, o[0].file).ok);
        QCOMPARE(back.entityCount(), std::size_t(1));
        AutoSaver::removeOrphan(o[0]);
        QVERIFY(next.orphans().empty());
        // discard() after a normal save leaves nothing behind.
        QVERIFY(next.save(doc, ""));
        next.discard();
        QVERIFY(!next.hasSave());
    }

    void staleLockFromKilledProcess() {
        // A killed process leaves its lock file behind; the PID no longer exists.
        QTemporaryDir d;
        Document doc;
        {
            AutoSaver crashed(d.path());
            QVERIFY(crashed.save(doc, "x.dyn"));
        }
        const QString dyn = QDir(d.path()).entryList({"*.dyn"}).first();
        const QString lock = QDir(d.path()).filePath(dyn.left(dyn.size() - 4) + ".lock");
        // PID 999999 is not running (and is never a valid Windows PID: those are multiples of 4).
        QFile f(lock);
        QVERIFY(f.open(QIODevice::WriteOnly));
        f.write(QByteArray("999999") + "\nDynamicCAD\n" + QSysInfo::machineHostName().toUtf8() + "\n");
        f.close();
        AutoSaver next(d.path());
        QCOMPARE(next.orphans().size(), std::size_t(1));
    }

    void autosaveAndRecoverInMainWindow() {
        const QString drawing = dir_.filePath("plate.dyn");
        {
            MainWindow w;
            w.executeCommandText("LINE");
            w.executeCommandText("0,0");
            w.executeCommandText("100,0");
            w.executeCommandText("");
            QVERIFY(w.saveToFile(drawing));
            QVERIFY(!w.autosaveNow());           // saved: nothing to autosave
            w.executeCommandText("CIRCLE");
            w.executeCommandText("50,50");
            w.executeCommandText("10");
            QVERIFY(w.document().isModified());
            QVERIFY(w.autosaveNow());
            QVERIFY(w.autoSaver().hasSave());
            QVERIFY(!w.autosaveNow());           // no change since the last autosave
            w.document().markSaved();            // let the window go without a save prompt (simulated crash)
        }
        // New session finds the orphan and recovers it.
        MainWindow w2;
        QCOMPARE(w2.checkRecovery(false), 1);
        QCOMPARE(w2.document().entityCount(), std::size_t(2));
        QVERIFY(w2.document().isModified());     // must be saved explicitly
        QCOMPARE(w2.currentFile(), QFileInfo(drawing).absoluteFilePath());
        QVERIFY(w2.autoSaver().hasSave());       // already protected again
        QVERIFY(w2.save());
        QVERIFY(!w2.autoSaver().hasSave());      // save removes the autosave
        Document check;
        QVERIFY(loadDynFile(check, drawing).ok);
        QCOMPARE(check.entityCount(), std::size_t(2));
        QCOMPARE(w2.checkRecovery(false), 0);
    }

    void recentFiles() {
        MainWindow w;
        const QStringList l = w.recentFiles();
        QVERIFY(!l.isEmpty());
        QCOMPARE(l.first(), QFileInfo(dir_.filePath("plate.dyn")).absoluteFilePath());
        QCOMPARE(l.count(l.first()), 1);
    }

    void saveTimeCommand() {
        MainWindow w;
        w.executeCommandText("SAVETIME 0");
        QCOMPARE(QSettings().value("autosave/minutes").toInt(), 0);
        w.executeCommandText("SAVETIME 10");
        QCOMPARE(QSettings().value("autosave/minutes").toInt(), 10);
        w.executeCommandText("SAVETIME -3"); // rejected
        QCOMPARE(QSettings().value("autosave/minutes").toInt(), 10);
    }

    void cleanupTestCase() { QSettings().clear(); }
};

QTEST_MAIN(TestRecovery)
#include "test_recovery.moc"
