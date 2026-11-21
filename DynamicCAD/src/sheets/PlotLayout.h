// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/BoundingBox.h"

#include <optional>
#include <string>
#include <vector>

namespace dyncad {

struct PaperSize {
    std::string name;
    double widthMm;  // portrait width
    double heightMm; // portrait height
};
const std::vector<PaperSize>& standardPapers(); // A4 ... A0 (ISO 216)
std::optional<PaperSize> paperByName(const std::string& name);

// How a world rectangle is placed on paper.
struct PlotSettings {
    double paperW = 420, paperH = 297; // mm, as oriented on the page
    BoundingBox area;                  // world area to plot
    // Paper millimetres per drawing unit (drawing in mm: 1/n for 1:n);
    // nullopt = fit the area to the printable region.
    std::optional<double> scale;
    double marginMm = 0.0; // printable margin used when fitting
    bool centre = true;
};

struct PlotLayout {
    double paperPerUnit = 1.0; // mm on paper per world unit
    Vec2 originMm;             // paper position (mm, from bottom-left) of world point 'worldOrigin'
    Vec2 worldOrigin;
    Vec2 toPaper(const Vec2& w) const { return originMm + (w - worldOrigin) * paperPerUnit; }
};
PlotLayout computePlotLayout(const PlotSettings& s);

// "1:5" style scale names <-> paper-per-unit factors (drawing units = mm).
std::optional<double> parseScale(const std::string& text); // "1:5", "2:1", "Fit" -> nullopt
std::string scaleName(double paperPerUnit);

} // namespace dyncad
