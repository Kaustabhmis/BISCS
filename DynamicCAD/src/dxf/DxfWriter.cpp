// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
//
// DXF writer (AutoCAD 2000 / AC1015, ASCII). Structure: HEADER, CLASSES,
// TABLES (VPORT, LTYPE, LAYER, STYLE, VIEW, UCS, APPID, DIMSTYLE,
// BLOCK_RECORD), BLOCKS, ENTITIES, OBJECTS (named object dictionary with
// layouts, groups, multiline style and plot style dictionaries) and EOF.
// Every object has a unique handle and owner, as AutoCAD requires.
#include "dxf/DxfWriter.h"

#include "entities/Annotation.h"
#include "entities/ArcEntity.h"
#include "entities/BlockEntities.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/HatchEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "entities/XLineEntity.h"

#include <QFile>
#include <QSaveFile>

#include <charconv>
#include <cmath>
#include <cstdio>
#include <set>
#include <unordered_map>

namespace dyncad {

namespace {

std::string num(double v) {
    if (!std::isfinite(v)) v = 0.0;
    if (v == 0.0) return "0.0";
    char buf[64];
    auto r = std::to_chars(buf, buf + sizeof buf, v); // shortest round-trip representation
    std::string s(buf, r.ptr);
    if (s.find_first_of(".e") == std::string::npos) s += ".0";
    return s;
}

std::string hex(unsigned long long h) {
    char b[32];
    std::snprintf(b, sizeof b, "%llX", h);
    return b;
}

// UTF-8 -> DXF R2000 text in the declared ANSI_1252 code page: Latin-1
// characters (degree, plus-minus, diameter, multiply, ...) as single bytes,
// anything else as the \U+XXXX escape that AutoCAD understands.
std::string encodeText(const std::string& s) {
    std::string out;
    for (std::size_t i = 0; i < s.size();) {
        const unsigned char c = static_cast<unsigned char>(s[i]);
        unsigned cp = c;
        int len = 1;
        if (c >= 0xF0) { cp = c & 0x07; len = 4; }
        else if (c >= 0xE0) { cp = c & 0x0F; len = 3; }
        else if (c >= 0xC0) { cp = c & 0x1F; len = 2; }
        if (i + len > s.size()) { len = 1; cp = '?'; }
        for (int k = 1; k < len; ++k) cp = (cp << 6) | (static_cast<unsigned char>(s[i + k]) & 0x3F);
        i += len;
        if (cp == '\r' || cp == '\n') continue;
        if (cp < 0x80) out += static_cast<char>(cp);
        else if (cp >= 0xA0 && cp <= 0xFF) out += static_cast<char>(cp);
        else if (cp <= 0xFFFF) {
            char b[16];
            std::snprintf(b, sizeof b, "\\U+%04X", cp);
            out += b;
        } else out += '?';
    }
    return out;
}

// MTEXT body: escapes and \P paragraph breaks.
std::string encodeMText(const std::string& s) {
    std::string t;
    for (char c : s) {
        if (c == '\\') t += "\\\\";
        else if (c == '{') t += "\\{";
        else if (c == '}') t += "\\}";
        else if (c == '\n') t += "\\P";
        else t += c;
    }
    return encodeText(t);
}

int nearestAci(std::uint32_t rgb) {
    int best = 7;
    long bestD = 1L << 60;
    for (int i = 1; i <= 255; ++i) {
        const std::uint32_t c = colorIndexToRgb(i);
        const long dr = long((c >> 16) & 255) - long((rgb >> 16) & 255), dg = long((c >> 8) & 255) - long((rgb >> 8) & 255),
                   db = long(c & 255) - long(rgb & 255);
        const long d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = i; }
    }
    return best;
}

int insUnits(const std::string& u) {
    static const std::map<std::string, int> m = {{"in", 1}, {"ft", 2}, {"mi", 3}, {"mm", 4}, {"cm", 5}, {"m", 6}, {"km", 7}, {"uin", 8}};
    auto it = m.find(u);
    return it == m.end() ? 0 : it->second;
}

std::string fontFile(const std::string& family) {
    std::string f = upperName(family);
    if (f == "ARIAL" || f.empty()) return "arial.ttf";
    if (f == "COURIER NEW") return "cour.ttf";
    if (f == "TIMES NEW ROMAN") return "times.ttf";
    if (f == "ISOCPEUR") return "isocpeur.ttf";
    std::string s;
    for (char c : family) if (c != ' ') s += static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    return s + ".ttf";
}

class Writer {
public:
    Writer(const Document& doc, DxfExportResult& r) : doc_(doc), r_(r) {}

    QByteArray run() {
        collectBlocks();
        collectFonts();
        // Fixed structural handles.
        hRoot_ = next(); hGroup_ = next(); hLayoutDict_ = next(); hMline_ = next(); hMlineStd_ = next();
        hPlotSettings_ = next(); hPlotStyleName_ = next(); hPlaceholder_ = next();
        hVportT_ = next(); hLtypeT_ = next(); hLayerT_ = next(); hStyleT_ = next(); hViewT_ = next(); hUcsT_ = next();
        hAppidT_ = next(); hDimT_ = next(); hBrT_ = next();
        hMsBr_ = next(); hPsBr_ = next(); hMsLayout_ = next(); hPsLayout_ = next();
        hStandardStyle_ = next();
        for (const auto& b : blockOrder_) blockBr_[b->name] = next();

        // Body first (handles are assigned while writing), header last for $HANDSEED.
        std::string entities;
        out_ = &entities;
        for (const auto& e : doc_.entities()) { writeEntity(*e, hMsBr_); ++r_.entities; }
        std::string blocks;
        out_ = &blocks;
        writeBlocks();
        std::string tables;
        out_ = &tables;
        writeTables();
        std::string objects;
        out_ = &objects;
        writeObjects();
        std::string header;
        out_ = &header;
        writeHeader();

        std::string all;
        all.reserve(header.size() + tables.size() + blocks.size() + entities.size() + objects.size() + 4096);
        all += header;
        all += sectionStart("CLASSES");
        all += classesText();
        all += "  0\nENDSEC\n";
        all += sectionStart("TABLES") + tables + "  0\nENDSEC\n";
        all += sectionStart("BLOCKS") + blocks + "  0\nENDSEC\n";
        all += sectionStart("ENTITIES") + entities + "  0\nENDSEC\n";
        all += sectionStart("OBJECTS") + objects + "  0\nENDSEC\n";
        all += "  0\nEOF\n";
        r_.ok = true;
        r_.blocks = blockOrder_.size();
        return QByteArray::fromStdString(all);
    }

private:
    // ---------------------------------------------------------------- output
    void g(int code, const std::string& v) {
        char b[16];
        std::snprintf(b, sizeof b, "%3d\n", code);
        *out_ += b;
        *out_ += v;
        *out_ += '\n';
    }
    void g(int code, int v) { g(code, std::to_string(v)); }
    void gd(int code, double v) { g(code, num(v)); }
    void gh(int code, unsigned long long h) { g(code, hex(h)); }
    void gp(int code, const Vec2& p, bool z = true) {
        gd(code, p.x);
        gd(code + 10, p.y);
        if (z) gd(code + 20, 0.0);
    }
    static std::string sectionStart(const char* name) { return std::string("  0\nSECTION\n  2\n") + name + "\n"; }
    unsigned long long next() { return handle_++; }

    // ---------------------------------------------------------------- collection
    void collectBlock(const BlockDefPtr& b) {
        if (!b || seenBlocks_.count(upperName(b->name))) return;
        seenBlocks_.insert(upperName(b->name));
        for (const auto& e : b->entities)
            if (e->type() == EntityType::Insert) collectBlock(static_cast<const InsertEntity&>(*e).block());
        blockOrder_.push_back(b); // nested definitions first
    }
    void collectBlocks() {
        for (const auto& kv : doc_.blocks()) collectBlock(kv.second);
        for (const auto& e : doc_.entities())
            if (e->type() == EntityType::Insert) collectBlock(static_cast<const InsertEntity&>(*e).block());
    }
    void noteFont(const std::string& f) {
        if (!f.empty() && upperName(f) != "ARIAL") fonts_.insert(f);
    }
    void collectFontsIn(const Entity& e) {
        if (e.type() == EntityType::Text) noteFont(static_cast<const TextEntity&>(e).font());
        else if (e.type() == EntityType::Dimension) noteFont(static_cast<const DimensionEntity&>(e).dimStyle().font);
        else if (e.type() == EntityType::Leader) noteFont(static_cast<const LeaderEntity&>(e).dimStyle().font);
    }
    void collectFonts() {
        for (const auto& e : doc_.entities()) collectFontsIn(*e);
        for (const auto& b : blockOrder_) for (const auto& e : b->entities) collectFontsIn(*e);
    }
    std::string styleFor(const std::string& font) const {
        if (font.empty() || upperName(font) == "ARIAL") return "Standard";
        return font;
    }

    // ---------------------------------------------------------------- entities
    void common(const char* type, const Entity& e, unsigned long long owner, const char* subclass) {
        g(0, type);
        gh(5, next());
        gh(330, owner);
        g(100, "AcDbEntity");
        const EntityStyle& s = e.style();
        g(8, encodeText(s.layer.empty() ? "0" : s.layer));
        if (upperName(s.linetype) != "BYLAYER" && !s.linetype.empty()) g(6, encodeText(s.linetype));
        switch (s.color.kind) {
        case CadColor::Kind::ByLayer: break;
        case CadColor::Kind::ByBlock: g(62, 0); break;
        case CadColor::Kind::Index: g(62, s.color.index); break;
        case CadColor::Kind::Rgb:
            g(62, nearestAci(s.color.rgb));
            g(420, static_cast<int>(s.color.rgb));
            break;
        }
        if (s.lineweight != kLwByLayer) g(370, s.lineweight);
        if (s.ltscale != 1.0) gd(48, s.ltscale);
        if (subclass) g(100, subclass);
    }

    void writeHatchLoops(const std::vector<HatchLoop>& loops) {
        g(91, static_cast<int>(loops.size()));
        for (const auto& l : loops) {
            bool hasBulge = false;
            for (double b : l.bulges) hasBulge = hasBulge || b != 0.0;
            g(92, 2 | 1); // polyline, external
            g(72, hasBulge ? 1 : 0);
            g(73, 1);
            g(93, static_cast<int>(l.vertices.size()));
            for (std::size_t i = 0; i < l.vertices.size(); ++i) {
                gp(10, l.vertices[i], false);
                if (hasBulge) gd(42, i < l.bulges.size() ? l.bulges[i] : 0.0);
            }
            g(97, 0);
        }
    }

    void writeHatch(const Entity& e, const std::vector<HatchLoop>& loops, const HatchPattern& pat, unsigned long long owner) {
        common("HATCH", e, owner, "AcDbHatch");
        gp(10, {0, 0});
        gd(210, 0); gd(220, 0); gd(230, 1);
        g(2, pat.solid ? "SOLID" : encodeText(pat.name));
        g(70, pat.solid ? 1 : 0);
        g(71, 0);
        writeHatchLoops(loops);
        g(75, 1); // odd parity (holes)
        g(76, 1); // predefined pattern
        if (!pat.solid) {
            gd(52, pat.angle);
            gd(41, pat.scale);
            g(77, 0);
            g(78, static_cast<int>(pat.families.size()));
            for (const auto& f : pat.families) {
                gd(53, f.angleDeg);
                gd(43, f.origin.x); gd(44, f.origin.y);
                gd(45, f.offset.x); gd(46, f.offset.y);
                g(79, static_cast<int>(f.dashes.size()));
                for (double d : f.dashes) gd(49, d);
            }
        }
        g(98, 0);
    }

    void writeText(const Entity& e, const Vec2& ins, const std::string& text, double h, double rot, TextJustify j,
                   const std::string& font, double wrap, unsigned long long owner) {
        const bool multi = text.find('\n') != std::string::npos || wrap > 0 || j == TextJustify::TopLeft;
        if (!multi) {
            common("TEXT", e, owner, "AcDbText");
            gp(10, ins);
            gd(40, h);
            g(1, encodeText(text));
            if (rot != 0.0) gd(50, rot);
            g(7, encodeText(styleFor(font)));
            int hj = 0, vj = 0;
            if (j == TextJustify::Center) hj = 1;
            else if (j == TextJustify::Right) hj = 2;
            else if (j == TextJustify::Middle) { hj = 1; vj = 2; }
            if (hj) g(72, hj);
            if (hj || vj) gp(11, ins);
            g(100, "AcDbText");
            if (vj) g(73, vj);
            return;
        }
        common("MTEXT", e, owner, "AcDbMText");
        gp(10, ins);
        gd(40, h);
        gd(41, wrap > 0 ? wrap : 0.0);
        int att = 7;
        switch (j) {
        case TextJustify::TopLeft: att = 1; break;
        case TextJustify::Middle: att = 5; break;
        case TextJustify::Left: att = 7; break;
        case TextJustify::Center: att = 8; break;
        case TextJustify::Right: att = 9; break;
        }
        g(71, att);
        g(72, 1);
        std::string body = encodeMText(text);
        while (body.size() > 250) { g(3, body.substr(0, 250)); body.erase(0, 250); }
        g(1, body);
        g(7, encodeText(styleFor(font)));
        const double r = degToRad(rot);
        gd(11, std::cos(r)); gd(21, std::sin(r)); gd(31, 0);
    }

    void writeGraphics(const AnnotationGraphics& gr, const Entity& styleSrc, unsigned long long owner) {
        for (const auto& l : gr.lines) {
            common("LINE", styleSrc, owner, "AcDbLine");
            gp(10, l.first);
            gp(11, l.second);
        }
        for (const auto& a : gr.arrows) {
            common("SOLID", styleSrc, owner, "AcDbTrace");
            gp(10, a[0]); gp(11, a[1]); gp(12, a[2]); gp(13, a[2]);
        }
        for (const auto& t : gr.texts) writeText(styleSrc, t.position, t.text, t.height, t.rotationDeg, t.justify, t.font, 0.0, owner);
    }

    void writeDimension(const DimensionEntity& d, unsigned long long owner) {
        // Anonymous block with the dimension's graphics, as AutoCAD expects.
        const std::string blk = "*D" + std::to_string(++dimCount_);
        dimBlocks_.push_back({blk, &d});
        const Vec2 a = d.a(), b = d.b(), loc = d.location();
        int type = 0;
        Vec2 def = loc, textPos = loc;
        for (const auto& t : d.graphics().texts) { textPos = t.position; break; }
        switch (d.kind()) {
        case DimKind::Linear: {
            type = 0;
            const double r = degToRad(d.angleDeg());
            const Vec2 u{std::cos(r), std::sin(r)}, n{-u.y, u.x};
            def = b + n * (loc - b).dot(n); // dimension line end at the second extension line
            break;
        }
        case DimKind::Aligned: {
            type = 1;
            Vec2 u = b - a;
            u = u.length() > 0 ? u / u.length() : Vec2{1, 0};
            const Vec2 n{-u.y, u.x};
            def = b + n * (loc - b).dot(n);
            break;
        }
        case DimKind::Angular: type = 5; def = loc; break;
        case DimKind::Radius: type = 4; def = a; break;
        case DimKind::Diameter: type = 3; def = a * 2.0 - b; break;
        }
        common("DIMENSION", d, owner, "AcDbDimension");
        g(2, blk);
        gp(10, def);
        gp(11, textPos);
        g(70, type | 32);
        g(1, encodeText(d.textOverride()));
        g(3, "Standard");
        switch (d.kind()) {
        case DimKind::Linear:
        case DimKind::Aligned:
            g(100, "AcDbAlignedDimension");
            gp(13, a);
            gp(14, b);
            if (d.kind() == DimKind::Linear) { gd(50, d.angleDeg()); g(100, "AcDbRotatedDimension"); }
            break;
        case DimKind::Angular:
            g(100, "AcDb3PointAngularDimension");
            gp(13, b);
            gp(14, d.c());
            gp(15, a);
            break;
        case DimKind::Radius:
            g(100, "AcDbRadialDimension");
            gp(15, b);
            gd(40, 0.0);
            break;
        case DimKind::Diameter:
            g(100, "AcDbDiametricDimension");
            gp(15, b);
            gd(40, 0.0);
            break;
        }
    }

    void writeEntity(const Entity& e, unsigned long long owner) {
        switch (e.type()) {
        case EntityType::Line: {
            const auto& l = static_cast<const LineEntity&>(e);
            common("LINE", e, owner, "AcDbLine");
            gp(10, l.start());
            gp(11, l.end());
            break;
        }
        case EntityType::Circle: {
            const auto& c = static_cast<const CircleEntity&>(e);
            common("CIRCLE", e, owner, "AcDbCircle");
            gp(10, c.center());
            gd(40, c.radius());
            break;
        }
        case EntityType::Arc: {
            const auto& a = static_cast<const ArcEntity&>(e);
            common("ARC", e, owner, "AcDbCircle");
            gp(10, a.center());
            gd(40, a.radius());
            g(100, "AcDbArc");
            gd(50, a.startDeg());
            gd(51, a.endDeg());
            break;
        }
        case EntityType::Point: {
            common("POINT", e, owner, "AcDbPoint");
            gp(10, static_cast<const PointEntity&>(e).position());
            break;
        }
        case EntityType::Polyline: {
            const auto& p = static_cast<const PolylineEntity&>(e);
            if (p.isFilled()) {
                writeHatch(e, {HatchLoop{p.vertices(), p.bulges()}}, makeHatchPattern("SOLID", 1, 0), owner);
                ++r_.notes["Filled polyline written as polyline + solid hatch"];
            }
            common("LWPOLYLINE", e, owner, "AcDbPolyline");
            g(90, static_cast<int>(p.vertices().size()));
            g(70, p.isClosed() ? 1 : 0);
            if (p.width() > 0) gd(43, p.width());
            for (std::size_t i = 0; i < p.vertices().size(); ++i) {
                gp(10, p.vertices()[i], false);
                const double b = i < p.bulges().size() ? p.bulges()[i] : 0.0;
                if (b != 0.0) gd(42, b);
            }
            break;
        }
        case EntityType::Ellipse: {
            const EllipseGeom& el = static_cast<const EllipseEntity&>(e).geom();
            common("ELLIPSE", e, owner, "AcDbEllipse");
            gp(10, el.center);
            gp(11, el.major);
            gd(40, el.ratio);
            gd(41, el.startParam);
            gd(42, el.endParam);
            break;
        }
        case EntityType::Spline: {
            const NurbsCurve& c = static_cast<const SplineEntity&>(e).curve();
            common("SPLINE", e, owner, "AcDbSpline");
            gd(210, 0); gd(220, 0); gd(230, 1);
            g(70, 8 | (c.weights.empty() ? 0 : 4));
            g(71, c.degree);
            g(72, static_cast<int>(c.knots.size()));
            g(73, static_cast<int>(c.ctrl.size()));
            g(74, 0);
            gd(42, 1e-10); gd(43, 1e-10);
            for (double k : c.knots) gd(40, k);
            for (double w : c.weights) gd(41, w);
            for (const Vec2& p : c.ctrl) gp(10, p);
            break;
        }
        case EntityType::XLine: {
            const auto& x = static_cast<const XLineEntity&>(e);
            common(x.isRay() ? "RAY" : "XLINE", e, owner, x.isRay() ? "AcDbRay" : "AcDbXline");
            gp(10, x.base());
            Vec2 d = x.direction();
            if (d.length() > 0) d = d / d.length();
            gp(11, d);
            break;
        }
        case EntityType::Text: {
            const auto& t = static_cast<const TextEntity&>(e);
            writeText(e, t.insert(), t.text(), t.height(), t.rotationDeg(), t.justify(), t.font(), t.wrapWidth(), owner);
            break;
        }
        case EntityType::Dimension:
            writeDimension(static_cast<const DimensionEntity&>(e), owner);
            break;
        case EntityType::Leader: {
            const auto& l = static_cast<const LeaderEntity&>(e);
            common("LEADER", e, owner, "AcDbLeader");
            g(3, "Standard");
            g(71, 1);   // arrowhead
            g(72, 0);   // straight
            g(73, 3);   // no annotation object (the text follows as MTEXT)
            g(74, 0);
            g(75, 0);
            gd(40, l.dimStyle().textHeight);
            gd(41, 0.0);
            g(76, static_cast<int>(l.points().size()));
            for (const Vec2& p : l.points()) gp(10, p);
            for (const auto& t : l.graphics().texts)
                writeText(e, t.position, t.text, t.height, t.rotationDeg, t.justify, t.font, 0.0, owner);
            if (!l.text().empty()) ++r_.notes["Leader text written as separate MTEXT"];
            break;
        }
        case EntityType::Insert: {
            const auto& i = static_cast<const InsertEntity&>(e);
            common("INSERT", e, owner, "AcDbBlockReference");
            g(2, encodeText(i.block()->name));
            gp(10, i.position());
            if (i.scaleX() != 1.0) gd(41, i.scaleX());
            if (i.scaleY() != 1.0) gd(42, i.scaleY());
            if (i.scaleX() != 1.0 || i.scaleY() != 1.0) gd(43, 1.0);
            if (i.rotationDeg() != 0.0) gd(50, i.rotationDeg());
            break;
        }
        case EntityType::Hatch: {
            const auto& h = static_cast<const HatchEntity&>(e);
            writeHatch(e, h.loops(), h.pattern(), owner);
            break;
        }
        }
    }

    // ---------------------------------------------------------------- sections
    void writeHeader() {
        *out_ += sectionStart("HEADER");
        auto var = [&](const char* name) { g(9, name); };
        var("$ACADVER"); g(1, "AC1015");
        var("$DWGCODEPAGE"); g(3, "ANSI_1252");
        var("$INSBASE"); gp(10, {0, 0});
        BoundingBox ext = doc_.extents();
        if (!ext.isValid()) ext = BoundingBox({0, 0}, {420, 297});
        var("$EXTMIN"); gp(10, ext.min);
        var("$EXTMAX"); gp(10, ext.max);
        var("$LIMMIN"); gp(10, {0, 0}, false);
        var("$LIMMAX"); gp(10, {420, 297}, false);
        var("$LTSCALE"); gd(40, doc_.styles().ltscale());
        var("$CLAYER"); g(8, encodeText(doc_.styles().currentLayer()));
        var("$DIMSTYLE"); g(2, "Standard");
        const DimStyle ds = firstDimStyle();
        var("$DIMASZ"); gd(40, ds.arrowSize);
        var("$DIMEXO"); gd(40, ds.extOffset);
        var("$DIMEXE"); gd(40, ds.extBeyond);
        var("$DIMTXT"); gd(40, ds.textHeight);
        var("$DIMGAP"); gd(40, ds.textGap);
        var("$DIMDEC"); g(70, ds.precision);
        var("$INSUNITS"); g(70, insUnits(doc_.units()));
        var("$MEASUREMENT"); g(70, doc_.units() == "in" || doc_.units() == "ft" ? 0 : 1);
        var("$LWDISPLAY"); g(290, 0);
        var("$PSTYLEMODE"); g(290, 1);
        var("$HANDSEED"); gh(5, handle_ + 1);
        *out_ += "  0\nENDSEC\n";
    }

    DimStyle firstDimStyle() const {
        for (const auto& e : doc_.entities())
            if (e->type() == EntityType::Dimension) return static_cast<const DimensionEntity&>(*e).dimStyle();
        return DimStyle{};
    }

    static std::string classesText() {
        std::string s;
        auto cls = [&](const char* dxf, const char* cpp, int flags) {
            s += "  0\nCLASS\n  1\n" + std::string(dxf) + "\n  2\n" + cpp + "\n  3\nObjectDBX Classes\n 90\n" + std::to_string(flags) +
                 "\n280\n0\n281\n0\n";
        };
        cls("ACDBDICTIONARYWDFLT", "AcDbDictionaryWithDefault", 0);
        cls("ACDBPLACEHOLDER", "AcDbPlaceHolder", 0);
        cls("LAYOUT", "AcDbLayout", 0);
        return s;
    }

    void tableStart(const char* name, unsigned long long h, int count) {
        g(0, "TABLE");
        g(2, name);
        gh(5, h);
        gh(330, 0);
        g(100, "AcDbSymbolTable");
        g(70, count);
    }
    void record(const char* type, unsigned long long table, const char* subclass) {
        g(0, type);
        gh(5, next());
        gh(330, table);
        g(100, "AcDbSymbolTableRecord");
        g(100, subclass);
    }

    void writeTables() {
        // VPORT
        tableStart("VPORT", hVportT_, 1);
        record("VPORT", hVportT_, "AcDbViewportTableRecord");
        BoundingBox ext = doc_.extents();
        if (!ext.isValid()) ext = BoundingBox({0, 0}, {420, 297});
        g(2, "*Active"); g(70, 0);
        gd(10, 0); gd(20, 0); gd(11, 1); gd(21, 1);
        gd(12, ext.center().x); gd(22, ext.center().y);
        gd(13, 0); gd(23, 0); gd(14, 10); gd(24, 10); gd(15, 10); gd(25, 10);
        gd(16, 0); gd(26, 0); gd(36, 1); gd(17, 0); gd(27, 0); gd(37, 0);
        gd(40, std::max(1e-6, ext.height() * 1.1)); gd(41, std::max(0.1, ext.height() > 0 ? ext.width() / ext.height() : 1.4));
        gd(42, 50); gd(43, 0); gd(44, 0); gd(50, 0); gd(51, 0);
        g(71, 0); g(72, 1000); g(73, 1); g(74, 3); g(75, 0); g(76, 0); g(77, 0); g(78, 0);
        g(0, "ENDTAB");
        // LTYPE
        std::vector<const Linetype*> lts;
        for (const auto& lt : doc_.styles().linetypes())
            if (upperName(lt.name) != "CONTINUOUS" && upperName(lt.name) != "BYLAYER" && upperName(lt.name) != "BYBLOCK") lts.push_back(&lt);
        tableStart("LTYPE", hLtypeT_, static_cast<int>(lts.size() + 3));
        for (const char* n : {"ByBlock", "ByLayer", "Continuous"}) {
            record("LTYPE", hLtypeT_, "AcDbLinetypeTableRecord");
            g(2, n); g(70, 0); g(3, std::string(n) == "Continuous" ? "Solid line" : ""); g(72, 65); g(73, 0); gd(40, 0);
        }
        for (const Linetype* lt : lts) {
            record("LTYPE", hLtypeT_, "AcDbLinetypeTableRecord");
            g(2, encodeText(lt->name)); g(70, 0); g(3, encodeText(lt->description)); g(72, 65);
            g(73, static_cast<int>(lt->pattern.size()));
            gd(40, lt->patternLength());
            for (double d : lt->pattern) { gd(49, d); g(74, 0); }
        }
        g(0, "ENDTAB");
        // LAYER
        const auto& layers = doc_.styles().layers();
        tableStart("LAYER", hLayerT_, static_cast<int>(layers.size()));
        for (const Layer& l : layers) {
            record("LAYER", hLayerT_, "AcDbLayerTableRecord");
            g(2, encodeText(l.name));
            g(70, (l.frozen ? 1 : 0) | (l.locked ? 4 : 0));
            int aci = 7;
            if (l.color.kind == CadColor::Kind::Index) aci = l.color.index;
            else if (l.color.kind == CadColor::Kind::Rgb) aci = nearestAci(l.color.rgb);
            g(62, l.on ? aci : -aci);
            if (l.color.kind == CadColor::Kind::Rgb) g(420, static_cast<int>(l.color.rgb));
            g(6, encodeText(l.linetype.empty() ? std::string(kContinuous) : l.linetype));
            if (!l.plot) g(290, 0);
            g(370, l.lineweight);
            gh(390, hPlaceholder_);
        }
        g(0, "ENDTAB");
        // STYLE
        tableStart("STYLE", hStyleT_, static_cast<int>(fonts_.size() + 1));
        auto style = [&](const std::string& name, const std::string& font, unsigned long long h) {
            g(0, "STYLE"); gh(5, h); gh(330, hStyleT_);
            g(100, "AcDbSymbolTableRecord"); g(100, "AcDbTextStyleTableRecord");
            g(2, encodeText(name)); g(70, 0); gd(40, 0); gd(41, 1); gd(50, 0); g(71, 0); gd(42, 2.5);
            g(3, fontFile(font)); g(4, "");
        };
        style("Standard", "Arial", hStandardStyle_);
        for (const auto& f : fonts_) style(f, f, next());
        g(0, "ENDTAB");
        tableStart("VIEW", hViewT_, 0);
        g(0, "ENDTAB");
        tableStart("UCS", hUcsT_, 0);
        g(0, "ENDTAB");
        tableStart("APPID", hAppidT_, 1);
        record("APPID", hAppidT_, "AcDbRegAppTableRecord");
        g(2, "ACAD"); g(70, 0);
        g(0, "ENDTAB");
        // DIMSTYLE
        tableStart("DIMSTYLE", hDimT_, 1);
        g(100, "AcDbDimStyleTable");
        g(0, "DIMSTYLE"); gh(105, next()); gh(330, hDimT_);
        g(100, "AcDbSymbolTableRecord"); g(100, "AcDbDimStyleTableRecord");
        const DimStyle ds = firstDimStyle();
        g(2, "Standard"); g(70, 0);
        gd(41, ds.arrowSize); gd(42, ds.extOffset); gd(44, ds.extBeyond); gd(140, ds.textHeight); gd(147, ds.textGap);
        g(77, 1); g(271, ds.precision); g(278, 46); g(78, ds.suppressZeros ? 8 : 0);
        gh(340, hStandardStyle_);
        g(0, "ENDTAB");
        // BLOCK_RECORD
        tableStart("BLOCK_RECORD", hBrT_, static_cast<int>(2 + blockOrder_.size() + dimBlocks_.size()));
        auto br = [&](const std::string& name, unsigned long long h, unsigned long long layout) {
            g(0, "BLOCK_RECORD"); gh(5, h); gh(330, hBrT_);
            g(100, "AcDbSymbolTableRecord"); g(100, "AcDbBlockTableRecord");
            g(2, encodeText(name));
            gh(340, layout);
        };
        br("*Model_Space", hMsBr_, hMsLayout_);
        br("*Paper_Space", hPsBr_, hPsLayout_);
        for (const auto& b : blockOrder_) br(b->name, blockBr_.at(b->name), 0);
        for (auto& d : dimBlocks_) br(d.name, d.br, 0);
        g(0, "ENDTAB");
    }

    void blockBegin(const std::string& name, unsigned long long br, int flags, bool paper = false) {
        g(0, "BLOCK"); gh(5, next()); gh(330, br);
        g(100, "AcDbEntity");
        if (paper) g(67, 1);
        g(8, "0");
        g(100, "AcDbBlockBegin");
        g(2, encodeText(name)); g(70, flags);
        gp(10, {0, 0});
        g(3, encodeText(name)); g(1, "");
    }
    void blockEnd(unsigned long long br, bool paper = false) {
        g(0, "ENDBLK"); gh(5, next()); gh(330, br);
        g(100, "AcDbEntity");
        if (paper) g(67, 1);
        g(8, "0");
        g(100, "AcDbBlockEnd");
    }

    void writeBlocks() {
        blockBegin("*Model_Space", hMsBr_, 0);
        blockEnd(hMsBr_);
        blockBegin("*Paper_Space", hPsBr_, 0, true);
        blockEnd(hPsBr_, true);
        for (const auto& b : blockOrder_) {
            const unsigned long long h = blockBr_.at(b->name);
            blockBegin(b->name, h, 0);
            for (const auto& e : b->entities) writeEntity(*e, h);
            blockEnd(h);
        }
        // Dimension graphics blocks (dimensions inside blocks may add more while writing).
        for (std::size_t i = 0; i < dimBlocks_.size(); ++i) {
            dimBlocks_[i].br = next();
            const DimBlock d = dimBlocks_[i];
            blockBegin(d.name, d.br, 1);
            writeGraphics(d.dim->graphics(), *d.dim, d.br);
            blockEnd(d.br);
        }
    }

    void dictStart(unsigned long long h, unsigned long long owner) {
        g(0, "DICTIONARY"); gh(5, h); gh(330, owner);
        g(100, "AcDbDictionary"); g(281, 1);
    }

    void layout(unsigned long long h, const char* name, int tab, unsigned long long br) {
        g(0, "LAYOUT"); gh(5, h); gh(330, hLayoutDict_);
        g(100, "AcDbPlotSettings");
        g(1, ""); g(2, "none_device"); g(4, "ISO_A3_(420.00_x_297.00_MM)"); g(6, "");
        gd(40, 0); gd(41, 0); gd(42, 0); gd(43, 0); gd(44, 420); gd(45, 297);
        gd(46, 0); gd(47, 0); gd(48, 0); gd(49, 0); gd(140, 0); gd(141, 0); gd(142, 1); gd(143, 1);
        g(70, tab == 0 ? 1024 : 0); g(72, 1); g(73, 0); g(74, 5); g(7, ""); g(75, 16); gd(147, 1); gd(148, 0); gd(149, 0);
        g(100, "AcDbLayout");
        g(1, name); g(70, 1); g(71, tab);
        gd(10, 0); gd(20, 0); gd(11, 420); gd(21, 297);
        gd(12, 0); gd(22, 0); gd(32, 0);
        gd(14, 1e20); gd(24, 1e20); gd(34, 1e20); gd(15, -1e20); gd(25, -1e20); gd(35, -1e20);
        gd(146, 0); gd(13, 0); gd(23, 0); gd(33, 0); gd(16, 1); gd(26, 0); gd(36, 0); gd(17, 0); gd(27, 1); gd(37, 0);
        g(76, 0);
        gh(330, br);
    }

    void writeObjects() {
        dictStart(hRoot_, 0);
        g(3, "ACAD_GROUP"); gh(350, hGroup_);
        g(3, "ACAD_LAYOUT"); gh(350, hLayoutDict_);
        g(3, "ACAD_MLINESTYLE"); gh(350, hMline_);
        g(3, "ACAD_PLOTSETTINGS"); gh(350, hPlotSettings_);
        g(3, "ACAD_PLOTSTYLENAME"); gh(350, hPlotStyleName_);
        dictStart(hGroup_, hRoot_);
        dictStart(hLayoutDict_, hRoot_);
        g(3, "Layout1"); gh(350, hPsLayout_);
        g(3, "Model"); gh(350, hMsLayout_);
        dictStart(hMline_, hRoot_);
        g(3, "Standard"); gh(350, hMlineStd_);
        dictStart(hPlotSettings_, hRoot_);
        g(0, "ACDBDICTIONARYWDFLT"); gh(5, hPlotStyleName_); gh(330, hRoot_);
        g(100, "AcDbDictionary"); g(281, 1);
        g(3, "Normal"); gh(350, hPlaceholder_);
        g(100, "AcDbDictionaryWithDefault"); gh(340, hPlaceholder_);
        g(0, "ACDBPLACEHOLDER"); gh(5, hPlaceholder_); gh(330, hPlotStyleName_);
        g(0, "MLINESTYLE"); gh(5, hMlineStd_); gh(330, hMline_);
        g(100, "AcDbMlineStyle");
        g(2, "Standard"); g(70, 0); g(3, ""); g(62, 256); gd(51, 90); gd(52, 90); g(71, 2);
        gd(49, 0.5); g(62, 256); g(6, "BYLAYER");
        gd(49, -0.5); g(62, 256); g(6, "BYLAYER");
        layout(hMsLayout_, "Model", 0, hMsBr_);
        layout(hPsLayout_, "Layout1", 1, hPsBr_);
    }

    struct DimBlock { std::string name; const DimensionEntity* dim; unsigned long long br = 0; };

    const Document& doc_;
    DxfExportResult& r_;
    std::string* out_ = nullptr;
    unsigned long long handle_ = 0x20;
    unsigned long long hRoot_{}, hGroup_{}, hLayoutDict_{}, hMline_{}, hMlineStd_{}, hPlotSettings_{}, hPlotStyleName_{}, hPlaceholder_{};
    unsigned long long hVportT_{}, hLtypeT_{}, hLayerT_{}, hStyleT_{}, hViewT_{}, hUcsT_{}, hAppidT_{}, hDimT_{}, hBrT_{};
    unsigned long long hMsBr_{}, hPsBr_{}, hMsLayout_{}, hPsLayout_{}, hStandardStyle_{};
    std::vector<BlockDefPtr> blockOrder_;
    std::set<std::string> seenBlocks_;
    std::map<std::string, unsigned long long> blockBr_;
    std::set<std::string> fonts_;
    std::vector<DimBlock> dimBlocks_;
    int dimCount_ = 0;
};

} // namespace

QByteArray exportDxf(const Document& doc, DxfExportResult* result) {
    DxfExportResult local;
    DxfExportResult& r = result ? *result : local;
    r = DxfExportResult{};
    Writer w(doc, r);
    return w.run();
}

DxfExportResult exportDxfFile(const Document& doc, const QString& path) {
    DxfExportResult r;
    const QByteArray data = exportDxf(doc, &r);
    QSaveFile f(path);
    if (!f.open(QIODevice::WriteOnly) || f.write(data) != data.size() || !f.commit()) {
        r.ok = false;
        r.error = "Cannot write " + path.toStdString();
    }
    return r;
}

} // namespace dyncad
