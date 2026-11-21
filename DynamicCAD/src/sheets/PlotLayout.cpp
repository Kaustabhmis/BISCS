// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "sheets/PlotLayout.h"

#include "commands/InputParser.h"

#include <cmath>
#include <cstdio>

namespace dyncad {

const std::vector<PaperSize>& standardPapers() {
    static const std::vector<PaperSize> p = {
        {"A4", 210, 297}, {"A3", 297, 420}, {"A2", 420, 594}, {"A1", 594, 841}, {"A0", 841, 1189}};
    return p;
}

std::optional<PaperSize> paperByName(const std::string& name) {
    const std::string u = toUpper(name);
    for (const auto& p : standardPapers())
        if (p.name == u) return p;
    return std::nullopt;
}

PlotLayout computePlotLayout(const PlotSettings& s) {
    PlotLayout L;
    const BoundingBox a = s.area;
    if (!a.isValid()) return L;
    const double availW = std::max(1.0, s.paperW - 2 * s.marginMm), availH = std::max(1.0, s.paperH - 2 * s.marginMm);
    if (s.scale) L.paperPerUnit = *s.scale;
    else {
        const double fx = a.width() > 0 ? availW / a.width() : 1e300, fy = a.height() > 0 ? availH / a.height() : 1e300;
        L.paperPerUnit = std::min(fx, fy);
        if (!std::isfinite(L.paperPerUnit) || L.paperPerUnit <= 0) L.paperPerUnit = 1.0;
    }
    L.worldOrigin = a.center();
    L.originMm = s.centre ? Vec2{s.paperW / 2, s.paperH / 2}
                          : Vec2{s.marginMm + a.width() * L.paperPerUnit / 2, s.marginMm + a.height() * L.paperPerUnit / 2};
    return L;
}

std::optional<double> parseScale(const std::string& raw) {
    const std::string t = trim(raw);
    const auto colon = t.find(':');
    if (colon == std::string::npos) return std::nullopt;
    auto a = parseNumber(t.substr(0, colon)), b = parseNumber(t.substr(colon + 1));
    if (!a || !b || !(*a > 0) || !(*b > 0)) return std::nullopt;
    return *a / *b;
}

std::string scaleName(double f) {
    char b[48];
    if (f >= 1.0) std::snprintf(b, sizeof b, "%g:1", f);
    else std::snprintf(b, sizeof b, "1:%g", 1.0 / f);
    return b;
}

} // namespace dyncad
