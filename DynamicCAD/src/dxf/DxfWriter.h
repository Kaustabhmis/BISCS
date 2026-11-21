// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

#include <QByteArray>
#include <QString>

#include <map>
#include <string>

namespace dyncad {

struct DxfExportResult {
    bool ok = false;
    std::string error;
    std::size_t entities = 0;                   // drawing objects written (model space)
    std::size_t blocks = 0;                     // block definitions written
    std::map<std::string, std::size_t> notes;   // conversions worth knowing about -> count
};

// Writes an ASCII DXF, AutoCAD 2000 format (AC1015), with layers, linetypes,
// lineweights, true colours, blocks and all DYNAMIC CAD object types:
// LINE, CIRCLE, ARC, POINT, LWPOLYLINE, ELLIPSE, SPLINE, XLINE, RAY, TEXT,
// MTEXT, DIMENSION (with its graphics block), LEADER, INSERT, HATCH.
// Own implementation written from the published DXF reference.
QByteArray exportDxf(const Document& doc, DxfExportResult* result = nullptr);
DxfExportResult exportDxfFile(const Document& doc, const QString& path);

} // namespace dyncad
