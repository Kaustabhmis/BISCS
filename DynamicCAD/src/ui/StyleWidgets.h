// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "layers/LayerTable.h"

#include <QIcon>
#include <optional>

class QComboBox;
class QWidget;

namespace dyncad::StyleWidgets {

QIcon colorSwatch(const CadColor& c, const StyleTables* tables = nullptr, const std::string& layer = {});
QString colorLabel(const CadColor& c);
// Item data holds the CadColor::toString() value; last item "Select Colour...".
void fillColorCombo(QComboBox* box, bool withByLayer, const CadColor& current);
void fillLinetypeCombo(QComboBox* box, const StyleTables& t, bool withByLayer, const std::string& current);
void fillLineweightCombo(QComboBox* box, bool withByLayer, int current);
// Handles the "Select Colour..." item: asks for an RGB colour or index.
std::optional<CadColor> colorFromCombo(QComboBox* box, QWidget* parent);

} // namespace dyncad::StyleWidgets
