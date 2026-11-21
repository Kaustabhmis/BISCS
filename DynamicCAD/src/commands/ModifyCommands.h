// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/InteractiveCommand.h"

#include <functional>

namespace dyncad {

// Base for commands that first need a selection set: uses the pre-selection,
// or prompts "Select objects" until Enter.
class SelectingCommand : public InteractiveCommand {
public:
    CommandStatus start(CommandContext& ctx) override;
    std::string prompt() const override;
    bool wantsSelection() const override { return selecting_; }
    CommandStatus enter(CommandContext& ctx) override;
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;

protected:
    virtual CommandStatus afterSelection(CommandContext&) { return CommandStatus::Continue; }
    virtual std::string stagePrompt() const = 0;
    virtual CommandStatus stagePoint(CommandContext& ctx, const Vec2& p) = 0;
    virtual CommandStatus stageEnter(CommandContext&) { return CommandStatus::Cancelled; }
    std::vector<EntityPtr> selected() const;
    // Applies xf to the selection: in place (one undo step) or as copies.
    void applyTransform(CommandContext& ctx, const Affine2D& xf, bool copy, const std::string& what);
    void previewTransform(const Affine2D& xf, std::vector<std::unique_ptr<Entity>>& out) const;

    bool selecting_ = true;
    std::vector<EntityId> ids_;
    const Document* doc_ = nullptr;
};

class MoveCommand final : public SelectingCommand {
public:
    explicit MoveCommand(bool copy = false) : copy_(copy) {}
    std::string name() const override { return copy_ ? "COPY" : "MOVE"; }
    std::optional<Vec2> basePoint() const override { return base_; }
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

protected:
    std::string stagePrompt() const override;
    CommandStatus stagePoint(CommandContext& ctx, const Vec2& p) override;
    CommandStatus stageEnter(CommandContext&) override { return copy_ && copies_ ? CommandStatus::Done : CommandStatus::Cancelled; }

private:
    bool copy_;
    std::optional<Vec2> base_;
    int copies_ = 0;
};

class RotateCommand final : public SelectingCommand {
public:
    std::string name() const override { return "ROTATE"; }
    std::optional<Vec2> basePoint() const override { return base_; }
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

protected:
    std::string stagePrompt() const override;
    CommandStatus stagePoint(CommandContext& ctx, const Vec2& p) override;

private:
    CommandStatus rotate(CommandContext& ctx, double deg);
    std::optional<Vec2> base_;
    bool copy_ = false;
};

class ScaleCommand final : public SelectingCommand {
public:
    std::string name() const override { return "SCALE"; }
    std::optional<Vec2> basePoint() const override { return base_; }
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;

protected:
    std::string stagePrompt() const override;
    CommandStatus stagePoint(CommandContext& ctx, const Vec2& p) override;

private:
    CommandStatus scale(CommandContext& ctx, double f);
    enum class Stage { Base, Factor, RefLength, NewLength };
    Stage stage_ = Stage::Base;
    std::optional<Vec2> base_;
    double ref_ = 1.0;
    bool copy_ = false;
};

class MirrorCommand final : public SelectingCommand {
public:
    std::string name() const override { return "MIRROR"; }
    std::optional<Vec2> basePoint() const override { return p1_; }
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;
    void preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const override;
    static Affine2D mirrorAbout(const Vec2& a, const Vec2& b);

protected:
    std::string stagePrompt() const override;
    CommandStatus stagePoint(CommandContext& ctx, const Vec2& p) override;
    CommandStatus stageEnter(CommandContext& ctx) override;

private:
    CommandStatus finish(CommandContext& ctx, bool eraseSource);
    std::optional<Vec2> p1_, p2_;
};

// ARRAY: Rectangular (rows x columns) or Polar (around a centre).
class ArrayCommand final : public SelectingCommand {
public:
    std::string name() const override { return "ARRAY"; }
    std::optional<Vec2> basePoint() const override { return std::nullopt; }
    CommandStatus number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) override;
    CommandStatus keyword(CommandContext& ctx, const std::string& kw) override;

protected:
    std::string stagePrompt() const override;
    CommandStatus stagePoint(CommandContext& ctx, const Vec2& p) override;
    CommandStatus stageEnter(CommandContext& ctx) override;

private:
    enum class Stage { Type, Rows, Cols, RowSpacing, ColSpacing, Center, Items, Fill, Rotate };
    CommandStatus buildRect(CommandContext& ctx);
    CommandStatus buildPolar(CommandContext& ctx, bool rotateItems);
    Stage stage_ = Stage::Type;
    int rows_ = 1, cols_ = 1, items_ = 4;
    double rowSp_ = 10, colSp_ = 10, fill_ = 360;
    Vec2 center_;
};

class ExplodeCommand final : public SelectingCommand {
public:
    std::string name() const override { return "EXPLODE"; }
    static std::vector<EntityPtr> explode(const Entity& e); // empty if not explodable

protected:
    CommandStatus afterSelection(CommandContext& ctx) override;
    std::string stagePrompt() const override { return {}; }
    CommandStatus stagePoint(CommandContext&, const Vec2&) override { return CommandStatus::Continue; }
};

class JoinCommand final : public SelectingCommand {
public:
    std::string name() const override { return "JOIN"; }
    // Joins connected lines/arcs/open polylines into polylines (or one line
    // when all pieces are collinear lines). Returns the new entities and the
    // ids that were consumed.
    static std::vector<EntityPtr> join(const std::vector<EntityPtr>& pieces, std::vector<EntityId>& consumed, double tol);

protected:
    CommandStatus afterSelection(CommandContext& ctx) override;
    std::string stagePrompt() const override { return {}; }
    CommandStatus stagePoint(CommandContext&, const Vec2&) override { return CommandStatus::Continue; }
};

// MATCHPROP: copies layer, colour, linetype, lineweight and linetype scale
// from a source object to the selected destination objects.
class MatchPropCommand final : public InteractiveCommand {
public:
    std::string name() const override { return "MATCHPROP"; }
    CommandStatus start(CommandContext&) override { return CommandStatus::Continue; }
    std::string prompt() const override {
        return source_ ? "MATCHPROP  Select destination objects (Enter to apply):" : "MATCHPROP  Pick the source object:";
    }
    CommandStatus point(CommandContext& ctx, const Vec2& p) override;
    CommandStatus enter(CommandContext& ctx) override;
    bool wantsSelection() const override { return source_.has_value(); }

private:
    std::optional<EntityStyle> source_;
};

// Applies 'change' to a copy of every listed entity as one undo step.
void changeEntityStyles(Document& doc, const std::vector<EntityId>& ids, const std::function<void(EntityStyle&)>& change,
                        const std::string& what);

} // namespace dyncad
