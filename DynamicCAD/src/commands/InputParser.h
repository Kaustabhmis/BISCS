// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/Vec2.h"

#include <optional>
#include <string>

namespace dyncad {

// Result of parsing one line typed on the command line.
struct ParsedInput {
    enum class Kind { Empty, Point, Number, Keyword, Invalid };
    Kind kind = Kind::Empty;
    Vec2 point;          // Kind::Point
    double number = 0.0; // Kind::Number
    std::string keyword; // Kind::Keyword (upper-case)
};

// Supported coordinate syntax (familiar CAD conventions):
//   x,y        absolute Cartesian         #x,y   absolute (explicit)
//   @dx,dy     relative to last point     d<a    absolute polar (angle in degrees)
//   @d<a       relative polar             n      plain number (distance, radius...)
//   WORD       keyword / command option
// Numbers always use '.' as the decimal separator regardless of OS locale.
ParsedInput parseInput(const std::string& text, const std::optional<Vec2>& lastPoint);

// Locale-independent strict number parsing (whole string must be a number).
std::optional<double> parseNumber(const std::string& text);

std::string toUpper(std::string s);
std::string trim(const std::string& s);

} // namespace dyncad
