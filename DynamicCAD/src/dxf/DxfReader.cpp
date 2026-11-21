// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
//
// Independent implementation of a DXF reader, written from the publicly
// documented DXF reference. No third-party DXF code is used.
#include "dxf/DxfReader.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/XLineEntity.h"
#include "entities/Annotation.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "geometry/Intersections.h"

#include <QFile>

#include <charconv>
#include <cctype>
#include <cstdlib>
#include <cstring>
#include <cmath>
#include <optional>
#include <set>
#include <string_view>
#include <unordered_map>

namespace dyncad {

std::size_t DxfImportResult::unsupportedTotal() const {
    std::size_t n = 0;
    for (const auto& [k, v] : unsupported) n += v;
    return n;
}

std::string describeAcadVersion(const std::string& v) {
    static const std::map<std::string, std::string> names = {
        {"AC1009", "AutoCAD R11/R12"},      {"AC1012", "AutoCAD R13"},
        {"AC1014", "AutoCAD R14"},          {"AC1015", "AutoCAD 2000-2002"},
        {"AC1018", "AutoCAD 2004-2006"},    {"AC1021", "AutoCAD 2007-2009"},
        {"AC1024", "AutoCAD 2010-2012"},    {"AC1027", "AutoCAD 2013-2017"},
        {"AC1032", "AutoCAD 2018 or later"}};
    auto it = names.find(v);
    if (it != names.end()) return it->second + " (" + v + ")";
    return v.empty() ? std::string("unknown version") : v;
}

namespace {

constexpr qint64 kMaxDxfSize = 1024LL * 1024 * 1024; // 1 GB
constexpr int kMaxBlockDepth = 32;

// ------------------------------------------------------------ tokenizer

struct Group {
    int code;
    std::string_view value;
    std::size_t line; // 1-based line number of the code
};

std::string_view trimView(std::string_view s) {
    while (!s.empty() && (s.front() == ' ' || s.front() == '\t')) s.remove_prefix(1);
    while (!s.empty() && (s.back() == ' ' || s.back() == '\t' || s.back() == '\r')) s.remove_suffix(1);
    return s;
}

std::optional<double> toDouble(std::string_view s) {
    s = trimView(s);
    if (!s.empty() && s.front() == '+') s.remove_prefix(1);
    if (s.empty()) return std::nullopt;
    double v = 0;
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v, std::chars_format::general);
    if (ec != std::errc() || p != s.data() + s.size() || !std::isfinite(v)) return std::nullopt;
    return v;
}

std::optional<long long> toInt(std::string_view s) {
    s = trimView(s);
    if (!s.empty() && s.front() == '+') s.remove_prefix(1);
    long long v = 0;
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc() || p != s.data() + s.size()) return std::nullopt;
    return v;
}

bool tokenize(const QByteArray& data, std::vector<Group>& out, std::string& error, bool& sawEof) {
    sawEof = false;
    const char* p = data.constData();
    const char* end = p + data.size();
    // Skip UTF-8 BOM.
    if (end - p >= 3 && static_cast<unsigned char>(p[0]) == 0xEF && static_cast<unsigned char>(p[1]) == 0xBB &&
        static_cast<unsigned char>(p[2]) == 0xBF)
        p += 3;
    std::size_t line = 0;
    auto nextLine = [&](std::string_view& sv) -> bool {
        if (p >= end) return false;
        const char* nl = static_cast<const char*>(memchr(p, '\n', static_cast<std::size_t>(end - p)));
        const char* e = nl ? nl : end;
        sv = std::string_view(p, static_cast<std::size_t>(e - p));
        if (!sv.empty() && sv.back() == '\r') sv.remove_suffix(1);
        p = nl ? nl + 1 : end;
        ++line;
        return true;
    };
    out.reserve(static_cast<std::size_t>(data.size() / 12));
    std::string_view codeLine, valueLine;
    while (nextLine(codeLine)) {
        const std::string_view trimmed = trimView(codeLine);
        if (trimmed.empty() && p >= end) break; // trailing blank line
        const std::size_t codeLineNo = line;
        auto code = toInt(trimmed);
        if (!code || *code < 0 || *code > 1071) {
            error = "Invalid DXF group code \"" + std::string(trimmed.substr(0, 40)) + "\" at line " +
                    std::to_string(codeLineNo) + ".";
            return false;
        }
        if (!nextLine(valueLine)) {
            error = "The DXF file is truncated (missing value after line " + std::to_string(codeLineNo) + ").";
            return false;
        }
        out.push_back({static_cast<int>(*code), valueLine, codeLineNo});
        if (*code == 0 && trimView(valueLine) == "EOF") { sawEof = true; break; }
    }
    return true;
}

bool isValidUtf8(std::string_view s) {
    std::size_t i = 0;
    while (i < s.size()) {
        const unsigned char c = static_cast<unsigned char>(s[i]);
        int n = c < 0x80 ? 0 : (c >> 5) == 0x6 ? 1 : (c >> 4) == 0xE ? 2 : (c >> 3) == 0x1E ? 3 : -1;
        if (n < 0 || i + static_cast<std::size_t>(n) >= s.size() + (n == 0 ? 1 : 0)) return false;
        for (int k = 1; k <= n; ++k)
            if ((static_cast<unsigned char>(s[i + static_cast<std::size_t>(k)]) >> 6) != 0x2) return false;
        i += static_cast<std::size_t>(n) + 1;
    }
    return true;
}

// ------------------------------------------------------------ raw entities

struct RawEntity {
    std::string type;
    std::vector<Group> groups;

    const Group* find(int code) const {
        for (const auto& g : groups)
            if (g.code == code) return &g;
        return nullptr;
    }
    double num(int code, double def = 0.0) const {
        if (const Group* g = find(code))
            if (auto v = toDouble(g->value)) return *v;
        return def;
    }
    bool has(int code) const { return find(code) != nullptr; }
    bool numValid(int code) const {
        const Group* g = find(code);
        return g && toDouble(g->value).has_value();
    }
    long long integer(int code, long long def = 0) const {
        if (const Group* g = find(code))
            if (auto v = toInt(g->value)) return *v;
        return def;
    }
    std::string str(int code, const std::string& def = {}) const {
        if (const Group* g = find(code)) return std::string(trimView(g->value));
        return def;
    }
};

struct Block {
    std::string name;
    Vec2 base;
    bool xref = false;
    std::vector<RawEntity> entities;
};

// ------------------------------------------------------------ importer

class Importer {
public:
    explicit Importer(DxfImportResult& r) : r_(r) {}

    bool run(const std::vector<Group>& groups) {
        g_ = &groups;
        pos_ = 0;
        while (pos_ < groups.size()) {
            const Group& g = groups[pos_];
            if (g.code == 0 && trimView(g.value) == "EOF") break;
            if (g.code == 0 && trimView(g.value) == "SECTION") {
                ++pos_;
                if (pos_ >= groups.size() || groups[pos_].code != 2) return fail("SECTION without a name", g.line);
                const std::string name(trimView(groups[pos_].value));
                ++pos_;
                if (name == "HEADER") parseHeader();
                else if (name == "TABLES") parseTables();
                else if (name == "BLOCKS") { if (!parseBlocks()) return false; }
                else if (name == "ENTITIES") { readEntityList(entities_, "ENDSEC"); sawEntities_ = true; }
                else skipToEndSec();
                continue;
            }
            ++pos_;
        }
        if (!sawEntities_) return fail("The file has no ENTITIES section; it does not look like a DXF drawing.", 0);
        finishHeader();
        convertList(entities_, Affine2D{}, 0, true);
        return true;
    }

    std::vector<EntityPtr> takeEntities() { return std::move(out_); }
    StyleTables takeTables() {
        if (ltscale_ && *ltscale_ > 0) tables_.setLtscale(*ltscale_);
        if (!clayer_.empty()) tables_.setCurrentLayer(clayer_);
        return std::move(tables_);
    }

private:
    bool fail(const std::string& msg, std::size_t line) {
        r_.error = line ? msg + " (line " + std::to_string(line) + ")." : msg;
        return false;
    }
    const Group& cur() const { return (*g_)[pos_]; }
    bool atEnd() const { return pos_ >= g_->size(); }
    bool atMarker(const char* marker) const {
        return !atEnd() && cur().code == 0 && trimView(cur().value) == marker;
    }

    void skipToEndSec() {
        while (!atEnd() && !atMarker("ENDSEC") && !atMarker("EOF")) ++pos_;
        if (atMarker("ENDSEC")) ++pos_;
    }

    std::string decode(std::string_view s) const {
        s = trimView(s);
        if (utf8_ || isValidUtf8(s)) return std::string(s);
        // Pre-2007 files use the Windows ANSI code page; map Latin-1 range.
        std::string out;
        for (unsigned char c : s) {
            if (c < 0x80) out += static_cast<char>(c);
            else { out += static_cast<char>(0xC0 | (c >> 6)); out += static_cast<char>(0x80 | (c & 0x3F)); }
        }
        return out;
    }

    // ---- HEADER
    void parseHeader() {
        std::string var;
        while (!atEnd() && !atMarker("ENDSEC") && !atMarker("EOF")) {
            const Group& g = cur();
            if (g.code == 9) var = std::string(trimView(g.value));
            else if (var == "$ACADVER" && g.code == 1) r_.acadVersion = std::string(trimView(g.value));
            else if (var == "$INSUNITS" && g.code == 70) insUnits_ = toInt(g.value);
            else if (var == "$LTSCALE" && g.code == 40) ltscale_ = toDouble(g.value);
            else if (var == "$DIMTXT" && g.code == 40) dimTxt_ = toDouble(g.value);
            else if (var == "$DIMASZ" && g.code == 40) dimAsz_ = toDouble(g.value);
            else if (var == "$DIMSCALE" && g.code == 40) dimScale_ = toDouble(g.value);
            else if (var == "$DIMDEC" && g.code == 70) dimDec_ = toInt(g.value);
            else if (var == "$CLAYER" && g.code == 8) clayer_ = decode(g.value);
            else if (var == "$MEASUREMENT" && g.code == 70) measurement_ = toInt(g.value);
            ++pos_;
        }
        if (atMarker("ENDSEC")) ++pos_;
        utf8_ = r_.acadVersion >= "AC1021";
    }

    void finishHeader() {
        static const std::map<long long, std::string> units = {
            {1, "in"}, {2, "ft"}, {3, "mi"}, {4, "mm"}, {5, "cm"}, {6, "m"}, {7, "km"}, {8, "uin"},
            {9, "mil"}, {10, "yd"}, {11, "A"}, {12, "nm"}, {13, "um"}, {14, "dm"}, {15, "dam"}, {16, "hm"}};
        if (insUnits_ && units.count(*insUnits_)) {
            r_.units = units.at(*insUnits_);
        } else {
            r_.unitsAssumed = true;
            r_.units = (measurement_ && *measurement_ == 0) ? "in" : "mm";
            r_.warnings.push_back("The file does not specify drawing units; assuming " +
                                  std::string(r_.units == "in" ? "inches (imperial drawing)." : "millimetres."));
        }
    }

    // ---- TABLES (layers)
    void parseTables() {
        std::size_t off = 0, frozen = 0;
        while (!atEnd() && !atMarker("ENDSEC") && !atMarker("EOF")) {
            if (atMarker("LAYER")) {
                ++pos_;
                Layer l;
                long long color = 7;
                bool hasTrue = false;
                std::uint32_t trueColor = 0;
                long long flags = 0;
                while (!atEnd() && cur().code != 0) {
                    switch (cur().code) {
                    case 2: l.name = decode(cur().value); break;
                    case 62: color = toInt(cur().value).value_or(7); break;
                    case 420: hasTrue = true; trueColor = static_cast<std::uint32_t>(toInt(cur().value).value_or(0)); break;
                    case 70: flags = toInt(cur().value).value_or(0); break;
                    case 6: l.linetype = decode(cur().value); break;
                    case 370: l.lineweight = static_cast<int>(toInt(cur().value).value_or(kLwDefault)); break;
                    case 290: l.plot = toInt(cur().value).value_or(1) != 0; break;
                    default: break;
                    }
                    ++pos_;
                }
                if (l.name.empty() || !StyleTables::validName(l.name)) continue;
                l.on = color >= 0;
                const int idx = static_cast<int>(color < 0 ? -color : color);
                l.color = hasTrue ? CadColor::fromRgb(trueColor) : CadColor::fromIndex(idx >= 1 && idx <= 255 ? idx : 7);
                l.frozen = (flags & 1) != 0;
                l.locked = (flags & 4) != 0;
                if (l.lineweight < 0) l.lineweight = kLwDefault;
                if (!l.on) ++off;
                if (l.frozen) ++frozen;
                if (Layer* existing = tables_.layer(l.name)) *existing = l; // layer "0" is predefined
                else tables_.addLayer(l);
                continue;
            }
            if (atMarker("LTYPE")) {
                ++pos_;
                Linetype lt;
                while (!atEnd() && cur().code != 0) {
                    if (cur().code == 2) lt.name = decode(cur().value);
                    else if (cur().code == 3) lt.description = decode(cur().value);
                    else if (cur().code == 49) lt.pattern.push_back(toDouble(cur().value).value_or(0.0));
                    ++pos_;
                }
                const std::string u = upperName(lt.name);
                if (!lt.name.empty() && u != "BYLAYER" && u != "BYBLOCK" && u != "CONTINUOUS") {
                    tables_.addLinetype(lt);
                    ++linetypesImported_;
                }
                continue;
            }
            ++pos_;
        }
        if (atMarker("ENDSEC")) ++pos_;
        r_.layerCount = tables_.layers().size();
        if (off || frozen)
            r_.warnings.push_back(std::to_string(off) + " layer(s) are turned off and " + std::to_string(frozen) +
                                  " frozen in the source drawing; their objects are imported but hidden (see the Layers panel).");
    }

    // ---- entity lists (ENTITIES section and block bodies)
    void readEntityList(std::vector<RawEntity>& list, const char* terminator) {
        while (!atEnd() && !atMarker(terminator) && !atMarker("EOF") && !atMarker("ENDSEC")) {
            if (cur().code != 0) { ++pos_; continue; }
            RawEntity e;
            e.type = std::string(trimView(cur().value));
            ++pos_;
            while (!atEnd() && cur().code != 0) e.groups.push_back(cur()), ++pos_;
            list.push_back(std::move(e));
        }
        if (atMarker(terminator)) ++pos_;
    }

    bool parseBlocks() {
        while (!atEnd() && !atMarker("ENDSEC") && !atMarker("EOF")) {
            if (!atMarker("BLOCK")) { ++pos_; continue; }
            ++pos_;
            RawEntity header;
            while (!atEnd() && cur().code != 0) header.groups.push_back(cur()), ++pos_;
            Block b;
            b.name = decode(header.str(2));
            b.base = {header.num(10), header.num(20)};
            b.xref = (header.integer(70) & 4) != 0;
            readEntityList(b.entities, "ENDBLK");
            // Skip the ENDBLK entity's own groups.
            while (!atEnd() && cur().code != 0) ++pos_;
            if (!b.name.empty()) blocks_[toUpperAscii(b.name)] = std::move(b);
        }
        if (atMarker("ENDSEC")) ++pos_;
        return true;
    }

    static std::string toUpperAscii(std::string s) {
        for (char& c : s)
            if (c >= 'a' && c <= 'z') c = static_cast<char>(c - 'a' + 'A');
        return s;
    }

    // ---- conversion
    void unsupported(const std::string& type) { r_.unsupported[type]++; }

    // OCS -> WCS for the extrusion directions that keep geometry in the XY plane.
    std::optional<Affine2D> ocs(const RawEntity& e) {
        const double nx = e.num(210, 0.0), ny = e.num(220, 0.0), nz = e.num(230, 1.0);
        const double len = std::sqrt(nx * nx + ny * ny + nz * nz);
        if (!(len > 0)) return Affine2D{};
        if (std::abs(nx / len) < 1e-9 && std::abs(ny / len) < 1e-9) {
            if (nz > 0) return Affine2D{};
            return Affine2D::scaling(-1.0, 1.0); // (0,0,-1): mirrored about the Y axis
        }
        ++nonPlanar_;
        return std::nullopt;
    }

    void checkZ(const RawEntity& e, std::initializer_list<int> codes) {
        for (int c : codes)
            if (e.num(c, 0.0) != 0.0) { ++nonZeroZ_; return; }
    }

    // Layer, colour, linetype, lineweight and linetype scale of a DXF entity,
    // resolving layer-0 / ByBlock inheritance from the enclosing INSERT.
    EntityStyle styleOf(const RawEntity& e) {
        EntityStyle st;
        const EntityStyle* parent = parents_.empty() ? nullptr : &parents_.back();
        st.layer = e.has(8) ? decode(e.find(8)->value) : std::string("0");
        if (st.layer.empty()) st.layer = "0";
        if (st.layer == "0" && parent) st.layer = parent->layer; // block content on layer 0 takes the INSERT's layer
        ensureLayer(st.layer);
        if (e.has(420)) st.color = CadColor::fromRgb(static_cast<std::uint32_t>(e.integer(420)));
        else if (e.has(62)) {
            const long long c = e.integer(62, 256);
            if (c == 0) st.color = CadColor::byBlock();
            else if (c >= 1 && c <= 255) st.color = CadColor::fromIndex(static_cast<int>(c));
        }
        if (e.has(6)) st.linetype = decode(e.find(6)->value);
        if (e.has(370)) st.lineweight = static_cast<int>(e.integer(370, kLwByLayer));
        if (e.has(48)) st.ltscale = e.num(48, 1.0) > 0 ? e.num(48, 1.0) : 1.0;
        if (parent) { // ByBlock: take the INSERT's (resolved) property
            const Layer* pl = tables_.layer(parent->layer);
            if (st.color.kind == CadColor::Kind::ByBlock)
                st.color = parent->color.kind == CadColor::Kind::ByLayer && pl ? pl->color : parent->color;
            if (upperName(st.linetype) == "BYBLOCK")
                st.linetype = upperName(parent->linetype) == "BYLAYER" && pl ? pl->linetype : parent->linetype;
            if (st.lineweight == kLwByBlock)
                st.lineweight = parent->lineweight == kLwByLayer && pl ? pl->lineweight : parent->lineweight;
        }
        if (upperName(st.linetype) != "BYLAYER" && upperName(st.linetype) != "BYBLOCK" && !tables_.linetype(st.linetype))
            missingLinetypes_.insert(st.linetype);
        return st;
    }

    void ensureLayer(const std::string& name) {
        if (tables_.hasLayer(name)) return;
        Layer l;
        l.name = name;
        tables_.addLayer(l);
        r_.layerCount = tables_.layers().size();
    }

    void addEntity(std::unique_ptr<Entity> local, const Affine2D& xf, const EntityStyle& style) {
        if (!local) return;
        std::unique_ptr<Entity> world = xf.isIdentity() ? std::move(local) : local->transformed(xf);
        if (!world) {
            // Circles and arcs in non-uniformly scaled blocks become exact ellipses.
            std::optional<EllipseGeom> g;
            if (local->type() == EntityType::Circle) {
                const auto& c = static_cast<const CircleEntity&>(*local);
                g = EllipseGeom{c.center(), {c.radius(), 0}, 1.0, 0.0, 2.0 * kPi};
            } else if (local->type() == EntityType::Arc) {
                const auto& a = static_cast<const ArcEntity&>(*local);
                const ArcGeom ag = a.geom();
                g = EllipseGeom{a.center(), {a.radius(), 0}, 1.0, ag.startAngle, ag.startAngle + ag.sweep};
            }
            if (g) world = EllipseEntity(*g).transformed(xf);
        }
        if (!world) { ++nonUniform_; return; }
        world->setStyle(style);
        out_.push_back(EntityPtr(std::move(world)));
    }

    void convertList(const std::vector<RawEntity>& list, const Affine2D& xf, int depth, bool topLevel) {
        for (std::size_t i = 0; i < list.size(); ++i) {
            const RawEntity& e = list[i];
            if (topLevel && e.integer(67, 0) == 1) {
                ++r_.paperSpaceSkipped;
                if (e.type == "POLYLINE") while (i + 1 < list.size() && list[i + 1].type != "SEQEND") ++i;
                continue;
            }
            if (e.type == "POLYLINE") {
                std::vector<const RawEntity*> verts;
                while (i + 1 < list.size() && list[i + 1].type == "VERTEX") verts.push_back(&list[++i]);
                if (i + 1 < list.size() && list[i + 1].type == "SEQEND") ++i;
                convertPolyline(e, verts, xf);
                continue;
            }
            if (e.type == "INSERT") {
                convertInsert(e, xf, depth);
                if (e.integer(66, 0) == 1) { // attributes follow
                    while (i + 1 < list.size() && list[i + 1].type == "ATTRIB") { ++i; unsupported("ATTRIB (block attribute text)"); }
                    if (i + 1 < list.size() && list[i + 1].type == "SEQEND") ++i;
                }
                continue;
            }
            convertSimple(e, xf);
        }
    }

    void invalid(const std::string& type) { r_.unsupported[type + " (invalid data)"]++; }

    void convertSimple(const RawEntity& e, const Affine2D& xf) {
        const std::string& t = e.type;
        if (t == "LINE") {
            if (!e.numValid(10) || !e.numValid(20) || !e.numValid(11) || !e.numValid(21)) return invalid(t);
            checkZ(e, {30, 31});
            addEntity(std::make_unique<LineEntity>(Vec2{e.num(10), e.num(20)}, Vec2{e.num(11), e.num(21)}), xf, styleOf(e));
        } else if (t == "CIRCLE" || t == "ARC") {
            const double r = e.num(40, -1.0);
            if (!e.numValid(10) || !e.numValid(20) || !(r > 0.0)) return invalid(t);
            auto o = ocs(e);
            if (!o) return;
            const Vec2 c{e.num(10), e.num(20)};
            std::unique_ptr<Entity> local;
            if (t == "CIRCLE") local = std::make_unique<CircleEntity>(c, r);
            else {
                const double a0 = e.num(50), a1 = e.num(51);
                if (std::fmod(std::abs(a1 - a0), 360.0) == 0.0) return invalid(t); // zero-length arc
                local = std::make_unique<ArcEntity>(c, r, a0, a1);
            }
            addEntity(std::move(local), xf * *o, styleOf(e));
        } else if (t == "POINT") {
            if (!e.numValid(10) || !e.numValid(20)) return invalid(t);
            checkZ(e, {30});
            addEntity(std::make_unique<PointEntity>(Vec2{e.num(10), e.num(20)}), xf, styleOf(e));
        } else if (t == "LWPOLYLINE") {
            auto o = ocs(e);
            if (!o) return;
            std::vector<Vec2> v;
            std::vector<double> b;
            for (const Group& g : e.groups) {
                if (g.code == 10) { v.push_back({toDouble(g.value).value_or(NAN), 0.0}); b.push_back(0.0); }
                else if (g.code == 20 && !v.empty()) v.back().y = toDouble(g.value).value_or(NAN);
                else if (g.code == 42 && !b.empty()) b.back() = toDouble(g.value).value_or(0.0);
            }
            // Constant width (43), or equal per-vertex widths (40/41).
            double w = e.num(43, 0.0);
            std::vector<double> sw;
            for (const Group& g : e.groups)
                if (g.code == 40 || g.code == 41) sw.push_back(toDouble(g.value).value_or(0.0));
            if (!sw.empty()) {
                bool same = true;
                for (double x : sw) same &= (x == sw.front());
                if (same) w = sw.front();
                else { ++varyingWidth_; w = 0.0; }
            }
            addPolyline(t, std::move(v), std::move(b), (e.integer(70) & 1) != 0, xf * *o, styleOf(e), w);
        } else if (t == "ELLIPSE") {
            EllipseGeom g;
            g.center = {e.num(10, NAN), e.num(20, NAN)};
            g.major = {e.num(11, NAN), e.num(21, NAN)};
            g.ratio = e.num(40, -1.0);
            g.startParam = e.num(41, 0.0);
            g.endParam = e.num(42, 2.0 * kPi);
            if (!g.center.isFinite() || !g.major.isFinite() || !(g.major.length() > 0) || !(g.ratio > 0) || g.ratio > 1.0 + 1e-9)
                return invalid(t);
            g.ratio = std::min(g.ratio, 1.0);
            const double nx = e.num(210, 0.0), ny = e.num(220, 0.0), nz = e.num(230, 1.0);
            if (std::abs(nx) > 1e-9 || std::abs(ny) > 1e-9) { ++nonPlanar_; return; }
            if (nz < 0) { // minor axis = N x major: reversed for N = (0,0,-1)
                const double s0 = g.startParam, e0 = g.endParam;
                g.startParam = -e0;
                g.endParam = -s0;
            }
            checkZ(e, {30});
            addEntity(std::make_unique<EllipseEntity>(g), xf, styleOf(e));
        } else if (t == "SPLINE") {
            NurbsCurve c;
            c.degree = static_cast<int>(e.integer(71, 3));
            std::vector<Vec2> fit;
            for (const Group& g : e.groups) {
                switch (g.code) {
                case 40: c.knots.push_back(toDouble(g.value).value_or(NAN)); break;
                case 41: c.weights.push_back(toDouble(g.value).value_or(NAN)); break;
                case 10: c.ctrl.push_back({toDouble(g.value).value_or(NAN), 0.0}); break;
                case 20: if (!c.ctrl.empty()) c.ctrl.back().y = toDouble(g.value).value_or(NAN); break;
                case 11: fit.push_back({toDouble(g.value).value_or(NAN), 0.0}); break;
                case 21: if (!fit.empty()) fit.back().y = toDouble(g.value).value_or(NAN); break;
                case 30: case 31: if (toDouble(g.value).value_or(0.0) != 0.0) zSpline_ = true; break;
                default: break;
                }
            }
            bool allOne = true;
            for (double w : c.weights) allOne &= (w == 1.0);
            if (allOne) c.weights.clear();
            if (c.ctrl.empty() && fit.size() >= 2) {
                auto ic = geom::interpolateSpline(fit, c.degree);
                if (!ic) return invalid(t);
                c = std::move(*ic);
            }
            if (!c.isValid()) return invalid(t);
            if (zSpline_) { ++nonZeroZ_; zSpline_ = false; }
            addEntity(std::make_unique<SplineEntity>(std::move(c)), xf, styleOf(e));
        } else if (t == "SOLID" || t == "TRACE") {
            auto o = ocs(e);
            if (!o) return;
            const Vec2 p0{e.num(10, NAN), e.num(20, NAN)}, p1{e.num(11, NAN), e.num(21, NAN)};
            const Vec2 p2{e.num(12, NAN), e.num(22, NAN)};
            const Vec2 p3 = e.has(13) ? Vec2{e.num(13, NAN), e.num(23, NAN)} : p2;
            // DXF corner order 1-2-4-3 is the outline order 1-2-3-4.
            std::vector<Vec2> v{p0, p1, p3};
            if (!nearlyEqual(p2, p3, 0.0)) v.push_back(p2);
            for (const Vec2& q : v)
                if (!q.isFinite()) return invalid(t);
            auto pl = std::make_unique<PolylineEntity>(std::move(v), true);
            pl->setFilled(true);
            addEntity(std::move(pl), xf * *o, styleOf(e));
        } else if (t == "XLINE" || t == "RAY") {
            const Vec2 base{e.num(10, NAN), e.num(20, NAN)}, dir{e.num(11, NAN), e.num(21, NAN)};
            if (!base.isFinite() || !dir.isFinite() || !(dir.length() > 0)) return invalid(t);
            checkZ(e, {30, 31});
            addEntity(std::make_unique<XLineEntity>(base, dir, t == "RAY"), xf, styleOf(e));
        } else if (t == "SEQEND" || t == "VERTEX" || t == "ENDBLK") {
            // structural; handled by their parents
        } else if (t == "TEXT") {
            convertText(e, xf);
        } else if (t == "MTEXT") {
            convertMText(e, xf);
        } else if (t == "DIMENSION") {
            convertDimension(e, xf);
        } else if (t == "LEADER") {
            std::vector<Vec2> pts;
            for (const Group& g : e.groups) {
                if (g.code == 10) pts.push_back({toDouble(g.value).value_or(NAN), 0.0});
                else if (g.code == 20 && !pts.empty()) pts.back().y = toDouble(g.value).value_or(NAN);
            }
            for (const Vec2& p : pts) if (!p.isFinite()) return invalid(t);
            if (pts.size() < 2) return invalid(t);
            auto l = std::make_unique<LeaderEntity>(std::move(pts), std::string());
            l->setDimStyle(dimStyle());
            addEntity(std::move(l), xf, styleOf(e));
        } else if (t == "ATTDEF") {
            unsupported(t + " (attribute definition)");
        } else if (t == "MULTILEADER" || t == "TOLERANCE" || t == "ARC_DIMENSION") {
            unsupported(t + " (annotation)");
        } else {
            unsupported(t);
        }
    }

    DimStyle dimStyle() const {
        DimStyle st;
        const double sc = (dimScale_ && *dimScale_ > 0) ? *dimScale_ : 1.0;
        if (dimTxt_ && *dimTxt_ > 0) st.textHeight = *dimTxt_ * sc;
        if (dimAsz_ && *dimAsz_ > 0) st.arrowSize = *dimAsz_ * sc;
        st.extOffset *= sc;
        st.extBeyond *= sc;
        st.textGap *= sc;
        if (dimDec_ && *dimDec_ >= 0 && *dimDec_ <= 8) st.precision = static_cast<int>(*dimDec_);
        return st;
    }

    // Text value with DXF control codes translated (%%c, %%d, %%p, \U+XXXX).
    std::string decodeText(std::string_view raw) const {
        std::string s = decode(raw);
        std::string out;
        for (std::size_t i = 0; i < s.size(); ++i) {
            if (s.compare(i, 2, "%%") == 0 && i + 2 < s.size()) {
                const char c = static_cast<char>(std::tolower(static_cast<unsigned char>(s[i + 2])));
                if (c == 'c') { out += "\xC3\x98"; i += 2; continue; }
                if (c == 'd') { out += "\xC2\xB0"; i += 2; continue; }
                if (c == 'p') { out += "\xC2\xB1"; i += 2; continue; }
                if (c == 'u' || c == 'o') { i += 2; continue; }
                if (c == '%') { out += '%'; i += 2; continue; }
            }
            if (s.compare(i, 3, "\\U+") == 0 && i + 7 <= s.size()) {
                const unsigned long cp = std::strtoul(s.substr(i + 3, 4).c_str(), nullptr, 16);
                if (cp > 0) { appendUtf8(out, static_cast<unsigned>(cp)); i += 6; continue; }
            }
            out += s[i];
        }
        return out;
    }

    static void appendUtf8(std::string& out, unsigned cp) {
        if (cp < 0x80) out += static_cast<char>(cp);
        else if (cp < 0x800) { out += static_cast<char>(0xC0 | (cp >> 6)); out += static_cast<char>(0x80 | (cp & 0x3F)); }
        else { out += static_cast<char>(0xE0 | (cp >> 12)); out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F)); out += static_cast<char>(0x80 | (cp & 0x3F)); }
    }

    // MTEXT inline formatting removed: \P = new paragraph, {\f..;} fonts etc.
    std::string stripMText(const std::string& s) const {
        std::string out;
        for (std::size_t i = 0; i < s.size(); ++i) {
            const char c = s[i];
            if (c == '{' || c == '}') continue;
            if (c == '\\' && i + 1 < s.size()) {
                const char k = s[i + 1];
                if (k == 'P') { out += '\n'; ++i; continue; }
                if (k == '~') { out += ' '; ++i; continue; }
                if (k == '\\' || k == '{' || k == '}') { out += k; ++i; continue; }
                if (k == 'S') { // stacked fraction a^b; -> a/b
                    const auto end = s.find(';', i);
                    if (end == std::string::npos) { ++i; continue; }
                    std::string frac = s.substr(i + 2, end - i - 2);
                    for (char& ch : frac) if (ch == '^' || ch == '#') ch = '/';
                    out += frac;
                    i = end;
                    continue;
                }
                if (std::string("LlOoKkNn").find(k) != std::string::npos) { ++i; continue; }
                if (std::string("fFHhCcTtQqWwAap").find(k) != std::string::npos) { // codes ending with ';'
                    const auto end = s.find(';', i);
                    i = end == std::string::npos ? s.size() : end;
                    continue;
                }
            }
            out += c;
        }
        return out;
    }

    void convertText(const RawEntity& e, const Affine2D& xf) {
        const double h = e.num(40, -1);
        if (!e.numValid(10) || !e.numValid(20) || !(h > 0)) return invalid("TEXT");
        auto o = ocs(e);
        if (!o) return;
        const int hj = static_cast<int>(e.integer(72, 0)), vj = static_cast<int>(e.integer(73, 0));
        TextJustify j = TextJustify::Left;
        Vec2 ins{e.num(10), e.num(20)};
        if ((hj != 0 || vj != 0) && e.numValid(11)) {
            const Vec2 al{e.num(11), e.num(21)};
            if (hj == 4 || (hj == 1 && vj == 2)) { j = TextJustify::Middle; ins = al; }
            else if (hj == 1) { j = TextJustify::Center; ins = al; }
            else if (hj == 2) { j = TextJustify::Right; ins = al; }
            else if (hj == 3 || hj == 5) { j = TextJustify::Left; } // aligned / fit: keep start point
            else if (vj == 2) { j = TextJustify::Middle; ins = al; }
        }
        auto t = std::make_unique<TextEntity>(ins, decodeText(e.find(1) ? e.find(1)->value : std::string_view()), h, e.num(50, 0.0), j);
        addEntity(std::move(t), xf * *o, styleOf(e));
    }

    void convertMText(const RawEntity& e, const Affine2D& xf) {
        const double h = e.num(40, -1);
        if (!e.numValid(10) || !e.numValid(20) || !(h > 0)) return invalid("MTEXT");
        std::string raw;
        for (const Group& g : e.groups) if (g.code == 3) raw += std::string(g.value);
        if (const Group* g = e.find(1)) raw += std::string(g->value);
        const std::string body = stripMText(decodeText(raw));
        double rot = 0;
        if (e.numValid(11)) rot = radToDeg(std::atan2(e.num(21), e.num(11)));
        else if (e.numValid(50)) rot = radToDeg(e.num(50));
        const int att = static_cast<int>(e.integer(71, 1));
        const TextJustify j = (att >= 4 && att <= 6) ? TextJustify::Middle : (att >= 7 ? TextJustify::Left : TextJustify::TopLeft);
        if (att != 1 && att != 5 && att != 7) ++approxMText_;
        auto t = std::make_unique<TextEntity>(Vec2{e.num(10), e.num(20)}, body, h, rot, j);
        t->setWrapWidth(e.num(41, 0.0));
        addEntity(std::move(t), xf, styleOf(e));
    }

    void convertDimension(const RawEntity& e, const Affine2D& xf) {
        const int type = static_cast<int>(e.integer(70, 0) & 0x0F);
        auto P = [&](int code) { return Vec2{e.num(code, NAN), e.num(code + 10, NAN)}; };
        std::unique_ptr<DimensionEntity> d;
        switch (type) {
        case 0: d = std::make_unique<DimensionEntity>(DimKind::Linear, P(13), P(14), P(10), e.num(50, 0.0)); break;
        case 1: d = std::make_unique<DimensionEntity>(DimKind::Aligned, P(13), P(14), P(10)); break;
        case 3: { // diameter: 15 and 10 are opposite ends
            const Vec2 a = P(10), b = P(15);
            d = std::make_unique<DimensionEntity>(DimKind::Diameter, (a + b) * 0.5, b, e.numValid(11) ? P(11) : b);
            break;
        }
        case 4: d = std::make_unique<DimensionEntity>(DimKind::Radius, P(10), P(15), e.numValid(11) ? P(11) : P(15)); break;
        case 2: { // two lines: 13-14 and 15-10, arc through 16
            auto x = geom::intersectLines(P(13), P(14), P(15), P(10));
            if (x.empty()) return invalid("DIMENSION");
            const Vec2 v = x[0];
            const Vec2 b = distance(v, P(14)) >= distance(v, P(13)) ? P(14) : P(13);
            const Vec2 c = distance(v, P(10)) >= distance(v, P(15)) ? P(10) : P(15);
            d = std::make_unique<DimensionEntity>(DimKind::Angular, v, b, P(16));
            d->setC(c);
            break;
        }
        case 5: d = std::make_unique<DimensionEntity>(DimKind::Angular, P(15), P(13), P(10)); d->setC(P(14)); break;
        default: unsupported("DIMENSION (ordinate)"); return;
        }
        for (const Vec2& q : d->gripPoints()) if (!q.isFinite()) return invalid("DIMENSION");
        d->setDimStyle(dimStyle());
        if (const Group* g = e.find(1)) {
            const std::string ov = stripMText(decodeText(g->value));
            if (!ov.empty() && ov != "<>") d->setTextOverride(ov == " " ? std::string() : ov);
        }
        addEntity(std::move(d), xf, styleOf(e));
    }

    void addPolyline(const std::string& type, std::vector<Vec2> v, std::vector<double> b, bool closed, const Affine2D& xf,
                     const EntityStyle& layer, double width = 0.0) {
        for (const Vec2& p : v)
            if (!p.isFinite()) return invalid(type);
        if (v.size() < 2) return invalid(type);
        auto pl = std::make_unique<PolylineEntity>(std::move(v), std::move(b), closed);
        pl->setWidth(width);
        addEntity(std::move(pl), xf, layer);
    }

    void convertPolyline(const RawEntity& e, const std::vector<const RawEntity*>& verts, const Affine2D& xf) {
        const long long flags = e.integer(70);
        if (flags & (16 | 64)) { unsupported(flags & 64 ? "POLYLINE (polyface mesh)" : "POLYLINE (3D mesh)"); return; }
        const bool is3d = (flags & 8) != 0;
        std::optional<Affine2D> o = is3d ? std::optional<Affine2D>(Affine2D{}) : ocs(e);
        if (!o) return;
        std::vector<Vec2> v;
        std::vector<double> b;
        for (const RawEntity* vx : verts) {
            if (vx->integer(70) & 16) continue; // spline frame control point (not on the curve)
            if (is3d) checkZ(*vx, {30});
            v.push_back({vx->num(10, NAN), vx->num(20, NAN)});
            b.push_back(is3d ? 0.0 : vx->num(42, 0.0));
        }
        double w = e.num(40, 0.0);
        if (e.num(41, w) != w) { ++varyingWidth_; w = 0.0; }
        for (const RawEntity* vx : verts)
            if ((vx->has(40) && vx->num(40) != w) || (vx->has(41) && vx->num(41) != w)) { ++varyingWidth_; w = 0.0; break; }
        addPolyline("POLYLINE", std::move(v), std::move(b), (flags & 1) != 0, xf * *o, styleOf(e), w);
    }

    void convertInsert(const RawEntity& e, const Affine2D& parent, int depth) {
        const std::string name = decode(e.str(2));
        auto it = blocks_.find(toUpperAscii(name));
        if (it == blocks_.end()) {
            r_.warnings.push_back("Block \"" + name + "\" is referenced but not defined; insertion skipped.");
            return;
        }
        const Block& blk = it->second;
        if (blk.xref) { xrefs_.insert(name); return; }
        if (depth >= kMaxBlockDepth) { ++tooDeep_; return; }
        auto o = ocs(e);
        if (!o) return;
        const double sx = e.num(41, 1.0), sy = e.num(42, 1.0);
        if (sx == 0.0 || sy == 0.0) return invalid("INSERT");
        const long long cols = std::max(1LL, e.integer(70, 1)), rows = std::max(1LL, e.integer(71, 1));
        if (cols * rows > 100000) return invalid("INSERT");
        const double dx = e.num(44, 0.0), dy = e.num(45, 0.0);
        const Affine2D place = Affine2D::translation({e.num(10), e.num(20)}) * Affine2D::rotationDeg(e.num(50, 0.0));
        const Affine2D local = Affine2D::scaling(sx, sy) * Affine2D::translation(-blk.base);
        parents_.push_back(styleOf(e));
        for (long long r = 0; r < rows; ++r)
            for (long long c = 0; c < cols; ++c) {
                const Affine2D xf = parent * *o * place * Affine2D::translation({c * dx, r * dy}) * local;
                convertList(blk.entities, xf, depth + 1, false);
                ++r_.blockInsertsExpanded;
            }
        parents_.pop_back();
    }

public:
    void finishWarnings() {
        if (nonZeroZ_)
            r_.warnings.push_back(std::to_string(nonZeroZ_) +
                                  " object(s) had non-zero Z coordinates and were projected onto the XY plane.");
        if (nonPlanar_)
            r_.warnings.push_back(std::to_string(nonPlanar_) +
                                  " object(s) lie in a tilted 3D plane (unusual extrusion direction) and were skipped.");
        if (nonUniform_)
            r_.warnings.push_back(std::to_string(nonUniform_) +
                                  " curved polyline(s) inside non-uniformly scaled blocks cannot be represented exactly "
                                  "and were skipped.");
        if (varyingWidth_)
            r_.warnings.push_back(std::to_string(varyingWidth_) +
                                  " polyline(s) have varying (tapered) widths; they are shown as thin centre lines.");
        if (!missingLinetypes_.empty()) {
            std::string names;
            for (const auto& n : missingLinetypes_) names += (names.empty() ? "" : ", ") + n;
            r_.warnings.push_back("Linetype(s) not defined in the file are drawn continuous: " + names + ".");
        }
        if (approxMText_)
            r_.warnings.push_back(std::to_string(approxMText_) +
                                  " multiline text(s) use an attachment point that is placed approximately.");
        if (tooDeep_) r_.warnings.push_back("Block nesting deeper than 32 levels (possibly circular) was skipped.");
        for (const auto& x : xrefs_)
            r_.warnings.push_back("External reference \"" + x + "\" was not loaded (xrefs are not supported yet).");
    }

private:
    DxfImportResult& r_;
    const std::vector<Group>* g_ = nullptr;
    std::size_t pos_ = 0;
    bool sawEntities_ = false;
    bool utf8_ = false;
    std::optional<long long> insUnits_, measurement_;
    std::unordered_map<std::string, Block> blocks_;
    std::vector<RawEntity> entities_;
    std::vector<EntityPtr> out_;
    std::size_t nonZeroZ_ = 0, nonPlanar_ = 0, nonUniform_ = 0, tooDeep_ = 0;
    bool zSpline_ = false;
    StyleTables tables_;
    std::vector<EntityStyle> parents_;
    std::set<std::string> missingLinetypes_;
    std::size_t linetypesImported_ = 0;
    std::optional<double> ltscale_, dimTxt_, dimAsz_, dimScale_;
    std::optional<long long> dimDec_;
    std::string clayer_;
    std::size_t varyingWidth_ = 0;
    std::size_t approxMText_ = 0;
    std::set<std::string> xrefs_;
};

} // namespace

DxfImportResult importDxf(const QByteArray& data, Document& doc) {
    DxfImportResult r;
    if (data.startsWith("AutoCAD Binary DXF")) {
        r.error = "This is a binary DXF file. Only ASCII DXF is supported; in AutoCAD use Save As > DXF with the "
                  "default (ASCII) format.";
        return r;
    }
    if (data.startsWith("AC10") || data.startsWith("AC1.")) {
        r.error = "This looks like a DWG file renamed to .dxf. DWG is not supported; save it as DXF in AutoCAD.";
        return r;
    }
    std::vector<Group> groups;
    bool sawEof = false;
    if (!tokenize(data, groups, r.error, sawEof)) return r;
    if (groups.empty()) { r.error = "The file is empty."; return r; }

    Importer imp(r);
    if (!imp.run(groups)) return r;
    imp.finishWarnings();
    if (!sawEof)
        r.warnings.insert(r.warnings.begin(),
                          "The file ends without the DXF end-of-file marker, so it may be incomplete (truncated "
                          "download or copy). Compare with the original drawing.");
    std::vector<EntityPtr> ents = imp.takeEntities();
    r.imported = ents.size();
    doc.reset(std::move(ents), r.units, imp.takeTables());
    r.ok = true;
    return r;
}

DxfImportResult importDxfFile(const QString& path, Document& doc) {
    DxfImportResult r;
    QFile f(path);
    if (!f.open(QIODevice::ReadOnly)) {
        r.error = "Cannot open \"" + path.toStdString() + "\": " + f.errorString().toStdString();
        return r;
    }
    if (f.size() > kMaxDxfSize) { r.error = "The DXF file is larger than 1 GB and cannot be imported."; return r; }
    return importDxf(f.readAll(), doc);
}

} // namespace dyncad
