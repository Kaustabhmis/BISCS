// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "fileio/AutoSave.h"

#include "fileio/DynFormat.h"

#include <QDir>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLockFile>
#include <QSaveFile>
#include <QUuid>

namespace dyncad {

AutoSaver::AutoSaver(QString dir) : dir_(std::move(dir)) {
    QDir().mkpath(dir_);
    id_ = QUuid::createUuid().toString(QUuid::WithoutBraces);
    lock_ = std::make_unique<QLockFile>(QDir(dir_).filePath(id_ + ".lock"));
    lock_->setStaleLockTime(0); // a lock is stale only when its process is gone
    lock_->tryLock(0);
}

AutoSaver::~AutoSaver() {
    if (lock_) lock_->unlock();
}

QString AutoSaver::sessionFile() const { return QDir(dir_).filePath(id_ + ".dyn"); }

bool AutoSaver::save(const Document& doc, const QString& originalPath, QString* error) {
    const FileResult r = saveDynFile(doc, sessionFile());
    if (!r.ok) {
        if (error) *error = QString::fromStdString(r.error);
        return false;
    }
    QSaveFile meta(QDir(dir_).filePath(id_ + ".json"));
    if (meta.open(QIODevice::WriteOnly)) {
        QJsonObject o;
        o["original"] = originalPath;
        o["savedAt"] = QDateTime::currentDateTimeUtc().toString(Qt::ISODate);
        meta.write(QJsonDocument(o).toJson());
        meta.commit();
    }
    return true;
}

void AutoSaver::discard() {
    QFile::remove(sessionFile());
    QFile::remove(QDir(dir_).filePath(id_ + ".json"));
}

bool AutoSaver::hasSave() const { return QFile::exists(sessionFile()); }

std::vector<AutoSaver::Orphan> AutoSaver::orphans() const {
    std::vector<Orphan> out;
    const QDir d(dir_);
    for (const QString& f : d.entryList({"*.dyn"}, QDir::Files, QDir::Time)) {
        const QString id = f.left(f.size() - 4);
        if (id == id_) continue;
        QLockFile probe(d.filePath(id + ".lock"));
        probe.setStaleLockTime(0);
        if (!probe.tryLock(0)) {
            // Held by a live process, unless it is a stale lock left by a crash.
            if (probe.error() != QLockFile::LockFailedError) continue;
            if (!probe.removeStaleLockFile() || !probe.tryLock(0)) continue;
        }
        probe.unlock();
        Orphan o;
        o.file = d.filePath(f);
        o.savedAt = QFileInfo(o.file).lastModified();
        QFile meta(d.filePath(id + ".json"));
        if (meta.open(QIODevice::ReadOnly)) {
            const QJsonObject j = QJsonDocument::fromJson(meta.readAll()).object();
            o.original = j.value("original").toString();
            const QDateTime t = QDateTime::fromString(j.value("savedAt").toString(), Qt::ISODate);
            if (t.isValid()) o.savedAt = t.toLocalTime();
        }
        out.push_back(o);
    }
    return out;
}

void AutoSaver::removeOrphan(const Orphan& o) {
    const QFileInfo fi(o.file);
    const QString base = fi.absolutePath() + "/" + fi.completeBaseName();
    QFile::remove(o.file);
    QFile::remove(base + ".json");
    QFile::remove(base + ".lock");
}

} // namespace dyncad
