// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"
#include "selection/SelectionSet.h"

#include <QWidget>

class QTreeWidget;

namespace dyncad {

// Shows real geometric data of the selection (read-only in this release):
// type, layer, coordinates, length, angle, radius, area, perimeter.
class PropertiesPanel : public QWidget {
    Q_OBJECT
public:
    PropertiesPanel(const Document& doc, const SelectionSet& sel, QWidget* parent = nullptr);
    void refresh();
    QTreeWidget* tree() const { return tree_; }

private:
    const Document& doc_;
    const SelectionSet& sel_;
    QTreeWidget* tree_;
};

} // namespace dyncad
