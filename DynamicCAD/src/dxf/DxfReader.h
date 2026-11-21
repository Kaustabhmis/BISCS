// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

#include <QByteArray>
#include <QString>

#include <map>
#include <string>
#include <vector>

namespace dyncad {

// Result of a DXF import, including an honest account of everything that
// could not be imported. Nothing is dropped silently.
struct DxfImportResult {
    bool ok = false;
    std::string error;

    std::string acadVersion;        // $ACADVER, e.g. "AC1024"
    std::string units = "mm";       // from $INSUNITS
    bool unitsAssumed = false;      // true if the file did not specify units
    std::size_t imported = 0;       // entities added to the drawing
    std::size_t layerCount = 0;
    std::size_t blockInsertsExpanded = 0;
    std::size_t paperSpaceSkipped = 0;
    std::map<std::string, std::size_t> unsupported; // DXF entity type -> count
    std::vector<std::string> warnings;

    std::size_t unsupportedTotal() const;
};

// Imports an ASCII DXF (R12 ... R2018) into doc, replacing its content.
// Supported: LINE, CIRCLE, ARC, LWPOLYLINE, POLYLINE (2D, incl. bulges),
// POINT, INSERT (blocks expanded, incl. nested, scaled, rotated, mirrored and
// MINSERT arrays), layers, units, OCS extrusion (0,0,±1). Model space only.
// On failure the document is left unchanged.
DxfImportResult importDxf(const QByteArray& data, Document& doc);
DxfImportResult importDxfFile(const QString& path, Document& doc);

// Human-readable AutoCAD release for an $ACADVER code.
std::string describeAcadVersion(const std::string& acadVer);

} // namespace dyncad
