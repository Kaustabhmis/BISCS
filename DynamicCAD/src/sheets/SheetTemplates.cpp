// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
//
// Sheet layouts. The Dynamic Engineers A3 master sheet follows the company's
// drawing standard (docs/standards/dynamic-engineers-drawing-standard.md):
// frame, centring marks, zones, 180 mm right information panel with general
// notes, BOM, revision table, status/projection strip and title block.
// Company details are bracketed placeholders until approved values exist.
#include "sheets/SheetTemplates.h"

#include "entities/Annotation.h"
#include "entities/HatchEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "sheets/PlotLayout.h"

#include <cmath>
#include <cstdio>

namespace dyncad {

const std::vector<std::string>& sheetStatuses() {
    static const std::vector<std::string> s = {"PRELIMINARY", "FOR CLIENT APPROVAL", "APPROVED BY CLIENT",
                                               "FOR FABRICATION", "AS BUILT", "SUPERSEDED"};
    return s;
}

namespace {

constexpr std::uint32_t kNavy = 0x153A5B, kGold = 0xF4B400, kPaleGold = 0xFFF6D6, kLightBlue = 0xEDF2F7, kGrey = 0x4A5562;

// Builds sheet geometry in paper millimetres.
struct Builder {
    std::vector<EntityPtr> fixed;   // goes into the frame block
    std::vector<EntityPtr> fields;  // editable texts
    void line(double x0, double y0, double x1, double y1, const char* layer) {
        auto e = std::make_shared<LineEntity>(Vec2{x0, y0}, Vec2{x1, y1});
        e->setLayer(layer);
        fixed.push_back(e);
    }
    void rect(double x0, double y0, double x1, double y1, const char* layer) {
        auto e = std::make_shared<PolylineEntity>(std::vector<Vec2>{{x0, y0}, {x1, y0}, {x1, y1}, {x0, y1}}, true);
        e->setLayer(layer);
        fixed.push_back(e);
    }
    void fill(double x0, double y0, double x1, double y1, std::uint32_t rgb) {
        auto h = std::make_shared<HatchEntity>(std::vector<HatchLoop>{{{{x0, y0}, {x1, y0}, {x1, y1}, {x0, y1}}, {0, 0, 0, 0}}},
                                               makeHatchPattern("SOLID", 1, 0));
        h->setLayer("DE-FILL");
        h->setColor(CadColor::fromRgb(rgb));
        fixed.insert(fixed.begin(), h); // fills first: drawn underneath the lines
    }
    std::shared_ptr<TextEntity> text(double x, double y, const std::string& s, double h, TextJustify j = TextJustify::Left,
                                     std::uint32_t rgb = 0, bool editable = false, const char* font = "Arial") {
        auto t = std::make_shared<TextEntity>(Vec2{x, y}, s, h, 0.0, j);
        t->setLayer("DE-TEXT");
        t->setFont(font);
        if (rgb) t->setColor(CadColor::fromRgb(rgb));
        (editable ? fields : fixed).push_back(t);
        return t;
    }
    // Field label (2.5 mm grey, top-left of the cell).
    void label(double x0, double y1, const std::string& s) { text(x0 + 0.8, y1 - 3.2, s, 2.5, TextJustify::Left, kGrey); }
};

std::string fmt(double v) {
    char b[32];
    std::snprintf(b, sizeof b, "%g", v);
    return b;
}

void graphicScaleBar(Builder& b, double x, double y, double n) {
    // Segments of a round real length L, three of them, at most ~90 mm on paper.
    double L = 1;
    for (double c : {1000.0, 500.0, 200.0, 100.0, 50.0, 20.0, 10.0, 5.0, 2.0, 1.0})
        if (3 * c / n <= 90.0) { L = c; break; }
    const double seg = L / n;
    for (int i = 0; i < 3; ++i) {
        if (i % 2 == 0) b.fill(x + i * seg, y, x + (i + 1) * seg, y + 2.5, 0x000000);
        b.rect(x + i * seg, y, x + (i + 1) * seg, y + 2.5, "DE-THIN");
        b.text(x + i * seg, y + 3.5, fmt(i * L), 2.5, TextJustify::Center);
    }
    b.text(x + 3 * seg, y + 3.5, fmt(3 * L), 2.5, TextJustify::Center);
    b.text(x, y - 4.0, "GRAPHIC SCALE 1:" + fmt(n) + " (mm)", 2.5);
}

void firstAngleSymbol(Builder& b, double x, double y) {
    // Truncated cone: side view (trapezoid) and end view (two circles).
    auto t = std::make_shared<PolylineEntity>(std::vector<Vec2>{{x, y - 4}, {x + 12, y - 2.5}, {x + 12, y + 2.5}, {x, y + 4}}, true);
    t->setLayer("DE-TITLE");
    b.fixed.push_back(t);
    for (double r : {4.0, 2.5}) {
        auto c = std::make_shared<PolylineEntity>(std::vector<Vec2>{{x + 22 + r, y}, {x + 22 - r, y}}, std::vector<double>{1, 1}, true);
        c->setLayer("DE-TITLE");
        b.fixed.push_back(c);
    }
    b.line(x - 2, y, x + 28, y, "DE-THIN"); // centre line
}

void dynamicEngineersA3(Builder& b, const SheetSpec& spec, std::vector<std::string>& open) {
    const double n = spec.scaleDenominator;
    // Frame and filing margin.
    b.rect(20, 10, 410, 287, "DE-FRAME");
    // Centring marks: x = 210 top/bottom, y = 148.5 left/right, edge to 5 mm inside the frame.
    b.line(210, 0, 210, 15, "DE-FRAME");
    b.line(210, 297, 210, 282, "DE-FRAME");
    b.line(0, 148.5, 25, 148.5, "DE-FRAME");
    b.line(420, 148.5, 405, 148.5, "DE-FRAME");
    // Zones: columns 1-8 and rows A-F, labels centred in the margin strips.
    const double cols[9] = {20, 60, 110, 160, 210, 260, 310, 360, 410};
    for (int i = 0; i < 8; ++i) {
        const double cx = (cols[i] + cols[i + 1]) / 2;
        b.text(cx, 290.2, std::to_string(i + 1), 3.5, TextJustify::Center);
        b.text(cx, 3.2, std::to_string(i + 1), 3.5, TextJustify::Center);
        if (i > 0 && cols[i] != 210) { b.line(cols[i], 287, cols[i], 292, "DE-THIN"); b.line(cols[i], 10, cols[i], 5, "DE-THIN"); }
    }
    const double rows[7] = {287, 248.5, 198.5, 148.5, 98.5, 48.5, 10};
    for (int i = 0; i < 6; ++i) {
        const double cy = (rows[i] + rows[i + 1]) / 2 - 1.75;
        const std::string L(1, static_cast<char>('A' + i));
        b.text(10, cy, L, 3.5, TextJustify::Center);
        b.text(415, cy, L, 3.5, TextJustify::Center);
        if (i > 0 && rows[i] != 148.5) { b.line(15, rows[i], 20, rows[i], "DE-THIN"); b.line(410, rows[i], 415, rows[i], "DE-THIN"); }
    }
    // Right information panel x = 230-410.
    b.line(230, 10, 230, 287, "DE-FRAME");
    const double X0 = 230, X1 = 410;

    // ---- Title block (bottom-up) ----
    // Identification row (13): ID no. 113 | REV 15 | DATE OF ISSUE 30 | SHEET 22
    b.fill(X0, 10, 343, 23, kPaleGold);
    for (double x : {343.0, 358.0, 388.0}) b.line(x, 10, x, 23, "DE-TITLE");
    b.label(X0, 23, "IDENTIFICATION NO. (DRAWING NO.)");
    b.label(343, 23, "REV");
    b.label(358, 23, "DATE OF ISSUE");
    b.label(388, 23, "SHEET");
    b.text(X0 + 2, 12.5, "[DRAWING NUMBER TO BE CONFIRMED]", 5.0 * 0.6, TextJustify::Left, kNavy, true, "Courier New");
    b.text(350.5, 12.5, "[REV]", 2.5, TextJustify::Center, 0, true);
    b.text(373, 12.5, "[DATE]", 2.5, TextJustify::Center, 0, true);
    b.text(399, 12.5, "1 / 1", 3.0, TextJustify::Center, 0, true);
    b.line(X0, 23, X1, 23, "DE-TITLE");
    // Title row (12)
    b.label(X0, 35, "TITLE");
    b.text(X0 + 2, 25.5, "[DRAWING TITLE]", 5.0, TextJustify::Left, kNavy, true);
    b.line(X0, 35, X1, 35, "DE-TITLE");
    // Legal owner area (26): logo placeholder + company details placeholders
    b.label(X0, 61, "LEGAL OWNER");
    b.rect(X0 + 2, 37, X0 + 48, 57, "DE-THIN");
    b.text(X0 + 25, 46, "[DYNAMIC ENGINEERS", 2.5, TextJustify::Center, kGrey);
    b.text(X0 + 25, 42, "LOGO REQUIRED]", 2.5, TextJustify::Center, kGrey);
    b.text(X0 + 52, 53.5, "DYNAMIC ENGINEERS", 4.5, TextJustify::Left, kNavy);
    b.fill(X0 + 52, 51.6, X0 + 52 + 53, 52.2, kGold); // gold rule 53 mm
    b.text(X0 + 52, 47.5, "[LEGAL COMPANY NAME]", 2.5, TextJustify::Left, 0, true);
    b.text(X0 + 52, 44, "[REGISTERED ADDRESS]", 2.5, TextJustify::Left, 0, true);
    b.text(X0 + 52, 40.5, "[PHONE]  [EMAIL]  [WEBSITE]", 2.5, TextJustify::Left, 0, true);
    b.text(X0 + 52, 37, "[CIN IF APPLICABLE]", 2.5, TextJustify::Left, 0, true);
    b.line(X0, 61, X1, 61, "DE-FRAME"); // 0.7 line below the approvals
    // Approvals: 4 rows x 6 (DATE, SIGN, NAME, header), label 20 | 53.3 x 3
    const double ac[4] = {X0 + 20, X0 + 20 + 53.3, X0 + 20 + 106.6, X1};
    b.fill(X0, 79, X1, 85, kLightBlue);
    for (double y : {67.0, 73.0, 79.0}) b.line(X0, y, X1, y, "DE-TITLE");
    for (int i = 0; i < 3; ++i) b.line(ac[i], 61, ac[i], 85, "DE-TITLE");
    const char* heads[3] = {"DRAWN", "CHECKED", "APPROVED"};
    for (int i = 0; i < 3; ++i) b.text((ac[i] + ac[i + 1]) / 2, 81, heads[i], 2.5, TextJustify::Center, kNavy);
    const char* rowsL[3] = {"NAME", "SIGN", "DATE"};
    const double rowY[3] = {75, 69, 63};
    for (int r = 0; r < 3; ++r) {
        b.text(X0 + 1, rowY[r], rowsL[r], 2.5, TextJustify::Left, kGrey);
        for (int i = 0; i < 3; ++i)
            if (r != 1) b.text(ac[i] + 1.5, rowY[r], r == 0 ? "[NAME]" : "[DATE]", 2.5, TextJustify::Left, 0, true);
    }
    b.line(X0, 85, X1, 85, "DE-TITLE");
    // Row (10): SCALE @ A3 19 | PRINT AT 16 | DOCUMENT TYPE 27 | MATERIAL 48 | FINISH 49 | WT / SET 21
    const double r5[7] = {X0, X0 + 19, X0 + 35, X0 + 62, X0 + 110, X0 + 159, X1};
    b.fill(r5[1], 85, r5[2], 95, kPaleGold);
    const char* r5l[6] = {"SCALE @ A3", "PRINT AT", "DOCUMENT TYPE", "MATERIAL", "FINISH", "WT / SET"};
    for (int i = 0; i < 6; ++i) {
        if (i > 0) b.line(r5[i], 85, r5[i], 95, "DE-TITLE");
        b.text(r5[i] + 0.6, 95 - 2.8, r5l[i], i < 3 ? 1.8 : 2.5, TextJustify::Left, kGrey);
    }
    b.text(r5[0] + 1, 86.5, "1:" + fmt(spec.scaleDenominator), 3.0, TextJustify::Left, 0, true);
    b.text(r5[1] + 1, 86.5, "A3", 3.0, TextJustify::Left, 0, true);
    b.text(r5[2] + 1, 86.5, "[DOC. TYPE]", 2.5, TextJustify::Left, 0, true);
    b.text(r5[3] + 1, 86.5, "[MATERIAL]", 2.5, TextJustify::Left, 0, true);
    b.text(r5[4] + 1, 86.5, "[FINISH]", 2.5, TextJustify::Left, 0, true);
    b.text(r5[5] + 1, 86.5, "[TBC] kg", 2.5, TextJustify::Left, 0, true);
    b.line(X0, 95, X1, 95, "DE-TITLE");
    // Row (10): CLIENT 60 | PROJECT / STRUCTURE 60 | CLIENT DESIGN DRG REF. 60
    for (double x : {X0 + 60, X0 + 120}) b.line(x, 95, x, 105, "DE-TITLE");
    b.label(X0, 105, "CLIENT");
    b.label(X0 + 60, 105, "PROJECT / STRUCTURE");
    b.label(X0 + 120, 105, "CLIENT DESIGN DRG REF.");
    b.text(X0 + 1, 96.5, "[CLIENT]", 2.5, TextJustify::Left, 0, true);
    b.text(X0 + 61, 96.5, "[PROJECT / STRUCTURE]", 2.5, TextJustify::Left, 0, true);
    b.text(X0 + 121, 96.5, "[CLIENT DRG NO. / REV]", 2.5, TextJustify::Left, 0, true);
    b.line(X0, 105, X1, 105, "DE-TITLE");
    // Ownership line (5) and gold band (1.6) with a 0.7 line above.
    b.text(X0 + 1, 106.6, "[OWNERSHIP / CONFIDENTIALITY WORDING]", 2.0, TextJustify::Left, 0, true);
    b.text(X1 - 1, 106.6, "[FORMAT NO.] \xC2\xB7 [REV]", 2.0, TextJustify::Right, 0, true);
    b.fill(X0, 110, X1, 111.6, kGold);
    b.line(X0, 111.6, X1, 111.6, "DE-FRAME");

    // ---- Status / projection strip (17.5) ----
    const double sy0 = 111.6, sy1 = 129.1;
    b.line(X0 + 53, sy0, X0 + 53, sy1, "DE-TITLE");
    firstAngleSymbol(b, X0 + 6, sy0 + 10.5);
    b.text(X0 + 26.5, sy0 + 2, "FIRST ANGLE", 2.5, TextJustify::Center, kNavy);
    b.fill(X0 + 58, sy0 + 3, X1 - 5, sy1 - 3, kGold);
    b.rect(X0 + 58, sy0 + 3, X1 - 5, sy1 - 3, "DE-TITLE");
    auto st = b.text((X0 + 58 + X1 - 5) / 2, (sy0 + sy1) / 2, spec.status, 5.0, TextJustify::Middle, kNavy, true);
    b.line(X0, sy1, X1, sy1, "DE-TITLE");

    // ---- Revision table: newest at top, header row at the bottom ----
    const double rv[7] = {X0, X0 + 12, X0 + 36, X1 - 42, X1 - 28, X1 - 14, X1};
    const double ry0 = sy1, ry1 = ry0 + 6 * 4; // header + 3 rows
    b.fill(X0, ry0, X1, ry0 + 6, kLightBlue);
    const char* rh[6] = {"REV", "DATE", "REVISION DESCRIPTION", "DRN", "CHKD", "APPD"};
    for (int i = 0; i < 6; ++i) {
        if (i > 0) b.line(rv[i], ry0, rv[i], ry1, "DE-TITLE");
        b.text((rv[i] + rv[i + 1]) / 2, ry0 + 1.8, rh[i], 2.5, TextJustify::Center, kNavy);
    }
    for (double y = ry0 + 6; y <= ry1 + 1e-9; y += 6) b.line(X0, y, X1, y, "DE-TITLE");

    // ---- Bill of material ----
    const double bomW[7] = {18.5, 0, 27.5, 24.3, 12, 18.5, 19.6};
    double descW = 180;
    for (double w : bomW) descW -= w;
    double bx[8];
    bx[0] = X0;
    for (int i = 0; i < 7; ++i) bx[i + 1] = bx[i] + (i == 1 ? descW : bomW[i]);
    const double by0 = ry1 + 2, byTotal = by0 + 6, byHead = byTotal + 6 * 4, by1 = byHead + 6;
    b.fill(X0, by0, X1, byTotal, kPaleGold);
    b.fill(X0, byHead, X1, by1, kLightBlue);
    const char* bh[7] = {"MARK", "DESCRIPTION", "SECTION/SIZE", "LENGTH \xC3\x97 W", "QTY", "UNIT WT kg", "TOTAL WT kg"};
    for (int i = 0; i < 7; ++i) {
        if (i > 0) b.line(bx[i], byTotal, bx[i], by1, "DE-TITLE");
        b.text((bx[i] + bx[i + 1]) / 2, byHead + 1.8, bh[i], 2.5 * (i >= 2 ? 0.85 : 1.0), TextJustify::Center, kNavy);
    }
    b.line(bx[6], by0, bx[6], byTotal, "DE-TITLE");
    for (double y = by0; y <= by1 + 1e-9; y += 6) b.line(X0, y, X1, y, "DE-TITLE");
    b.line(X0, by1, X1, by1, "DE-TITLE");
    b.text(X0 + 1, by0 + 1.8, "TOTAL WEIGHT PER SET (black, before galv.)", 2.5, TextJustify::Left);
    b.text(bx[6] + 1, by0 + 1.8, "[TBC]", 2.5, TextJustify::Left, 0, true);
    b.text(X0, by1 + 2.5, "BILL OF MATERIAL (BOM)", 3.5, TextJustify::Left, kNavy);
    b.fill(X0, by1 + 1.6, X0 + 46, by1 + 2.0, kGold);

    // ---- General notes (default notes of the standard; brackets = to confirm) ----
    b.text(X0, 281, "GENERAL NOTES", 3.5, TextJustify::Left, kNavy);
    b.fill(X0, 280.1, X0 + 30, 280.5, kGold);
    const std::string notes =
        "1. All dimensions are in millimetres. Do not scale this drawing; work to stated dimensions only.\n"
        "2. Material: IS 2062 E250 BR unless stated otherwise in the Bill of Material.\n"
        "3. Bolt holes: hole dia = bolt dia + 1.5 mm (M16 \xE2\x86\x92 17.5, M20 \xE2\x86\x92 21.5). Holes punched or drilled; all burrs removed.\n"
        "4. Bolts and nuts: hot-dip galvanized, grade and standard as per client specification [BOLT SPEC].\n"
        "5. Finish: hot-dip galvanizing as per IS 4759 / IS 2629; minimum coating [___ g/m\xC2\xB2] as per client specification.\n"
        "6. Unspecified fabrication tolerances as per IS 7215.\n"
        "7. Welding, where shown: as per IS 816; complete before galvanizing; vent/drain holes where required.\n"
        "8. Piece mark and Dynamic Engineers identification to be hard-stamped before galvanizing, characters min. 10 mm high.\n"
        "9. Prepared from the client design drawing referenced in the title block. In case of conflict the client drawing governs; "
        "refer to Dynamic Engineers Planning before fabrication.\n"
        "10. Drawing prepared on A3 landscape; stated scale applies at A3 only. Printed on A1 the drawing is 2\xC3\x97 and on A4 it is "
        "0.71\xC3\x97; measure with the graphic scale bar or use written dimensions.";
    auto nt = b.text(X0 + 1, 278, notes, 2.5, TextJustify::TopLeft, 0, true);
    nt->setWrapWidth(172); // margin for font hinting differences between screen and plot
    (void)st;
    graphicScaleBar(b, 26, 18, n);

    open.push_back("General notes use 2.5 mm text (the standard asks for 3.0 mm) so that all ten notes fit the panel; "
                   "confirm or shorten the notes.");
    open.push_back("Verify the first-angle projection symbol orientation against ISO 5456-2 before release.");
    open.push_back("Company logo, legal name, address, contact details, format number and ownership wording are "
                   "placeholders until approved by Dynamic Engineers.");
}

void isoSheet(Builder& b, double W, double H, const SheetSpec& spec) {
    b.rect(20, 10, W - 10, H - 10, "DE-FRAME");
    const double X1 = W - 10, X0 = X1 - 180, Y0 = 10;
    const double rh = 8;
    b.rect(X0, Y0, X1, Y0 + 4 * rh, "DE-FRAME");
    for (int i = 1; i < 4; ++i) b.line(X0, Y0 + i * rh, X1, Y0 + i * rh, "DE-TITLE");
    // Row 4 (top): TITLE; Row 3: DRAWING NO | REV | SCALE | SHEET; Row 2: DRAWN | CHECKED | APPROVED | DATE;
    // Row 1: company | MATERIAL | PROJECTION
    const double c4[5] = {X0, X0 + 80, X0 + 100, X0 + 140, X1};
    for (int i = 1; i < 4; ++i) { b.line(c4[i], Y0 + rh, c4[i], Y0 + 3 * rh, "DE-TITLE"); }
    b.line(X0 + 70, Y0, X0 + 70, Y0 + rh, "DE-TITLE");
    b.line(X0 + 130, Y0, X0 + 130, Y0 + rh, "DE-TITLE");
    auto lab = [&](double x, double y, const char* s) { b.label(x, y, s); };
    lab(X0, Y0 + 4 * rh, "TITLE");
    lab(c4[0], Y0 + 3 * rh, "DRAWING NO.");
    lab(c4[1], Y0 + 3 * rh, "REV");
    lab(c4[2], Y0 + 3 * rh, "SCALE");
    lab(c4[3], Y0 + 3 * rh, "SHEET");
    lab(c4[0], Y0 + 2 * rh, "DRAWN");
    lab(c4[1], Y0 + 2 * rh, "CHECKED");
    lab(c4[2], Y0 + 2 * rh, "APPROVED");
    lab(c4[3], Y0 + 2 * rh, "DATE");
    lab(X0 + 70, Y0 + rh, "MATERIAL");
    lab(X0 + 130, Y0 + rh, "PROJECTION");
    b.text(X0 + 2, Y0 + 3 * rh + 1.2, "[DRAWING TITLE]", 3.5, TextJustify::Left, kNavy, true);
    b.text(c4[0] + 1, Y0 + 2 * rh + 1.2, "[DRAWING NUMBER TO BE CONFIRMED]", 2.5, TextJustify::Left, kNavy, true);
    b.text(c4[1] + 1, Y0 + 2 * rh + 1.2, "[REV]", 2.5, TextJustify::Left, 0, true);
    b.text(c4[2] + 1, Y0 + 2 * rh + 1.2, "1:" + fmt(spec.scaleDenominator), 2.5, TextJustify::Left, 0, true);
    b.text(c4[3] + 1, Y0 + 2 * rh + 1.2, "1 / 1", 2.5, TextJustify::Left, 0, true);
    for (int i = 0; i < 4; ++i) b.text(c4[i] + 1, Y0 + rh + 1.2, i == 3 ? "[DATE]" : "[NAME]", 2.5, TextJustify::Left, 0, true);
    b.text(X0 + 2, Y0 + 2, "DYNAMIC ENGINEERS", 3.5, TextJustify::Left, kNavy);
    b.text(X0 + 71, Y0 + 1.5, "[MATERIAL]", 2.5, TextJustify::Left, 0, true);
    b.text(X0 + 131, Y0 + 1.5, "FIRST ANGLE", 2.5, TextJustify::Left, kNavy);
    graphicScaleBar(b, 26, 18, spec.scaleDenominator);
}

} // namespace

SheetResult makeSheet(const SheetSpec& spec) {
    SheetResult r;
    auto paper = paperByName(spec.paper);
    if (!paper) paper = paperByName("A3");
    const bool de = spec.dynamicEngineers;
    double W = spec.landscape ? paper->heightMm : paper->widthMm, H = spec.landscape ? paper->widthMm : paper->heightMm;
    if (de) { W = 420; H = 297; } // the company standard uses one A3 landscape master only
    const double n = spec.scaleDenominator > 0 ? spec.scaleDenominator : 1.0;
    Builder b;
    if (de) dynamicEngineersA3(b, spec, r.openPoints);
    else isoSheet(b, W, H, spec);
    // Paper mm -> world: scale by n, then move to the origin.
    const Affine2D toWorld = Affine2D::translation(spec.origin) * Affine2D::scaling(n, n);
    auto def = std::make_shared<BlockDef>();
    char nameBuf[64];
    std::snprintf(nameBuf, sizeof nameBuf, "SHEET-%s-%s-1-%g", de ? "A3" : spec.paper.c_str(), de ? "DE" : (spec.landscape ? "L" : "P"), n);
    def->name = nameBuf;
    def->entities = b.fixed; // block holds paper-mm geometry; the reference scales it by n
    r.frame = def;
    auto ins = std::make_shared<InsertEntity>(def, spec.origin, n, n, 0);
    ins->setLayer("DE-FRAME");
    r.entities.push_back(ins);
    for (const auto& f : b.fields)
        if (auto t = f->transformed(toWorld)) r.entities.push_back(EntityPtr(std::move(t)));
    r.paperArea = BoundingBox(spec.origin, spec.origin + Vec2{W * n, H * n});
    Layer frame{"DE-FRAME"};
    frame.lineweight = 70;
    Layer title{"DE-TITLE"};
    title.lineweight = 35;
    Layer thin{"DE-THIN"};
    thin.lineweight = 25;
    Layer text{"DE-TEXT"};
    text.lineweight = 25;
    Layer fill{"DE-FILL"};
    r.layers = {frame, title, thin, text, fill};
    return r;
}

} // namespace dyncad
