// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"

#include <array>
#include <functional>
#include <string>
#include <vector>

namespace dyncad {

// ---------------------------------------------------------------- text layout

// Width of a single line of text of the given cap height. The GUI installs a
// font-metrics based function; the default is an estimate (0.6 x height per
// character) so the engine works without a display.
using TextWidthFunction = std::function<double(const std::string& line, const std::string& font, double height)>;
void setTextWidthFunction(TextWidthFunction fn);
double textWidth(const std::string& line, const std::string& font, double height);

enum class TextJustify { Left, Center, Right, Middle, TopLeft };
const char* justifyName(TextJustify j);
bool parseJustify(const std::string& kw, TextJustify& out);

inline constexpr double kLineSpacing = 5.0 / 3.0; // multiple of the text height

struct TextLayout {
    struct Line {
        std::string text;
        Vec2 start; // baseline start, in the text's local frame (insertion point = origin)
    };
    std::vector<Line> lines;
    BoundingBox box; // local frame, includes descenders
};
// Splits on '\n' and wraps to wrapWidth (0 = no wrapping).
TextLayout layoutText(const std::string& text, double height, TextJustify justify, const std::string& font,
                      double wrapWidth = 0.0);

// ---------------------------------------------------------------- TEXT / MTEXT

class TextEntity final : public Entity {
public:
    TextEntity(const Vec2& insert, const std::string& text, double height, double rotationDeg = 0.0,
               TextJustify justify = TextJustify::Left);

    EntityType type() const override { return EntityType::Text; }
    const char* typeName() const override { return multiline() ? "Multiline text" : "Text"; }
    BoundingBox bounds() const override;
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    std::vector<Vec2> gripPoints() const override { return {insert_}; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<TextEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const Vec2& insert() const { return insert_; }
    const std::string& text() const { return text_; }
    double height() const { return height_; }
    double rotationDeg() const { return rotation_; }
    TextJustify justify() const { return justify_; }
    const std::string& font() const { return font_; }
    double wrapWidth() const { return wrap_; }
    bool multiline() const { return text_.find('\n') != std::string::npos || wrap_ > 0; }

    void setText(std::string t) { text_ = std::move(t); }
    void setHeight(double h) { if (h > 0) height_ = h; }
    void setRotation(double deg) { rotation_ = deg; }
    void setFont(std::string f) { font_ = std::move(f); }
    void setWrapWidth(double w) { wrap_ = w > 0 ? w : 0; }
    void setInsert(const Vec2& p) { insert_ = p; }

    TextLayout layout() const { return layoutText(text_, height_, justify_, font_, wrap_); }
    // World corners of the text box (counter-clockwise).
    std::array<Vec2, 4> corners() const;
    Vec2 toWorld(const Vec2& local) const;

private:
    Vec2 insert_;
    std::string text_;
    double height_;
    double rotation_;
    TextJustify justify_;
    std::string font_ = "Arial";
    double wrap_ = 0.0;
};

// ---------------------------------------------------------------- dimensions

struct DimStyle {
    double textHeight = 2.5;
    double arrowSize = 2.5;
    double extOffset = 0.625;  // gap between the object and the extension line
    double extBeyond = 1.25;   // extension line beyond the dimension line
    double textGap = 0.625;    // gap between dimension line and text
    int precision = 2;         // decimal places
    bool suppressZeros = true; // 12.50 -> 12.5, 100.00 -> 100
    std::string font = "Arial";
    bool operator==(const DimStyle& o) const {
        return textHeight == o.textHeight && arrowSize == o.arrowSize && extOffset == o.extOffset &&
               extBeyond == o.extBeyond && textGap == o.textGap && precision == o.precision &&
               suppressZeros == o.suppressZeros && font == o.font;
    }
};

// Everything a dimension or leader draws, in world coordinates.
struct AnnotationGraphics {
    struct Text {
        std::string text;
        Vec2 position;    // insertion point
        double rotationDeg = 0;
        double height = 2.5;
        TextJustify justify = TextJustify::Center;
        std::string font = "Arial";
    };
    std::vector<std::pair<Vec2, Vec2>> lines;
    std::vector<std::array<Vec2, 3>> arrows; // filled triangles
    std::vector<Text> texts;
    BoundingBox bounds() const;
    double distanceTo(const Vec2& p) const;
    bool crossesRect(const BoundingBox& r) const;
};

std::string formatMeasurement(double v, int precision, bool suppressZeros);

enum class DimKind { Linear, Aligned, Angular, Radius, Diameter };
const char* dimKindName(DimKind k);

// Dimension defined by points (non-associative, like an exploded-safe DXF
// dimension):
//   Linear:   a, b = extension origins; loc = point on the dimension line;
//             angleDeg = direction of measurement (0 horizontal, 90 vertical)
//   Aligned:  a, b = extension origins; loc = point on the dimension line
//   Angular:  a = vertex; b, c = points on the two legs; loc = arc location
//   Radius/Diameter: a = centre; b = point on the curve; loc = text location
class DimensionEntity final : public Entity {
public:
    DimensionEntity(DimKind kind, const Vec2& a, const Vec2& b, const Vec2& loc, double angleDeg = 0.0);

    EntityType type() const override { return EntityType::Dimension; }
    const char* typeName() const override { return "Dimension"; }
    BoundingBox bounds() const override { return graphics().bounds(); }
    double distanceTo(const Vec2& p) const override { return graphics().distanceTo(p); }
    bool crossesRect(const BoundingBox& r) const override { return graphics().crossesRect(r); }
    std::vector<Vec2> gripPoints() const override;
    std::unique_ptr<Entity> clone() const override { return std::make_unique<DimensionEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    DimKind kind() const { return kind_; }
    const Vec2& a() const { return a_; }
    const Vec2& b() const { return b_; }
    const Vec2& c() const { return c_; }
    const Vec2& location() const { return loc_; }
    double angleDeg() const { return angle_; }
    void setC(const Vec2& c) { c_ = c; }
    void setPoint(std::size_t gripIndex, const Vec2& p);
    const std::string& textOverride() const { return override_; }
    void setTextOverride(std::string t) { override_ = std::move(t); }
    const DimStyle& dimStyle() const { return style_; }
    void setDimStyle(const DimStyle& s) { style_ = s; }

    double measurement() const; // length, radius, diameter or degrees
    std::string displayText() const;
    AnnotationGraphics graphics() const;

private:
    DimKind kind_;
    Vec2 a_, b_, c_, loc_;
    double angle_;
    std::string override_;
    DimStyle style_;
};

// Leader: polyline with an arrow at the first point and text at the last.
class LeaderEntity final : public Entity {
public:
    LeaderEntity(std::vector<Vec2> pts, std::string text);

    EntityType type() const override { return EntityType::Leader; }
    const char* typeName() const override { return "Leader"; }
    BoundingBox bounds() const override { return graphics().bounds(); }
    double distanceTo(const Vec2& p) const override { return graphics().distanceTo(p); }
    bool crossesRect(const BoundingBox& r) const override { return graphics().crossesRect(r); }
    std::vector<Vec2> gripPoints() const override { return pts_; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<LeaderEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const std::vector<Vec2>& points() const { return pts_; }
    void setPoint(std::size_t i, const Vec2& p) { if (i < pts_.size()) pts_[i] = p; }
    const std::string& text() const { return text_; }
    void setText(std::string t) { text_ = std::move(t); }
    const DimStyle& dimStyle() const { return style_; }
    void setDimStyle(const DimStyle& s) { style_ = s; }
    AnnotationGraphics graphics() const;

private:
    std::vector<Vec2> pts_;
    std::string text_;
    DimStyle style_;
};

} // namespace dyncad
