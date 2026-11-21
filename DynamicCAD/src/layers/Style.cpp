// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "layers/Style.h"

#include <cctype>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>

namespace dyncad {

std::string upperName(std::string s) {
    for (char& c : s) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
    return s;
}

bool sameName(const std::string& a, const char* b) {
    std::size_t i = 0;
    for (; i < a.size() && b[i]; ++i)
        if (std::toupper(static_cast<unsigned char>(a[i])) != std::toupper(static_cast<unsigned char>(b[i]))) return false;
    return i == a.size() && b[i] == 0;
}

std::string CadColor::toString() const {
    switch (kind) {
    case Kind::ByLayer: return kByLayer;
    case Kind::ByBlock: return kByBlock;
    case Kind::Index: return std::to_string(index);
    case Kind::Rgb: {
        char b[16];
        std::snprintf(b, sizeof b, "#%06X", rgb);
        return b;
    }
    }
    return {};
}

bool CadColor::parse(const std::string& s, CadColor& out) {
    const std::string u = upperName(s);
    if (u == "BYLAYER") { out = byLayer(); return true; }
    if (u == "BYBLOCK") { out = byBlock(); return true; }
    if (!s.empty() && s[0] == '#' && s.size() == 7) {
        char* end = nullptr;
        const unsigned long v = std::strtoul(s.c_str() + 1, &end, 16);
        if (end && *end == 0) { out = fromRgb(static_cast<std::uint32_t>(v)); return true; }
        return false;
    }
    char* end = nullptr;
    const long i = std::strtol(s.c_str(), &end, 10);
    if (end && *end == 0 && i >= 1 && i <= 255) { out = fromIndex(static_cast<int>(i)); return true; }
    return false;
}

namespace {
std::uint32_t pack(double r, double g, double b) {
    auto c = [](double v) { return static_cast<std::uint32_t>(std::lround(std::clamp(v, 0.0, 1.0) * 255.0)); };
    return (c(r) << 16) | (c(g) << 8) | c(b);
}
std::uint32_t hsv(double hDeg, double s, double v) {
    const double h = std::fmod(hDeg, 360.0) / 60.0;
    const int i = static_cast<int>(std::floor(h));
    const double f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
    switch (i % 6) {
    case 0: return pack(v, t, p);
    case 1: return pack(q, v, p);
    case 2: return pack(p, v, t);
    case 3: return pack(p, q, v);
    case 4: return pack(t, p, v);
    default: return pack(v, p, q);
    }
}
} // namespace

std::uint32_t colorIndexToRgb(int i) {
    static const std::uint32_t fixed[10] = {0x000000, 0xFF0000, 0xFFFF00, 0x00FF00, 0x00FFFF,
                                            0x0000FF, 0xFF00FF, 0xFFFFFF, 0x808080, 0xC0C0C0};
    if (i >= 1 && i <= 9) return fixed[i];
    if (i >= 250 && i <= 255) {
        static const int grey[6] = {51, 91, 132, 173, 214, 255};
        const std::uint32_t g = static_cast<std::uint32_t>(grey[i - 250]);
        return (g << 16) | (g << 8) | g;
    }
    if (i >= 10 && i <= 249) {
        const int group = (i - 10) / 10, k = (i - 10) % 10;
        static const double value[5] = {1.0, 0.8, 0.6, 0.5, 0.3};
        return hsv(group * 15.0, (k % 2 == 0) ? 1.0 : 0.5, value[k / 2]);
    }
    return 0xFFFFFF;
}

const char* colorIndexName(int i) {
    static const char* names[8] = {nullptr, "Red", "Yellow", "Green", "Cyan", "Blue", "Magenta", "White"};
    return (i >= 1 && i <= 7) ? names[i] : nullptr;
}

const std::vector<int>& standardLineweights() {
    static const std::vector<int> v = {0,  5,  9,  13, 15, 18, 20, 25,  30,  35,  40,  50,
                                       53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211};
    return v;
}

std::string lineweightToString(int lw) {
    if (lw == kLwByLayer) return kByLayer;
    if (lw == kLwByBlock) return kByBlock;
    if (lw == kLwDefault) return "Default";
    char b[16];
    std::snprintf(b, sizeof b, "%.2f mm", lw / 100.0);
    return b;
}

double Linetype::patternLength() const {
    double s = 0;
    for (double d : pattern) s += std::abs(d);
    return s;
}

const std::vector<Linetype>& builtinLinetypes() {
    static const std::vector<Linetype> v = {
        {kContinuous, "Solid line", {}},
        {"DASHED", "Dashed  __ __ __", {6.0, -3.0}},
        {"HIDDEN", "Hidden  _ _ _ _", {3.0, -1.5}},
        {"CENTER", "Center  ____ _ ____ _", {24.0, -3.0, 6.0, -3.0}},
        {"DASHDOT", "Dash dot  __ . __ .", {12.0, -3.0, 0.0, -3.0}},
        {"PHANTOM", "Phantom  ____ _ _ ____", {24.0, -3.0, 6.0, -3.0, 6.0, -3.0}},
        {"DOT", "Dot  . . . . .", {0.0, -3.0}},
        {"BORDER", "Border  __ __ . __ __ .", {12.0, -3.0, 12.0, -3.0, 0.0, -3.0}},
        {"DIVIDE", "Divide  __ . . __ . .", {12.0, -3.0, 0.0, -3.0, 0.0, -3.0}},
    };
    return v;
}

} // namespace dyncad
