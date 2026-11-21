// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

#include <QDateTime>
#include <QString>

#include <memory>
#include <vector>

class QLockFile;

namespace dyncad {

// Automatic background saves and crash recovery.
// Each running session owns <dir>/<id>.dyn (+ .json with the original file
// name) and holds <dir>/<id>.lock. Files whose lock is not held by a live
// process belong to a session that ended abnormally and can be recovered.
class AutoSaver {
public:
    explicit AutoSaver(QString dir);
    ~AutoSaver();

    const QString& directory() const { return dir_; }
    QString sessionFile() const;
    // Writes the drawing (atomic replace). Returns false with an error message on failure.
    bool save(const Document& doc, const QString& originalPath, QString* error = nullptr);
    // Removes this session's autosave (after a successful save / clean exit).
    void discard();
    bool hasSave() const;

    struct Orphan {
        QString file;       // autosaved drawing
        QString original;   // drawing it belongs to (may be empty: never saved)
        QDateTime savedAt;
    };
    // Autosaves left behind by sessions that are no longer running.
    std::vector<Orphan> orphans() const;
    // Deletes an orphan's files.
    static void removeOrphan(const Orphan& o);

private:
    QString dir_;
    QString id_;
    std::unique_ptr<QLockFile> lock_;
};

} // namespace dyncad
