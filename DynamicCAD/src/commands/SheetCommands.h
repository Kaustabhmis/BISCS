// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InteractiveCommand.h"
#include "sheets/SheetTemplates.h"

namespace dyncad {

// Inserts a sheet into the drawing as one undo step (layers, frame block,
// block reference and editable title-block fields).
void insertSheet(Document& doc, const SheetResult& sheet);

// SHEET: sheet type (DE = Dynamic Engineers A3 master, or ISO A4..A0),
// orientation, drawing scale 1:n and lower-left corner.
class SheetCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "SHEET"; }
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus text(CommandContext& ctx, const std::string& t) override;
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    bool wantsText() const override { return stage_ != Stage::Corner; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

private:
    CommandStatus place(CommandContext& ctx, const Vec2& corner);
    enum class Stage { Type, Orientation, Scale, Corner };
    Stage stage_ = Stage::Type;
    SheetSpec spec_;
};

} // namespace dyncad
