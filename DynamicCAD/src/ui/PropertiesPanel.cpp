// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/PropertiesPanel.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/XLineEntity.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"

#include <QHeaderView>
#include <QTreeWidget>
#include <QVBoxLayout>

#include <cmath>
#include <map>

namespace dyncad {

namespace {
QString num(double v) { return QString::number(v, 'f', 4); }
QString pt(const Vec2& p) { return num(p.x) + ", " + num(p.y); }
} // namespace

PropertiesPanel::PropertiesPanel(const Document& doc, const SelectionSet& sel, QWidget* parent)
    : QWidget(parent), doc_(doc), sel_(sel) {
    tree_ = new QTreeWidget(this);
    tree_->setColumnCount(2);
    tree_->setHeaderLabels({tr("Property"), tr("Value")});
    tree_->setRootIsDecorated(false);
    tree_->setAlternatingRowColors(true);
    tree_->header()->setSectionResizeMode(0, QHeaderView::ResizeToContents);
    auto* lay = new QVBoxLayout(this);
    lay->setContentsMargins(0, 0, 0, 0);
    lay->addWidget(tree_);
    refresh();
}

void PropertiesPanel::refresh() {
    tree_->clear();
    auto add = [this](const QString& k, const QString& v) { new QTreeWidgetItem(tree_, {k, v}); };

    if (sel_.empty()) {
        add(tr("Selection"), tr("None"));
        add(tr("Objects in drawing"), QString::number(doc_.entityCount()));
        add(tr("Units"), QString::fromStdString(doc_.units()));
        const BoundingBox ext = doc_.extents();
        if (ext.isValid()) {
            add(tr("Extents min"), pt(ext.min));
            add(tr("Extents max"), pt(ext.max));
        }
        return;
    }
    if (sel_.size() > 1) {
        add(tr("Selection"), tr("%1 objects").arg(sel_.size()));
        std::map<std::string, int> counts;
        for (EntityId id : sel_.ids())
            if (auto e = doc_.findEntity(id)) counts[e->typeName()]++;
        for (const auto& [t, n] : counts) add(QString::fromStdString(t), QString::number(n));
        return;
    }
    auto e = doc_.findEntity(sel_.ids().front());
    if (!e) return;
    add(tr("Type"), QString::fromLatin1(e->typeName()));
    add(tr("Layer"), QString::fromStdString(e->layer()));
    switch (e->type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(*e);
        add(tr("Start"), pt(l.start()));
        add(tr("End"), pt(l.end()));
        add(tr("Delta X"), num(l.end().x - l.start().x));
        add(tr("Delta Y"), num(l.end().y - l.start().y));
        add(tr("Length"), num(l.length()));
        add(tr("Angle (deg)"), num(l.angleDeg()));
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(*e);
        add(tr("Center"), pt(c.center()));
        add(tr("Radius"), num(c.radius()));
        add(tr("Diameter"), num(c.diameter()));
        add(tr("Circumference"), num(c.circumference()));
        add(tr("Area"), num(c.area()));
        break;
    }
    case EntityType::Arc: {
        const auto& a = static_cast<const ArcEntity&>(*e);
        const ArcGeom g = a.geom();
        add(tr("Center"), pt(a.center()));
        add(tr("Radius"), num(a.radius()));
        add(tr("Start angle (deg)"), num(a.startDeg()));
        add(tr("End angle (deg)"), num(a.endDeg()));
        add(tr("Included angle (deg)"), num(a.sweepDeg()));
        add(tr("Arc length"), num(a.length()));
        add(tr("Start point"), pt(g.startPoint()));
        add(tr("End point"), pt(g.endPoint()));
        break;
    }
    case EntityType::Ellipse: {
        const auto& el = static_cast<const EllipseEntity&>(*e);
        const EllipseGeom& g = el.geom();
        add(tr("Center"), pt(g.center));
        add(tr("Major radius"), num(g.majorRadius()));
        add(tr("Minor radius"), num(g.minorRadius()));
        add(tr("Major axis angle (deg)"), num(radToDeg(std::atan2(g.major.y, g.major.x))));
        add(tr("Radius ratio"), num(g.ratio));
        if (!g.isFull()) {
            add(tr("Start parameter (deg)"), num(radToDeg(g.startParam)));
            add(tr("End parameter (deg)"), num(radToDeg(g.endParam)));
        }
        add(tr("Length"), num(el.length()));
        if (g.isFull()) add(tr("Area"), num(el.area()));
        break;
    }
    case EntityType::Spline: {
        const auto& sp = static_cast<const SplineEntity&>(*e);
        add(tr("Degree"), QString::number(sp.curve().degree));
        add(tr("Control points"), QString::number(sp.curve().ctrl.size()));
        add(tr("Rational"), sp.curve().weights.empty() ? tr("No") : tr("Yes"));
        add(tr("Closed"), sp.isClosed() ? tr("Yes") : tr("No"));
        add(tr("Length (approx.)"), num(sp.length()));
        break;
    }
    case EntityType::XLine: {
        const auto& x = static_cast<const XLineEntity&>(*e);
        add(tr("Base point"), pt(x.base()));
        add(tr("Direction (deg)"), num(radToDeg(std::atan2(x.direction().y, x.direction().x))));
        break;
    }
    case EntityType::Point: {
        add(tr("Position"), pt(static_cast<const PointEntity&>(*e).position()));
        break;
    }
    case EntityType::Polyline: {
        const auto& p = static_cast<const PolylineEntity&>(*e);
        add(tr("Vertices"), QString::number(p.vertices().size()));
        add(tr("Arc segments"), p.hasArcs() ? tr("Yes") : tr("No"));
        add(tr("Closed"), p.isClosed() ? tr("Yes") : tr("No"));
        if (p.isFilled()) add(tr("Fill"), tr("Solid"));
        if (p.width() > 0) add(tr("Width"), num(p.width()));
        add(tr("Length"), num(p.length()));
        if (p.isClosed()) add(tr("Area"), num(p.area()));
        const BoundingBox b = p.bounds();
        add(tr("Width (X)"), num(b.width()));
        add(tr("Height (Y)"), num(b.height()));
        int i = 1;
        for (const Vec2& v : p.vertices()) {
            if (i > 50) { add(QStringLiteral("..."), QString()); break; }
            add(tr("Vertex %1").arg(i++), pt(v));
        }
        break;
    }
    }
}

} // namespace dyncad
