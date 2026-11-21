// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/StyleWidgets.h"

#include <QColorDialog>
#include <QComboBox>
#include <QInputDialog>
#include <QPainter>
#include <QPixmap>

namespace dyncad::StyleWidgets {

namespace {
const char* kOther = "__other__";
}

QIcon colorSwatch(const CadColor& c, const StyleTables* tables, const std::string& layer) {
    CadColor shown = c;
    if (c.kind == CadColor::Kind::ByLayer && tables)
        if (const Layer* l = tables->layer(layer)) shown = l->color;
    QPixmap pm(14, 14);
    pm.fill(Qt::transparent);
    QPainter p(&pm);
    p.setPen(QColor(0x80, 0x80, 0x80));
    if (shown.kind == CadColor::Kind::Index || shown.kind == CadColor::Kind::Rgb) {
        const std::uint32_t rgb = shown.kind == CadColor::Kind::Rgb ? shown.rgb : colorIndexToRgb(shown.index);
        p.setBrush(QColor::fromRgb(QRgb(0xFF000000u | rgb)));
    } else {
        p.setBrush(Qt::NoBrush);
    }
    p.drawRect(0, 0, 13, 13);
    return QIcon(pm);
}

QString colorLabel(const CadColor& c) {
    switch (c.kind) {
    case CadColor::Kind::ByLayer: return QStringLiteral("ByLayer");
    case CadColor::Kind::ByBlock: return QStringLiteral("ByBlock");
    case CadColor::Kind::Index: {
        const char* n = colorIndexName(c.index);
        return n ? QString::fromLatin1(n) : QStringLiteral("Color %1").arg(c.index);
    }
    case CadColor::Kind::Rgb: return QString::fromStdString(c.toString());
    }
    return {};
}

void fillColorCombo(QComboBox* box, bool withByLayer, const CadColor& current) {
    const QSignalBlocker block(box);
    box->clear();
    std::vector<CadColor> items;
    if (withByLayer) items.push_back(CadColor::byLayer());
    for (int i = 1; i <= 9; ++i) items.push_back(CadColor::fromIndex(i));
    bool found = false;
    for (const CadColor& c : items) found |= (c == current);
    if (!found) items.push_back(current);
    for (const CadColor& c : items) box->addItem(colorSwatch(c), colorLabel(c), QString::fromStdString(c.toString()));
    box->addItem(QObject::tr("Select Colour..."), QString::fromLatin1(kOther));
    box->setCurrentIndex(box->findData(QString::fromStdString(current.toString())));
}

void fillLinetypeCombo(QComboBox* box, const StyleTables& t, bool withByLayer, const std::string& current) {
    const QSignalBlocker block(box);
    box->clear();
    if (withByLayer) box->addItem(QStringLiteral("ByLayer"), QStringLiteral("ByLayer"));
    for (const Linetype& lt : t.linetypes())
        box->addItem(QString::fromStdString(lt.name), QString::fromStdString(lt.name));
    int idx = -1;
    for (int i = 0; i < box->count(); ++i)
        if (upperName(box->itemData(i).toString().toStdString()) == upperName(current)) idx = i;
    if (idx < 0) { box->addItem(QString::fromStdString(current), QString::fromStdString(current)); idx = box->count() - 1; }
    box->setCurrentIndex(idx);
}

void fillLineweightCombo(QComboBox* box, bool withByLayer, int current) {
    const QSignalBlocker block(box);
    box->clear();
    if (withByLayer) box->addItem(QStringLiteral("ByLayer"), kLwByLayer);
    box->addItem(QStringLiteral("Default"), kLwDefault);
    for (int lw : standardLineweights()) box->addItem(QString::fromStdString(lineweightToString(lw)), lw);
    box->setCurrentIndex(std::max(0, box->findData(current)));
}

std::optional<CadColor> colorFromCombo(QComboBox* box, QWidget* parent) {
    const QString data = box->currentData().toString();
    if (data == QLatin1String(kOther)) {
        const QStringList choices{QObject::tr("True colour (RGB)..."), QObject::tr("Colour index (1-255)...")};
        bool ok = false;
        const QString pick = QInputDialog::getItem(parent, QObject::tr("Select Colour"), QObject::tr("Colour type:"), choices, 0, false, &ok);
        if (!ok) return std::nullopt;
        if (pick == choices[0]) {
            const QColor c = QColorDialog::getColor(Qt::white, parent, QObject::tr("Select Colour"));
            if (!c.isValid()) return std::nullopt;
            return CadColor::fromRgb(static_cast<std::uint32_t>(c.rgb() & 0xFFFFFF));
        }
        const int idx = QInputDialog::getInt(parent, QObject::tr("Colour Index"), QObject::tr("Index (1-255):"), 7, 1, 255, 1, &ok);
        if (!ok) return std::nullopt;
        return CadColor::fromIndex(idx);
    }
    CadColor c;
    if (CadColor::parse(data.toStdString(), c)) return c;
    return std::nullopt;
}

} // namespace dyncad::StyleWidgets
