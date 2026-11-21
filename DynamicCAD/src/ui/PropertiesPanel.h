// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"
#include "selection/SelectionSet.h"

#include <QWidget>
#include <functional>

class QTreeWidget;
class QTreeWidgetItem;

namespace dyncad {

// Properties of the selection. General properties (layer, colour, linetype,
// lineweight, linetype scale) are editable for any selection; geometry is
// editable for a single object (coordinates as "x, y"). Every edit is one
// undo step.
class PropertiesPanel : public QWidget {
    Q_OBJECT
public:
    PropertiesPanel(Document& doc, SelectionSet& sel, QWidget* parent = nullptr);
    void refresh();
    void scheduleRefresh();
    QTreeWidget* tree() const { return tree_; }
    // Applies a geometry edit by property name (as shown in the panel) to
    // the single selected object. Returns false if the value is invalid.
    bool editGeometry(const QString& property, const QString& value);

signals:
    void message(const QString& text);

private:
    QTreeWidgetItem* section(const QString& title);
    void addRow(QTreeWidgetItem* parent, const QString& key, const QString& value);
    void addEditRow(QTreeWidgetItem* parent, const QString& key, const QString& value);
    void addGeneral(QTreeWidgetItem* parent);
    void changeStyle(const std::function<void(EntityStyle&)>& f, const char* what);

    Document& doc_;
    SelectionSet& sel_;
    QTreeWidget* tree_;
    bool pending_ = false;
};

} // namespace dyncad
