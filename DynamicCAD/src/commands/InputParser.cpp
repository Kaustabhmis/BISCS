// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/InputParser.h"

#include <cctype>
#include <charconv>
#include <cmath>

namespace dyncad {

std::string trim(const std::string& s) {
    std::size_t b = 0, e = s.size();
    while (b < e && std::isspace(static_cast<unsigned char>(s[b]))) ++b;
    while (e > b && std::isspace(static_cast<unsigned char>(s[e - 1]))) --e;
    return s.substr(b, e - b);
}

std::string toUpper(std::string s) {
    for (char& c : s) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
    return s;
}

std::optional<double> parseNumber(const std::string& raw) {
    std::string s = trim(raw);
    if (!s.empty() && s[0] == '+') s.erase(0, 1);
    if (s.empty()) return std::nullopt;
    double v = 0.0;
    const char* first = s.data();
    const char* last = s.data() + s.size();
    auto [ptr, ec] = std::from_chars(first, last, v, std::chars_format::general);
    if (ec != std::errc() || ptr != last || !std::isfinite(v)) return std::nullopt;
    return v;
}

ParsedInput parseInput(const std::string& text, const std::optional<Vec2>& lastPoint) {
    ParsedInput out;
    std::string s = trim(text);
    if (s.empty()) return out; // Empty

    bool relative = false;
    if (s[0] == '@') { relative = true; s = trim(s.substr(1)); }
    else if (s[0] == '#') { s = trim(s.substr(1)); }

    const Vec2 base = relative ? lastPoint.value_or(Vec2{}) : Vec2{};

    if (relative && s.empty()) { // "@" alone = last point
        out.kind = ParsedInput::Kind::Point;
        out.point = base;
        return out;
    }

    if (auto comma = s.find(','); comma != std::string::npos) {
        auto x = parseNumber(s.substr(0, comma));
        auto y = parseNumber(s.substr(comma + 1));
        if (!x || !y) { out.kind = ParsedInput::Kind::Invalid; return out; }
        out.kind = ParsedInput::Kind::Point;
        out.point = base + Vec2{*x, *y};
        return out;
    }
    if (auto lt = s.find('<'); lt != std::string::npos) {
        auto d = parseNumber(s.substr(0, lt));
        auto a = parseNumber(s.substr(lt + 1));
        if (!d || !a) { out.kind = ParsedInput::Kind::Invalid; return out; }
        out.kind = ParsedInput::Kind::Point;
        out.point = base + Vec2::fromPolar(*d, degToRad(*a));
        return out;
    }
    if (relative) { out.kind = ParsedInput::Kind::Invalid; return out; }

    if (auto n = parseNumber(s)) {
        out.kind = ParsedInput::Kind::Number;
        out.number = *n;
        return out;
    }
    // Keywords: letters, digits, underscore; must start with a letter or digit.
    for (char c : s) {
        if (!(std::isalnum(static_cast<unsigned char>(c)) || c == '_')) {
            out.kind = ParsedInput::Kind::Invalid;
            return out;
        }
    }
    out.kind = ParsedInput::Kind::Keyword;
    out.keyword = toUpper(s);
    return out;
}

} // namespace dyncad
