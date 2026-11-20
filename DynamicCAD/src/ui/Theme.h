// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include <QColor>

class QApplication;

namespace dyncad {

struct CanvasColors {
    QColor background, gridMinor, gridMajor, axisX, axisY;
    QColor entity, selected, hover, preview, grip, crosshair;
    QColor windowFill, windowBorder, crossingFill, crossingBorder;
};

enum class ThemeKind { Dark, Light };

namespace Theme {
void apply(QApplication& app, ThemeKind kind);
CanvasColors canvasColors(ThemeKind kind);
// Brand colours (Dynamic Engineers drawing standard).
inline QColor brandNavy() { return QColor(0x15, 0x3A, 0x5B); }
inline QColor brandGold() { return QColor(0xF4, 0xB4, 0x00); }
} // namespace Theme

} // namespace dyncad
