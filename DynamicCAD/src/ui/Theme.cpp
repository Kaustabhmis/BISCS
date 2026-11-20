// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/Theme.h"

#include <QApplication>
#include <QPalette>
#include <QStyle>
#include <QStyleFactory>

namespace dyncad::Theme {

void apply(QApplication& app, ThemeKind kind) {
    app.setStyle(QStyleFactory::create("Fusion"));
    QPalette p;
    const QColor accent = brandGold();
    if (kind == ThemeKind::Dark) {
        const QColor window(0x2B, 0x2F, 0x36), base(0x21, 0x25, 0x2B), text(0xE6, 0xE8, 0xEB);
        p.setColor(QPalette::Window, window);
        p.setColor(QPalette::WindowText, text);
        p.setColor(QPalette::Base, base);
        p.setColor(QPalette::AlternateBase, window);
        p.setColor(QPalette::ToolTipBase, base);
        p.setColor(QPalette::ToolTipText, text);
        p.setColor(QPalette::Text, text);
        p.setColor(QPalette::Button, QColor(0x33, 0x38, 0x40));
        p.setColor(QPalette::ButtonText, text);
        p.setColor(QPalette::BrightText, Qt::red);
        p.setColor(QPalette::Highlight, QColor(0x2F, 0x6F, 0xB3));
        p.setColor(QPalette::HighlightedText, Qt::white);
        p.setColor(QPalette::Link, accent);
        p.setColor(QPalette::Mid, QColor(0x45, 0x4A, 0x52));
        p.setColor(QPalette::Dark, QColor(0x1A, 0x1D, 0x22));
        p.setColor(QPalette::Disabled, QPalette::Text, QColor(0x7A, 0x80, 0x88));
        p.setColor(QPalette::Disabled, QPalette::ButtonText, QColor(0x7A, 0x80, 0x88));
        p.setColor(QPalette::Disabled, QPalette::WindowText, QColor(0x7A, 0x80, 0x88));
    } else {
        p = app.style()->standardPalette();
        p.setColor(QPalette::Highlight, QColor(0x2F, 0x6F, 0xB3));
    }
    app.setPalette(p);
    app.setStyleSheet(QStringLiteral(
        "QTabWidget#Ribbon::pane { border-top: 2px solid %1; }"
        "QTabWidget#Ribbon QTabBar::tab { padding: 4px 14px; }"
        "QTabWidget#Ribbon QTabBar::tab:selected { border-bottom: 2px solid %1; font-weight: bold; }"
        "QLabel#RibbonGroupTitle { font-size: 9pt; }"
        "QFrame#RibbonSeparator { color: palette(mid); }"
        "QToolButton { padding: 2px; }"
        "QStatusBar QToolButton:checked { background: palette(highlight); color: palette(highlighted-text); border-radius: 3px; }")
                          .arg(accent.name()));
}

CanvasColors canvasColors(ThemeKind kind) {
    CanvasColors c;
    if (kind == ThemeKind::Dark) {
        c.background = QColor(0x1E, 0x22, 0x28);
        c.gridMinor = QColor(0x2A, 0x2F, 0x37);
        c.gridMajor = QColor(0x37, 0x3E, 0x48);
        c.axisX = QColor(0xB0, 0x40, 0x40);
        c.axisY = QColor(0x40, 0xA0, 0x50);
        c.entity = QColor(0xF2, 0xF2, 0xF2);
        c.crosshair = QColor(0xD8, 0xD8, 0xD8);
        c.preview = QColor(0xF4, 0xB4, 0x00);
    } else {
        c.background = QColor(0xFF, 0xFF, 0xFF);
        c.gridMinor = QColor(0xEE, 0xF0, 0xF3);
        c.gridMajor = QColor(0xD6, 0xDA, 0xE0);
        c.axisX = QColor(0xD0, 0x50, 0x50);
        c.axisY = QColor(0x40, 0xA0, 0x50);
        c.entity = QColor(0x10, 0x10, 0x10);
        c.crosshair = QColor(0x30, 0x30, 0x30);
        c.preview = QColor(0xC0, 0x80, 0x00);
    }
    c.selected = QColor(0x3D, 0x9B, 0xFF);
    c.hover = QColor(0x7F, 0xC4, 0xFF);
    c.grip = QColor(0x3D, 0x7B, 0xFF);
    c.windowFill = QColor(0x3D, 0x7B, 0xFF, 40);
    c.windowBorder = QColor(0x3D, 0x7B, 0xFF);
    c.crossingFill = QColor(0x40, 0xC0, 0x60, 40);
    c.crossingBorder = QColor(0x40, 0xC0, 0x60);
    return c;
}

} // namespace dyncad::Theme
