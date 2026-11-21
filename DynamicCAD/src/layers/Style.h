// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include <cstdint>
#include <map>
#include <string>
#include <vector>

namespace dyncad {

// Colour of an object or layer: ByLayer, ByBlock, a CAD colour index (1-255,
// the palette used by DXF files) or a true RGB colour.
struct CadColor {
    enum class Kind : std::uint8_t { ByLayer, ByBlock, Index, Rgb };
    Kind kind = Kind::ByLayer;
    int index = 7;           // Kind::Index
    std::uint32_t rgb = 0;   // Kind::Rgb, 0xRRGGBB

    static CadColor byLayer() { return {}; }
    static CadColor byBlock() { CadColor c; c.kind = Kind::ByBlock; return c; }
    static CadColor fromIndex(int i) { CadColor c; c.kind = Kind::Index; c.index = i; return c; }
    static CadColor fromRgb(std::uint32_t v) { CadColor c; c.kind = Kind::Rgb; c.rgb = v & 0xFFFFFFu; return c; }
    bool operator==(const CadColor& o) const {
        return kind == o.kind && (kind != Kind::Index || index == o.index) && (kind != Kind::Rgb || rgb == o.rgb);
    }
    bool operator!=(const CadColor& o) const { return !(*this == o); }
    // Index 7 is "white on dark backgrounds, black on light ones".
    bool isForeground() const { return kind == Kind::Index && index == 7; }
    std::string toString() const; // "ByLayer", "ByBlock", "1".."255", "#RRGGBB"
    static bool parse(const std::string& s, CadColor& out);
};

// RGB of a colour index (1-255). Indices 1-9 and 250-255 are the standard
// fixed colours; 10-249 follow the usual hue/value scheme of CAD palettes.
std::uint32_t colorIndexToRgb(int index);
// Nearest colour index for an RGB value (used for display names only).
const char* colorIndexName(int index); // "Red", "Yellow", ... or nullptr

// Lineweights in 1/100 mm. Special values follow the DXF convention.
inline constexpr int kLwByLayer = -1;
inline constexpr int kLwByBlock = -2;
inline constexpr int kLwDefault = -3;
inline constexpr int kLwDefaultValue = 25; // 0.25 mm
const std::vector<int>& standardLineweights();
std::string lineweightToString(int lw);

// Linetype: repeating dash pattern in drawing units (at scale 1).
// Positive = dash, negative = gap, 0 = dot. Empty = continuous.
struct Linetype {
    std::string name;
    std::string description;
    std::vector<double> pattern;
    double patternLength() const;
};

// Built-in linetypes: CONTINUOUS, DASHED, HIDDEN, CENTER, DASHDOT, PHANTOM,
// DOT, BORDER, DIVIDE (patterns in millimetres, original definitions).
const std::vector<Linetype>& builtinLinetypes();

inline constexpr const char* kByLayer = "ByLayer";
inline constexpr const char* kByBlock = "ByBlock";
inline constexpr const char* kContinuous = "Continuous";

std::string upperName(std::string s);
// Case-insensitive ASCII comparison without allocating.
bool sameName(const std::string& a, const char* b);

} // namespace dyncad
