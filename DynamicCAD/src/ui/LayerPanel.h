// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "document/Document.h"

#include <QWidget>

class QTableWidget;
class QTableWidgetItem;

namespace dyncad {

// Layer manager: create, rename, delete, set current; on/off, freeze, lock,
// colour, linetype and lineweight. Every change is one undo step.
class LayerPanel : public QWidget {
    Q_OBJECT
public:
    explicit LayerPanel(Document& doc, QWidget* parent = nullptr);
    void refresh();
    // Rebuilds later (safe to call from inside the panel's own widget signals).
    void scheduleRefresh();
    QTableWidget* table() const { return table_; }
    // Programmatic operations (used by buttons and tests).
    QString newLayer();
    bool setCurrent(const QString& name);
    bool deleteLayer(const QString& name);

signals:
    void message(const QString& text);

private:
    enum Col { CurCol, NameCol, OnCol, FreezeCol, LockCol, ColorCol, LtCol, LwCol, ColCount };
    void onItemChanged(QTableWidgetItem* item);
    void onCellDoubleClicked(int row, int col);
    void apply(const std::function<void(StyleTables&)>& change, const char* what);
    QString layerAt(int row) const;

    Document& doc_;
    QTableWidget* table_;
    bool refreshing_ = false;
    bool refreshPending_ = false;
};

} // namespace dyncad
