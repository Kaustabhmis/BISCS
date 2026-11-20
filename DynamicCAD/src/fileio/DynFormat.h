// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

#include <QByteArray>
#include <QString>

#include <string>
#include <vector>

namespace dyncad {

// Native DYNAMIC CAD drawing format (*.dyn): UTF-8 JSON, documented in
// docs/FILE_FORMAT.md. Doubles are written with shortest round-trip
// precision, so save -> open preserves coordinates bit-for-bit.
struct FileResult {
    bool ok = false;
    std::string error;
    std::vector<std::string> warnings;
};

inline constexpr int kDynFormatVersion = 1;

QByteArray serializeDyn(const Document& doc);
// On success replaces the document content; on failure leaves it untouched.
FileResult deserializeDyn(const QByteArray& data, Document& doc);

// Atomic save (writes a temporary file, then renames) so a crash during
// saving cannot destroy the previous file.
FileResult saveDynFile(const Document& doc, const QString& path);
FileResult loadDynFile(Document& doc, const QString& path);

} // namespace dyncad
