// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/BlockEntities.h"
#include "layers/LayerTable.h"

#include <string>
#include <vector>

namespace dyncad {

// Drawing sheet placed in model space at drawing scale 1:n (geometry is the
// paper size multiplied by n, so plotting the sheet area at 1:n gives the
// exact paper size).
struct SheetSpec {
    std::string paper = "A3";       // A4 .. A0
    bool landscape = true;
    bool dynamicEngineers = true;   // A3 landscape Dynamic Engineers master sheet
    double scaleDenominator = 1.0;  // n of 1:n
    Vec2 origin;                    // world position of the sheet's lower-left corner
    std::string status = "PRELIMINARY";
};

struct SheetResult {
    BlockDefPtr frame;                 // fixed graphics (frame, zones, tables, labels)
    std::vector<EntityPtr> entities;   // block reference + editable fields (texts, notes)
    std::vector<Layer> layers;         // layers the sheet uses
    BoundingBox paperArea;             // world rectangle of the full sheet
    std::vector<std::string> openPoints; // items that need confirmation before release
};

SheetResult makeSheet(const SheetSpec& spec);
// Allowed status values of the Dynamic Engineers standard.
const std::vector<std::string>& sheetStatuses();

} // namespace dyncad
