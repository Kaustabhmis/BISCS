// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/SheetCommands.h"

#include "commands/InputParser.h"
#include "entities/PolylineEntity.h"
#include "sheets/PlotLayout.h"

#include <algorithm>
#include <cctype>
#include <cstdio>

namespace dyncad {

void insertSheet(Document& doc, const SheetResult& sheet) {
    StyleTables t = doc.styles();
    bool changed = false;
    for (const auto& l : sheet.layers)
        if (!t.hasLayer(l.name)) changed = t.addLayer(l) || changed;
    if (changed) doc.setStylesWithUndo(t, "Sheet layers");
    // The block name encodes sheet type and scale, so a same-named definition is identical.
    const BlockDefPtr def = sheet.frame;
    doc.defineBlockWithUndo(def, {}, sheet.entities);
}

namespace {
std::string formatNumber(double v) {
    char b[32];
    std::snprintf(b, sizeof b, "%g", v);
    return b;
}
std::string upper(std::string s) {
    for (auto& c : s) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
    return s;
}
} // namespace

CommandStatus SheetCommand::start(CommandContext&) { return CommandStatus::Continue; }

std::string SheetCommand::prompt() const {
    switch (stage_) {
    case Stage::Type: return "SHEET  Sheet type [DE (Dynamic Engineers A3)/A4/A3/A2/A1/A0] <DE>:";
    case Stage::Orientation: return "SHEET  Orientation [Landscape/Portrait] <Landscape>:";
    case Stage::Scale: return "SHEET  Drawing scale 1:n, enter n or 1:n <1>:";
    case Stage::Corner: return "SHEET  Specify lower-left corner <0,0>:";
    }
    return {};
}

CommandStatus SheetCommand::text(CommandContext& ctx, const std::string& raw) {
    const std::string t = upper(trim(raw));
    if (t.empty()) return enter(ctx);
    switch (stage_) {
    case Stage::Type:
        if (t == "DE" || t == "D") { spec_.dynamicEngineers = true; spec_.paper = "A3"; stage_ = Stage::Scale; return CommandStatus::Continue; }
        if (paperByName(t)) { spec_.dynamicEngineers = false; spec_.paper = t; stage_ = Stage::Orientation; return CommandStatus::Continue; }
        ctx.say("Unknown sheet type \"" + trim(raw) + "\". Use DE, A4, A3, A2, A1 or A0.");
        return CommandStatus::Continue;
    case Stage::Orientation:
        if (t[0] == 'L' || t[0] == 'P') { spec_.landscape = t[0] == 'L'; stage_ = Stage::Scale; return CommandStatus::Continue; }
        ctx.say("Enter L (landscape) or P (portrait).");
        return CommandStatus::Continue;
    case Stage::Scale: {
        std::optional<double> n;
        if (auto s = parseScale(t)) n = 1.0 / *s;
        else if (auto v = parseNumber(t)) n = *v;
        if (!n || !(*n > 0)) { ctx.say("Enter a positive scale such as 5 or 1:5."); return CommandStatus::Continue; }
        spec_.scaleDenominator = *n;
        stage_ = Stage::Corner;
        return CommandStatus::Continue;
    }
    case Stage::Corner: break;
    }
    return CommandStatus::Continue;
}

CommandStatus SheetCommand::keyword(CommandContext& ctx, const std::string& kw) { return text(ctx, kw); }

CommandStatus SheetCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Scale) return text(ctx, std::to_string(v));
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus SheetCommand::enter(CommandContext& ctx) {
    switch (stage_) {
    case Stage::Type: spec_.dynamicEngineers = true; spec_.paper = "A3"; stage_ = Stage::Scale; return CommandStatus::Continue;
    case Stage::Orientation: spec_.landscape = true; stage_ = Stage::Scale; return CommandStatus::Continue;
    case Stage::Scale: spec_.scaleDenominator = 1.0; stage_ = Stage::Corner; return CommandStatus::Continue;
    case Stage::Corner: return place(ctx, {0, 0});
    }
    return CommandStatus::Cancelled;
}

CommandStatus SheetCommand::point(CommandContext& ctx, const Vec2& p) {
    if (stage_ != Stage::Corner) return CommandStatus::Continue;
    return place(ctx, p);
}

CommandStatus SheetCommand::place(CommandContext& ctx, const Vec2& corner) {
    spec_.origin = corner;
    const SheetResult r = makeSheet(spec_);
    insertSheet(ctx.doc, r);
    const Vec2 sz = r.paperArea.max - r.paperArea.min;
    ctx.say("Sheet " + r.frame->name + " placed at 1:" + scaleName(1.0 / spec_.scaleDenominator).substr(2) + " (" +
            formatNumber(sz.x) + " x " + formatNumber(sz.y) + " drawing units). Edit the bracketed fields before issue.");
    for (const auto& o : r.openPoints) ctx.say("Open point: " + o);
    return CommandStatus::Done;
}

void SheetCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ != Stage::Corner) return;
    auto paper = paperByName(spec_.paper);
    double W = spec_.landscape ? paper->heightMm : paper->widthMm, H = spec_.landscape ? paper->widthMm : paper->heightMm;
    if (spec_.dynamicEngineers) { W = 420; H = 297; }
    W *= spec_.scaleDenominator;
    H *= spec_.scaleDenominator;
    out.push_back(std::make_unique<PolylineEntity>(
        std::vector<Vec2>{cursor, cursor + Vec2{W, 0}, cursor + Vec2{W, H}, cursor + Vec2{0, H}}, true));
}

} // namespace dyncad
