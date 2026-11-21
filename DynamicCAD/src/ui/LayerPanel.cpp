// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/LayerPanel.h"

#include "ui/StyleWidgets.h"

#include <QComboBox>
#include <QHBoxLayout>
#include <QHeaderView>
#include <QMenu>
#include <QTableWidget>
#include <QToolButton>
#include <QVBoxLayout>

namespace dyncad {

LayerPanel::LayerPanel(Document& doc, QWidget* parent) : QWidget(parent), doc_(doc) {
    table_ = new QTableWidget(this);
    table_->setColumnCount(ColCount);
    table_->setHorizontalHeaderLabels({tr("Cur"), tr("Name"), tr("On"), tr("Freeze"), tr("Lock"), tr("Colour"), tr("Linetype"), tr("Lineweight")});
    table_->verticalHeader()->setVisible(false);
    table_->setSelectionBehavior(QAbstractItemView::SelectRows);
    table_->setSelectionMode(QAbstractItemView::SingleSelection);
    table_->horizontalHeader()->setSectionResizeMode(QHeaderView::ResizeToContents);
    table_->horizontalHeader()->setStretchLastSection(true);
    connect(table_, &QTableWidget::itemChanged, this, &LayerPanel::onItemChanged);
    connect(table_, &QTableWidget::cellDoubleClicked, this, &LayerPanel::onCellDoubleClicked);

    auto button = [this](const QString& text, const QString& tip) {
        auto* b = new QToolButton(this);
        b->setText(text);
        b->setToolTip(tip);
        b->setAutoRaise(true);
        return b;
    };
    auto* bNew = button(tr("New"), tr("Create a new layer"));
    auto* bDel = button(tr("Delete"), tr("Delete the selected layer (must be empty)"));
    auto* bCur = button(tr("Set Current"), tr("Make the selected layer current (double-click the Cur column too)"));
    connect(bNew, &QToolButton::clicked, this, [this] { newLayer(); });
    connect(bDel, &QToolButton::clicked, this, [this] {
        if (table_->currentRow() >= 0) deleteLayer(layerAt(table_->currentRow()));
    });
    connect(bCur, &QToolButton::clicked, this, [this] {
        if (table_->currentRow() >= 0) setCurrent(layerAt(table_->currentRow()));
    });
    auto* row = new QHBoxLayout;
    row->setContentsMargins(2, 2, 2, 0);
    row->addWidget(bNew);
    row->addWidget(bDel);
    row->addWidget(bCur);
    row->addStretch(1);
    auto* lay = new QVBoxLayout(this);
    lay->setContentsMargins(0, 0, 0, 0);
    lay->setSpacing(2);
    lay->addLayout(row);
    lay->addWidget(table_);
    refresh();
}

QString LayerPanel::layerAt(int row) const {
    auto* it = table_->item(row, NameCol);
    return it ? it->data(Qt::UserRole).toString() : QString();
}

void LayerPanel::apply(const std::function<void(StyleTables&)>& change, const char* what) {
    StyleTables t = doc_.styles();
    change(t);
    doc_.setStylesWithUndo(std::move(t), what);
}

void LayerPanel::scheduleRefresh() {
    if (refreshPending_) return;
    refreshPending_ = true;
    QMetaObject::invokeMethod(this, [this] { refreshPending_ = false; refresh(); }, Qt::QueuedConnection);
}

void LayerPanel::refresh() {
    refreshing_ = true;
    const StyleTables& t = doc_.styles();
    const int keep = table_->currentRow();
    table_->setRowCount(int(t.layers().size()));
    int r = 0;
    for (const Layer& l : t.layers()) {
        const QString name = QString::fromStdString(l.name);
        const bool cur = upperName(l.name) == upperName(t.currentLayer());
        auto* curItem = new QTableWidgetItem(cur ? QStringLiteral("✓") : QString());
        curItem->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable);
        curItem->setTextAlignment(Qt::AlignCenter);
        table_->setItem(r, CurCol, curItem);
        auto* nameItem = new QTableWidgetItem(name);
        nameItem->setData(Qt::UserRole, name);
        Qt::ItemFlags f = Qt::ItemIsEnabled | Qt::ItemIsSelectable;
        if (l.name != "0") f |= Qt::ItemIsEditable; // layer 0 cannot be renamed
        nameItem->setFlags(f);
        table_->setItem(r, NameCol, nameItem);
        auto check = [&](int col, bool on) {
            auto* it = new QTableWidgetItem;
            it->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemIsUserCheckable);
            it->setCheckState(on ? Qt::Checked : Qt::Unchecked);
            table_->setItem(r, col, it);
        };
        check(OnCol, l.on);
        check(FreezeCol, l.frozen);
        check(LockCol, l.locked);
        auto* colorItem = new QTableWidgetItem(StyleWidgets::colorSwatch(l.color), StyleWidgets::colorLabel(l.color));
        colorItem->setFlags(Qt::ItemIsEnabled | Qt::ItemIsSelectable);
        colorItem->setToolTip(tr("Double-click to change"));
        table_->setItem(r, ColorCol, colorItem);

        auto* lt = new QComboBox(table_);
        StyleWidgets::fillLinetypeCombo(lt, t, false, l.linetype);
        connect(lt, &QComboBox::currentIndexChanged, this, [this, name, lt] {
            const std::string v = lt->currentData().toString().toStdString();
            apply([&](StyleTables& tt) { if (Layer* x = tt.layer(name.toStdString())) x->linetype = v; }, "Layer linetype");
        });
        table_->setCellWidget(r, LtCol, lt);
        auto* lw = new QComboBox(table_);
        StyleWidgets::fillLineweightCombo(lw, false, l.lineweight);
        connect(lw, &QComboBox::currentIndexChanged, this, [this, name, lw] {
            const int v = lw->currentData().toInt();
            apply([&](StyleTables& tt) { if (Layer* x = tt.layer(name.toStdString())) x->lineweight = v; }, "Layer lineweight");
        });
        table_->setCellWidget(r, LwCol, lw);
        ++r;
    }
    if (keep >= 0 && keep < table_->rowCount()) table_->selectRow(keep);
    refreshing_ = false;
}

void LayerPanel::onItemChanged(QTableWidgetItem* item) {
    if (refreshing_) return;
    const QString name = layerAt(item->row());
    const std::string n = name.toStdString();
    switch (item->column()) {
    case NameCol: {
        const QString to = item->text().trimmed();
        if (to == name) return;
        if (!doc_.renameLayerWithUndo(n, to.toStdString())) {
            emit message(tr("Cannot rename layer \"%1\" to \"%2\" (invalid or duplicate name).").arg(name, to));
            refresh();
        }
        return;
    }
    case OnCol:
    case FreezeCol:
    case LockCol: {
        const bool on = item->checkState() == Qt::Checked;
        const int col = item->column();
        if (col == FreezeCol && on && upperName(n) == upperName(doc_.styles().currentLayer())) {
            emit message(tr("The current layer cannot be frozen."));
            refresh();
            return;
        }
        apply([&](StyleTables& t) {
            Layer* l = t.layer(n);
            if (!l) return;
            if (col == OnCol) l->on = on;
            else if (col == FreezeCol) l->frozen = on;
            else l->locked = on;
        }, col == OnCol ? "Layer on/off" : col == FreezeCol ? "Layer freeze" : "Layer lock");
        return;
    }
    default: return;
    }
}

void LayerPanel::onCellDoubleClicked(int row, int col) {
    const QString name = layerAt(row);
    if (col == CurCol) { setCurrent(name); return; }
    if (col != ColorCol) return;
    QMenu menu(this);
    for (int i = 1; i <= 9; ++i) {
        const CadColor c = CadColor::fromIndex(i);
        menu.addAction(StyleWidgets::colorSwatch(c), StyleWidgets::colorLabel(c))->setData(QString::fromStdString(c.toString()));
    }
    menu.addSeparator();
    menu.addAction(tr("Select Colour..."))->setData(QStringLiteral("__other__"));
    QAction* a = menu.exec(QCursor::pos());
    if (!a) return;
    CadColor c;
    if (a->data().toString() == QLatin1String("__other__")) {
        QComboBox tmp;
        tmp.addItem(QString(), QStringLiteral("__other__"));
        auto picked = StyleWidgets::colorFromCombo(&tmp, this);
        if (!picked) return;
        c = *picked;
    } else if (!CadColor::parse(a->data().toString().toStdString(), c)) {
        return;
    }
    apply([&](StyleTables& t) { if (Layer* l = t.layer(name.toStdString())) l->color = c; }, "Layer colour");
}

QString LayerPanel::newLayer() {
    QString name;
    for (int i = 1;; ++i) {
        name = tr("Layer%1").arg(i);
        if (!doc_.styles().hasLayer(name.toStdString())) break;
    }
    apply([&](StyleTables& t) { Layer l; l.name = name.toStdString(); t.addLayer(l); }, "New layer");
    emit message(tr("Layer \"%1\" created. Double-click its name to rename it.").arg(name));
    return name;
}

bool LayerPanel::setCurrent(const QString& name) {
    StyleTables t = doc_.styles();
    if (!t.setCurrentLayer(name.toStdString())) {
        emit message(tr("Layer \"%1\" cannot be made current (it may be frozen).").arg(name));
        return false;
    }
    doc_.setStylesWithUndo(std::move(t), "Set current layer");
    emit message(tr("Current layer: %1").arg(name));
    return true;
}

bool LayerPanel::deleteLayer(const QString& name) {
    const std::size_t n = doc_.countOnLayer(name.toStdString());
    if (n > 0) {
        emit message(tr("Layer \"%1\" has %2 object(s) and cannot be deleted.").arg(name).arg(n));
        return false;
    }
    if (!doc_.deleteLayerWithUndo(name.toStdString())) {
        emit message(tr("Layer \"%1\" cannot be deleted (layer 0 and the current layer are protected).").arg(name));
        return false;
    }
    emit message(tr("Layer \"%1\" deleted.").arg(name));
    return true;
}

} // namespace dyncad
