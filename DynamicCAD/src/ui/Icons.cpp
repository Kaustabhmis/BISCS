// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/Icons.h"

#include "ui/Theme.h"

#include <QPainter>
#include <QPainterPath>
#include <QPixmap>

#include <cmath>
#include <functional>

namespace dyncad::Icons {

namespace {

constexpr int kSize = 64; // painted at 64 px, scaled down crisply

void paintIcon(QPainter& p, const QString& n) {
    const QColor ink(0x9C, 0xC8, 0xF0);
    const QColor gold = Theme::brandGold();
    QPen pen(ink, 5, Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin);
    p.setPen(pen);
    p.setBrush(Qt::NoBrush);
    auto dot = [&](QPointF c) {
        p.save(); p.setPen(Qt::NoPen); p.setBrush(gold); p.drawEllipse(c, 6, 6); p.restore();
    };
    if (n == "line") {
        p.drawLine(QPointF(12, 52), QPointF(52, 12));
        dot({12, 52}); dot({52, 12});
    } else if (n == "circle") {
        p.drawEllipse(QPointF(32, 32), 22, 22);
        dot({32, 32});
    } else if (n == "rectangle") {
        p.drawRect(QRectF(10, 16, 44, 32));
        dot({10, 48}); dot({54, 16});
    } else if (n == "pline") {
        QPainterPath path;
        path.moveTo(8, 52); path.lineTo(26, 20); path.lineTo(40, 40);
        path.arcTo(QRectF(36, 14, 20, 26), 200, -200);
        p.drawPath(path);
        dot({8, 52}); dot({26, 20}); dot({40, 40});
    } else if (n == "arc") {
        p.drawArc(QRectF(10, 14, 44, 44), 0 * 16, 180 * 16);
        dot({10, 36}); dot({32, 14}); dot({54, 36});
    } else if (n == "polygon") {
        QPolygonF poly;
        for (int i = 0; i < 6; ++i) poly << QPointF(32 + 24 * std::cos(i * 3.14159265 / 3), 32 + 24 * std::sin(i * 3.14159265 / 3));
        p.drawPolygon(poly);
        dot({32, 32});
    } else if (n == "ellipse") {
        p.drawEllipse(QPointF(32, 32), 26, 15);
        dot({32, 32});
    } else if (n == "spline") {
        QPainterPath path;
        path.moveTo(6, 46); path.cubicTo(18, 4, 36, 60, 58, 16);
        p.drawPath(path);
        dot({6, 46}); dot({58, 16});
    } else if (n == "point") {
        p.drawLine(QPointF(32, 14), QPointF(32, 50)); p.drawLine(QPointF(14, 32), QPointF(50, 32));
        dot({32, 32});
    } else if (n == "square") {
        p.drawRect(QRectF(13, 13, 38, 38));
        dot({13, 51}); dot({51, 13});
    } else if (n == "arrow") {
        p.drawLine(QPointF(8, 52), QPointF(42, 22));
        p.setPen(Qt::NoPen); p.setBrush(gold);
        p.drawPolygon(QPolygonF({QPointF(56, 10), QPointF(36, 18), QPointF(48, 32)}));
    } else if (n == "xline") {
        p.drawLine(QPointF(2, 50), QPointF(62, 14));
        dot({32, 32});
    } else if (n == "ray") {
        p.drawLine(QPointF(12, 50), QPointF(62, 14));
        dot({12, 50});
    } else if (n == "donut") {
        p.setPen(QPen(ink, 10));
        p.drawEllipse(QPointF(32, 32), 18, 18);
    } else if (n == "revcloud") {
        for (int i = 0; i < 4; ++i) {
            p.drawArc(QRectF(6 + i * 13, 10, 14, 12), 0, 180 * 16);
            p.drawArc(QRectF(6 + i * 13, 42, 14, 12), 180 * 16, 180 * 16);
        }
        p.drawArc(QRectF(2, 18, 12, 28), 90 * 16, 180 * 16);
        p.drawArc(QRectF(50, 18, 12, 28), -90 * 16, 180 * 16);
    } else if (n == "move") {
        p.drawRect(QRectF(8, 30, 20, 20));
        p.setPen(QPen(gold, 4, Qt::SolidLine, Qt::RoundCap)); p.drawLine(QPointF(24, 26), QPointF(52, 12));
        p.drawPolyline(QPolygonF({QPointF(42, 10), QPointF(52, 12), QPointF(48, 22)}));
    } else if (n == "copy") {
        p.drawRect(QRectF(8, 24, 22, 22)); p.drawRect(QRectF(34, 10, 22, 22));
        p.setPen(QPen(gold, 4)); p.drawLine(QPointF(30, 30), QPointF(40, 22));
    } else if (n == "rotate") {
        p.drawArc(QRectF(10, 10, 44, 44), 30 * 16, 280 * 16);
        p.setPen(Qt::NoPen); p.setBrush(gold); p.drawPolygon(QPolygonF({QPointF(52, 10), QPointF(54, 26), QPointF(40, 20)}));
    } else if (n == "scale") {
        p.drawRect(QRectF(6, 34, 18, 18)); p.drawRect(QRectF(6, 10, 46, 42));
        p.setPen(QPen(gold, 4)); p.drawLine(QPointF(24, 34), QPointF(46, 16));
    } else if (n == "mirror") {
        p.setPen(QPen(gold, 3, Qt::DashLine)); p.drawLine(QPointF(32, 4), QPointF(32, 60));
        p.setPen(QPen(ink, 5)); p.drawPolygon(QPolygonF({QPointF(26, 14), QPointF(8, 50), QPointF(26, 50)}));
        p.drawPolygon(QPolygonF({QPointF(38, 14), QPointF(56, 50), QPointF(38, 50)}));
    } else if (n == "stretch") {
        p.drawPolyline(QPolygonF({QPointF(8, 20), QPointF(40, 20), QPointF(40, 48), QPointF(8, 48)}));
        p.setPen(QPen(gold, 4)); p.drawLine(QPointF(40, 34), QPointF(58, 34));
    } else if (n == "array") {
        for (int x = 0; x < 3; ++x) for (int y = 0; y < 3; ++y) p.drawRect(QRectF(8 + x * 18, 8 + y * 18, 11, 11));
    } else if (n == "offset") {
        p.drawLine(QPointF(8, 44), QPointF(56, 44));
        p.setPen(QPen(gold, 5)); p.drawLine(QPointF(8, 24), QPointF(56, 24));
    } else if (n == "trim") {
        p.drawLine(QPointF(32, 6), QPointF(32, 58)); p.drawLine(QPointF(6, 32), QPointF(32, 32));
        p.setPen(QPen(QColor(0xE0, 0x50, 0x50), 4, Qt::DashLine)); p.drawLine(QPointF(32, 32), QPointF(58, 32));
    } else if (n == "extend") {
        p.drawLine(QPointF(52, 6), QPointF(52, 58)); p.drawLine(QPointF(6, 32), QPointF(28, 32));
        p.setPen(QPen(gold, 4, Qt::DashLine)); p.drawLine(QPointF(28, 32), QPointF(52, 32));
    } else if (n == "fillet") {
        QPainterPath path; path.moveTo(10, 56); path.lineTo(10, 30); path.arcTo(QRectF(10, 10, 40, 40), 180, -90); path.lineTo(56, 10);
        p.drawPath(path);
    } else if (n == "chamfer") {
        p.drawPolyline(QPolygonF({QPointF(10, 56), QPointF(10, 28), QPointF(28, 10), QPointF(56, 10)}));
        p.setPen(QPen(gold, 4)); p.drawLine(QPointF(10, 28), QPointF(28, 10));
    } else if (n == "break") {
        p.drawLine(QPointF(6, 32), QPointF(24, 32)); p.drawLine(QPointF(40, 32), QPointF(58, 32));
        dot({24, 32}); dot({40, 32});
    } else if (n == "join") {
        p.drawLine(QPointF(6, 40), QPointF(32, 24)); p.drawLine(QPointF(32, 24), QPointF(58, 40));
        dot({32, 24});
    } else if (n == "explode") {
        p.drawLine(QPointF(10, 20), QPointF(26, 12)); p.drawLine(QPointF(38, 12), QPointF(54, 20));
        p.drawLine(QPointF(10, 44), QPointF(26, 52)); p.drawLine(QPointF(38, 52), QPointF(54, 44));
        dot({32, 32});
    } else if (n == "cut") {
        p.drawEllipse(QPointF(18, 48), 8, 8); p.drawEllipse(QPointF(46, 48), 8, 8);
        p.drawLine(QPointF(22, 42), QPointF(46, 8)); p.drawLine(QPointF(42, 42), QPointF(18, 8));
    } else if (n == "copyclip") {
        p.drawRoundedRect(QRectF(12, 10, 40, 48), 4, 4);
        p.setPen(QPen(gold, 4)); p.drawRect(QRectF(22, 4, 20, 10));
    } else if (n == "paste") {
        p.drawRoundedRect(QRectF(10, 10, 38, 48), 4, 4);
        p.setPen(Qt::NoPen); p.setBrush(gold); p.drawRect(QRectF(28, 28, 28, 30));
    } else if (n == "erase") {
        p.drawLine(QPointF(14, 50), QPointF(50, 14));
        p.setPen(QPen(QColor(0xE0, 0x50, 0x50), 6, Qt::SolidLine, Qt::RoundCap));
        p.drawLine(QPointF(16, 16), QPointF(48, 48));
        p.drawLine(QPointF(48, 16), QPointF(16, 48));
    } else if (n == "undo" || n == "redo") {
        if (n == "redo") { p.translate(kSize, 0); p.scale(-1, 1); }
        QPainterPath path;
        path.moveTo(20, 26);
        path.cubicTo(30, 14, 54, 16, 52, 36);
        path.cubicTo(50, 50, 36, 52, 28, 50);
        p.drawPath(path);
        p.setPen(Qt::NoPen); p.setBrush(gold);
        p.drawPolygon(QPolygonF({QPointF(8, 28), QPointF(26, 14), QPointF(26, 38)}));
    } else if (n == "new") {
        p.drawPolygon(QPolygonF({QPointF(14, 6), QPointF(40, 6), QPointF(52, 18), QPointF(52, 58), QPointF(14, 58)}));
        p.setPen(QPen(gold, 5)); p.drawLine(QPointF(24, 40), QPointF(42, 40)); p.drawLine(QPointF(33, 31), QPointF(33, 49));
    } else if (n == "open") {
        p.drawPolygon(QPolygonF({QPointF(6, 16), QPointF(24, 16), QPointF(28, 22), QPointF(52, 22), QPointF(52, 52), QPointF(6, 52)}));
        p.setPen(QPen(gold, 5)); p.drawLine(QPointF(14, 36), QPointF(58, 36));
    } else if (n == "import-dxf") {
        p.drawPolygon(QPolygonF({QPointF(14, 6), QPointF(40, 6), QPointF(52, 18), QPointF(52, 58), QPointF(14, 58)}));
        p.setPen(QPen(gold, 5, Qt::SolidLine, Qt::RoundCap, Qt::RoundJoin));
        p.drawLine(QPointF(33, 22), QPointF(33, 48));
        p.drawPolyline(QPolygonF({QPointF(23, 38), QPointF(33, 48), QPointF(43, 38)}));
    } else if (n == "save") {
        p.drawRoundedRect(QRectF(8, 8, 48, 48), 4, 4);
        p.drawRect(QRectF(18, 8, 26, 16));
        p.setPen(Qt::NoPen); p.setBrush(gold); p.drawRect(QRectF(18, 36, 28, 14));
    } else if (n == "zoom-extents") {
        p.drawRect(QRectF(20, 20, 24, 24));
        p.setPen(QPen(gold, 5));
        for (QPointF c : {QPointF(8, 8), QPointF(56, 8), QPointF(8, 56), QPointF(56, 56)}) {
            const double sx = c.x() < 32 ? 1 : -1, sy = c.y() < 32 ? 1 : -1;
            p.drawLine(c, c + QPointF(10 * sx, 0)); p.drawLine(c, c + QPointF(0, 10 * sy));
        }
    } else if (n == "zoom-in" || n == "zoom-out") {
        p.drawEllipse(QPointF(26, 26), 16, 16);
        p.drawLine(QPointF(38, 38), QPointF(56, 56));
        p.setPen(QPen(gold, 5));
        p.drawLine(QPointF(18, 26), QPointF(34, 26));
        if (n == "zoom-in") p.drawLine(QPointF(26, 18), QPointF(26, 34));
    } else if (n == "grid") {
        p.setPen(QPen(ink, 3));
        for (int i = 12; i <= 52; i += 10) { p.drawLine(QPointF(i, 8), QPointF(i, 56)); p.drawLine(QPointF(8, i), QPointF(56, i)); }
    } else if (n == "snap") {
        p.setPen(Qt::NoPen); p.setBrush(ink);
        for (int x = 14; x <= 50; x += 12) for (int y = 14; y <= 50; y += 12) p.drawEllipse(QPointF(x, y), 3, 3);
        dot({38, 26});
    } else if (n == "ortho") {
        p.drawLine(QPointF(12, 52), QPointF(52, 52)); p.drawLine(QPointF(12, 52), QPointF(12, 12));
        p.setPen(QPen(gold, 4)); p.drawRect(QRectF(12, 40, 12, 12));
    } else if (n == "osnap") {
        p.drawLine(QPointF(8, 54), QPointF(54, 8));
        p.setPen(QPen(gold, 4));
        p.drawRect(QRectF(22, 22, 20, 20));
    } else if (n == "polar") {
        p.drawLine(QPointF(10, 52), QPointF(56, 52));
        p.setPen(QPen(gold, 4, Qt::DashLine));
        p.drawLine(QPointF(10, 52), QPointF(50, 12));
        p.setPen(QPen(ink, 3));
        p.drawArc(QRectF(-8, 34, 36, 36), 0, 45 * 16);
    } else if (n == "dyn") {
        p.drawLine(QPointF(14, 32), QPointF(50, 32)); p.drawLine(QPointF(32, 14), QPointF(32, 50));
        p.setPen(QPen(gold, 3));
        p.drawRect(QRectF(36, 38, 24, 16));
    } else if (n == "theme") {
        p.drawEllipse(QPointF(32, 32), 22, 22);
        p.setPen(Qt::NoPen); p.setBrush(gold);
        QPainterPath half; half.moveTo(32, 10); half.arcTo(QRectF(10, 10, 44, 44), 90, 180); half.closeSubpath();
        p.drawPath(half);
    } else if (n == "select-all") {
        p.setPen(QPen(ink, 3, Qt::DashLine)); p.drawRect(QRectF(8, 8, 48, 48));
        p.setPen(QPen(gold, 5)); p.drawLine(QPointF(18, 46), QPointF(46, 18)); p.drawEllipse(QPointF(34, 40), 8, 8);
    } else {
        p.drawRect(QRectF(12, 12, 40, 40));
    }
}

QIcon makeIcon(const std::function<void(QPainter&)>& fn) {
    QIcon icon;
    for (int px : {16, 24, 32, 48, 64}) {
        QPixmap pm(px, px);
        pm.fill(Qt::transparent);
        QPainter p(&pm);
        p.setRenderHint(QPainter::Antialiasing);
        p.scale(px / double(kSize), px / double(kSize));
        fn(p);
        p.end();
        icon.addPixmap(pm);
    }
    return icon;
}

} // namespace

QIcon get(const QString& name) {
    return makeIcon([&](QPainter& p) { paintIcon(p, name); });
}

QIcon appIcon() {
    // DYNAMIC CAD mark: navy tile, gold drafting line through a precision circle.
    return makeIcon([](QPainter& p) {
        p.setPen(Qt::NoPen);
        p.setBrush(Theme::brandNavy());
        p.drawRoundedRect(QRectF(2, 2, 60, 60), 12, 12);
        p.setBrush(Qt::NoBrush);
        p.setPen(QPen(Qt::white, 5));
        p.drawEllipse(QPointF(30, 34), 16, 16);
        p.setPen(QPen(Theme::brandGold(), 6, Qt::SolidLine, Qt::RoundCap));
        p.drawLine(QPointF(10, 54), QPointF(54, 10));
        p.setPen(Qt::NoPen);
        p.setBrush(Theme::brandGold());
        p.drawEllipse(QPointF(54, 10), 5, 5);
    });
}

} // namespace dyncad::Icons
