// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/PropertiesPanel.h"

#include "commands/InputParser.h"
#include "commands/ModifyCommands.h"
#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "entities/XLineEntity.h"
#include "entities/Annotation.h"
#include "ui/StyleWidgets.h"

#include <QComboBox>
#include <QHeaderView>
#include <QLineEdit>
#include <QTreeWidget>
#include <QVBoxLayout>

#include <cmath>
#include <map>
#include <set>

namespace dyncad {

namespace {
QString num(double v) { return QString::number(std::abs(v) < 5e-5 ? 0.0 : v, 'f', 4); } // no "-0.0000"
QString pt(const Vec2& p) { return num(p.x) + ", " + num(p.y); }
std::optional<Vec2> parsePoint(const QString& s) {
    const QStringList parts = s.split(',');
    if (parts.size() != 2) return std::nullopt;
    auto x = parseNumber(parts[0].toStdString()), y = parseNumber(parts[1].toStdString());
    if (!x || !y) return std::nullopt;
    return Vec2{*x, *y};
}
} // namespace

PropertiesPanel::PropertiesPanel(Document& doc, SelectionSet& sel, QWidget* parent) : QWidget(parent), doc_(doc), sel_(sel) {
    tree_ = new QTreeWidget(this);
    tree_->setColumnCount(2);
    tree_->setHeaderLabels({tr("Property"), tr("Value")});
    tree_->setAlternatingRowColors(true);
    tree_->header()->setSectionResizeMode(0, QHeaderView::ResizeToContents);
    tree_->setIndentation(10);
    auto* lay = new QVBoxLayout(this);
    lay->setContentsMargins(0, 0, 0, 0);
    lay->addWidget(tree_);
    refresh();
}

void PropertiesPanel::scheduleRefresh() {
    if (pending_) return;
    pending_ = true;
    QMetaObject::invokeMethod(this, [this] { pending_ = false; refresh(); }, Qt::QueuedConnection);
}

QTreeWidgetItem* PropertiesPanel::section(const QString& title) {
    auto* it = new QTreeWidgetItem(tree_, {title});
    QFont f = it->font(0);
    f.setBold(true);
    it->setFont(0, f);
    it->setFirstColumnSpanned(true);
    it->setExpanded(true);
    return it;
}

void PropertiesPanel::addRow(QTreeWidgetItem* parent, const QString& key, const QString& value) {
    new QTreeWidgetItem(parent, {key, value});
}

void PropertiesPanel::addEditRow(QTreeWidgetItem* parent, const QString& key, const QString& value) {
    auto* it = new QTreeWidgetItem(parent, {key});
    auto* edit = new QLineEdit(value, tree_);
    edit->setFrame(false);
    edit->setToolTip(tr("Type a new value and press Enter"));
    tree_->setItemWidget(it, 1, edit);
    connect(edit, &QLineEdit::editingFinished, this, [this, key, edit] {
        if (!edit->isModified()) return;
        edit->setModified(false);
        if (!editGeometry(key, edit->text())) emit message(tr("Invalid value for %1.").arg(key));
    });
}

void PropertiesPanel::changeStyle(const std::function<void(EntityStyle&)>& f, const char* what) {
    changeEntityStyles(doc_, sel_.ids(), f, what);
}

void PropertiesPanel::addGeneral(QTreeWidgetItem* gen) {
    // Common value of a property across the selection, or "*VARIES*".
    std::set<std::string> layers, colors, lts, ltscales;
    std::set<int> lws;
    for (EntityId id : sel_.ids())
        if (auto e = doc_.findEntity(id)) {
            layers.insert(e->layer());
            colors.insert(e->color().toString());
            lts.insert(upperName(e->linetype()));
            lws.insert(e->lineweight());
            ltscales.insert(std::to_string(e->ltscale()));
        }
    const StyleTables& t = doc_.styles();
    const QString varies = tr("*VARIES*");

    auto* layerItem = new QTreeWidgetItem(gen, {tr("Layer")});
    auto* layerBox = new QComboBox(tree_);
    for (const Layer& l : t.layers()) layerBox->addItem(StyleWidgets::colorSwatch(l.color), QString::fromStdString(l.name));
    if (layers.size() == 1) layerBox->setCurrentText(QString::fromStdString(*layers.begin()));
    else { layerBox->insertItem(0, varies); layerBox->setCurrentIndex(0); }
    connect(layerBox, &QComboBox::textActivated, this, [this, varies](const QString& name) {
        if (name == varies) return;
        changeStyle([&](EntityStyle& s) { s.layer = name.toStdString(); }, "Change layer");
    });
    tree_->setItemWidget(layerItem, 1, layerBox);

    auto* colorItem = new QTreeWidgetItem(gen, {tr("Colour")});
    auto* colorBox = new QComboBox(tree_);
    CadColor cur;
    if (colors.size() == 1) CadColor::parse(*colors.begin(), cur);
    StyleWidgets::fillColorCombo(colorBox, true, cur);
    if (colors.size() > 1) { colorBox->insertItem(0, varies); colorBox->setCurrentIndex(0); }
    connect(colorBox, &QComboBox::activated, this, [this, colorBox, varies] {
        if (colorBox->currentText() == varies) return;
        if (auto c = StyleWidgets::colorFromCombo(colorBox, this))
            changeStyle([&](EntityStyle& s) { s.color = *c; }, "Change colour");
        else scheduleRefresh();
    });
    tree_->setItemWidget(colorItem, 1, colorBox);

    auto* ltItem = new QTreeWidgetItem(gen, {tr("Linetype")});
    auto* ltBox = new QComboBox(tree_);
    StyleWidgets::fillLinetypeCombo(ltBox, t, true, lts.size() == 1 ? *lts.begin() : std::string("ByLayer"));
    if (lts.size() > 1) { ltBox->insertItem(0, varies); ltBox->setCurrentIndex(0); }
    connect(ltBox, &QComboBox::activated, this, [this, ltBox, varies] {
        if (ltBox->currentText() == varies) return;
        const std::string v = ltBox->currentData().toString().toStdString();
        changeStyle([&](EntityStyle& s) { s.linetype = v; }, "Change linetype");
    });
    tree_->setItemWidget(ltItem, 1, ltBox);

    auto* lwItem = new QTreeWidgetItem(gen, {tr("Lineweight")});
    auto* lwBox = new QComboBox(tree_);
    StyleWidgets::fillLineweightCombo(lwBox, true, lws.size() == 1 ? *lws.begin() : kLwByLayer);
    if (lws.size() > 1) { lwBox->insertItem(0, varies); lwBox->setCurrentIndex(0); }
    connect(lwBox, &QComboBox::activated, this, [this, lwBox, varies] {
        if (lwBox->currentText() == varies) return;
        const int v = lwBox->currentData().toInt();
        changeStyle([&](EntityStyle& s) { s.lineweight = v; }, "Change lineweight");
    });
    tree_->setItemWidget(lwItem, 1, lwBox);

    auto* sItem = new QTreeWidgetItem(gen, {tr("Linetype scale")});
    auto* sEdit = new QLineEdit(ltscales.size() == 1 ? QString::number(std::stod(*ltscales.begin())) : varies, tree_);
    sEdit->setFrame(false);
    connect(sEdit, &QLineEdit::editingFinished, this, [this, sEdit] {
        if (!sEdit->isModified()) return;
        sEdit->setModified(false);
        auto v = parseNumber(sEdit->text().toStdString());
        if (!v || !(*v > 0)) { emit message(tr("Linetype scale must be a positive number.")); return; }
        changeStyle([&](EntityStyle& s) { s.ltscale = *v; }, "Change linetype scale");
    });
    tree_->setItemWidget(sItem, 1, sEdit);
}

void PropertiesPanel::refresh() {
    tree_->clear();
    if (sel_.empty()) {
        auto* d = section(tr("Drawing"));
        addRow(d, tr("Objects"), QString::number(doc_.entityCount()));
        addRow(d, tr("Units"), QString::fromStdString(doc_.units()));
        addRow(d, tr("Current layer"), QString::fromStdString(doc_.styles().currentLayer()));
        addRow(d, tr("Layers"), QString::number(doc_.styles().layers().size()));
        addRow(d, tr("Global linetype scale"), QString::number(doc_.styles().ltscale()));
        const BoundingBox ext = doc_.extents();
        if (ext.isValid()) {
            addRow(d, tr("Extents min"), pt(ext.min));
            addRow(d, tr("Extents max"), pt(ext.max));
        }
        return;
    }
    if (sel_.size() > 1) {
        auto* s = section(tr("Selection: %1 objects").arg(sel_.size()));
        std::map<std::string, int> counts;
        for (EntityId id : sel_.ids())
            if (auto e = doc_.findEntity(id)) counts[e->typeName()]++;
        for (const auto& [t, n] : counts) addRow(s, QString::fromStdString(t), QString::number(n));
        addGeneral(section(tr("General")));
        return;
    }
    auto e = doc_.findEntity(sel_.ids().front());
    if (!e) return;
    auto* hdr = section(QString::fromLatin1(e->typeName()));
    (void)hdr;
    addGeneral(section(tr("General")));
    auto* g = section(tr("Geometry"));
    switch (e->type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(*e);
        addEditRow(g, tr("Start"), pt(l.start()));
        addEditRow(g, tr("End"), pt(l.end()));
        addRow(g, tr("Delta X"), num(l.end().x - l.start().x));
        addRow(g, tr("Delta Y"), num(l.end().y - l.start().y));
        addEditRow(g, tr("Length"), num(l.length()));
        addEditRow(g, tr("Angle (deg)"), num(l.angleDeg()));
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(*e);
        addEditRow(g, tr("Center"), pt(c.center()));
        addEditRow(g, tr("Radius"), num(c.radius()));
        addEditRow(g, tr("Diameter"), num(c.diameter()));
        addRow(g, tr("Circumference"), num(c.circumference()));
        addRow(g, tr("Area"), num(c.area()));
        break;
    }
    case EntityType::Arc: {
        const auto& a = static_cast<const ArcEntity&>(*e);
        const ArcGeom ag = a.geom();
        addEditRow(g, tr("Center"), pt(a.center()));
        addEditRow(g, tr("Radius"), num(a.radius()));
        addEditRow(g, tr("Start angle (deg)"), num(a.startDeg()));
        addEditRow(g, tr("End angle (deg)"), num(a.endDeg()));
        addRow(g, tr("Included angle (deg)"), num(a.sweepDeg()));
        addRow(g, tr("Arc length"), num(a.length()));
        addRow(g, tr("Start point"), pt(ag.startPoint()));
        addRow(g, tr("End point"), pt(ag.endPoint()));
        break;
    }
    case EntityType::Point:
        addEditRow(g, tr("Position"), pt(static_cast<const PointEntity&>(*e).position()));
        break;
    case EntityType::XLine: {
        const auto& x = static_cast<const XLineEntity&>(*e);
        addEditRow(g, tr("Base point"), pt(x.base()));
        addRow(g, tr("Direction (deg)"), num(radToDeg(std::atan2(x.direction().y, x.direction().x))));
        break;
    }
    case EntityType::Ellipse: {
        const auto& el = static_cast<const EllipseEntity&>(*e);
        const EllipseGeom& eg = el.geom();
        addEditRow(g, tr("Center"), pt(eg.center));
        addRow(g, tr("Major radius"), num(eg.majorRadius()));
        addRow(g, tr("Minor radius"), num(eg.minorRadius()));
        addRow(g, tr("Major axis angle (deg)"), num(radToDeg(std::atan2(eg.major.y, eg.major.x))));
        addRow(g, tr("Length"), num(el.length()));
        if (eg.isFull()) addRow(g, tr("Area"), num(el.area()));
        break;
    }
    case EntityType::Spline: {
        const auto& sp = static_cast<const SplineEntity&>(*e);
        addRow(g, tr("Degree"), QString::number(sp.curve().degree));
        addRow(g, tr("Control points"), QString::number(sp.curve().ctrl.size()));
        addRow(g, tr("Rational"), sp.curve().weights.empty() ? tr("No") : tr("Yes"));
        addRow(g, tr("Closed"), sp.isClosed() ? tr("Yes") : tr("No"));
        addRow(g, tr("Length (approx.)"), num(sp.length()));
        break;
    }
    case EntityType::Text: {
        const auto& t = static_cast<const TextEntity&>(*e);
        QString contents = QString::fromStdString(t.text());
        contents.replace('\n', QStringLiteral("\\P"));
        addEditRow(g, tr("Contents"), contents);
        addEditRow(g, tr("Position"), pt(t.insert()));
        addEditRow(g, tr("Height"), num(t.height()));
        addEditRow(g, tr("Rotation (deg)"), num(t.rotationDeg()));
        addRow(g, tr("Justify"), QString::fromLatin1(justifyName(t.justify())));
        if (t.wrapWidth() > 0) addEditRow(g, tr("Wrap width"), num(t.wrapWidth()));
        break;
    }
    case EntityType::Dimension: {
        const auto& d = static_cast<const DimensionEntity&>(*e);
        addRow(g, tr("Kind"), QString::fromLatin1(dimKindName(d.kind())));
        addRow(g, tr("Measurement"), num(d.measurement()));
        addEditRow(g, tr("Text override"), QString::fromStdString(d.textOverride()));
        addEditRow(g, tr("Text height"), num(d.dimStyle().textHeight));
        addEditRow(g, tr("Arrow size"), num(d.dimStyle().arrowSize));
        addEditRow(g, tr("Precision"), QString::number(d.dimStyle().precision));
        break;
    }
    case EntityType::Leader: {
        const auto& l = static_cast<const LeaderEntity&>(*e);
        QString contents = QString::fromStdString(l.text());
        contents.replace('\n', QStringLiteral("\\P"));
        addEditRow(g, tr("Contents"), contents);
        addRow(g, tr("Points"), QString::number(l.points().size()));
        addEditRow(g, tr("Text height"), num(l.dimStyle().textHeight));
        break;
    }
    case EntityType::Polyline: {
        const auto& p = static_cast<const PolylineEntity&>(*e);
        addRow(g, tr("Vertices"), QString::number(p.vertices().size()));
        addRow(g, tr("Closed"), p.isClosed() ? tr("Yes") : tr("No"));
        addRow(g, tr("Arc segments"), p.hasArcs() ? tr("Yes") : tr("No"));
        addEditRow(g, tr("Width"), num(p.width()));
        if (p.isFilled()) addRow(g, tr("Fill"), tr("Solid"));
        addRow(g, tr("Length"), num(p.length()));
        if (p.isClosed()) addRow(g, tr("Area"), num(p.area()));
        const BoundingBox b = p.bounds();
        addRow(g, tr("Width (X)"), num(b.width()));
        addRow(g, tr("Height (Y)"), num(b.height()));
        int i = 1;
        for (const Vec2& v : p.vertices()) {
            if (i > 50) { addRow(g, QStringLiteral("..."), QString()); break; }
            addEditRow(g, tr("Vertex %1").arg(i++), pt(v));
        }
        break;
    }
    }
}

bool PropertiesPanel::editGeometry(const QString& prop, const QString& value) {
    if (sel_.size() != 1) return false;
    auto e = doc_.findEntity(sel_.ids().front());
    if (!e) return false;
    const auto p = parsePoint(value);
    const auto n = parseNumber(value.toStdString());
    EntityPtr out;
    switch (e->type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(*e);
        if (prop == tr("Start") && p) out = std::make_shared<LineEntity>(*p, l.end());
        else if (prop == tr("End") && p) out = std::make_shared<LineEntity>(l.start(), *p);
        else if (prop == tr("Length") && n && *n > 0) out = std::make_shared<LineEntity>(l.start(), l.start() + (l.end() - l.start()).normalized() * *n);
        else if (prop == tr("Angle (deg)") && n) out = std::make_shared<LineEntity>(l.start(), l.start() + Vec2::fromPolar(l.length(), degToRad(*n)));
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(*e);
        if (prop == tr("Center") && p) out = std::make_shared<CircleEntity>(*p, c.radius());
        else if (prop == tr("Radius") && n && *n > 0) out = std::make_shared<CircleEntity>(c.center(), *n);
        else if (prop == tr("Diameter") && n && *n > 0) out = std::make_shared<CircleEntity>(c.center(), *n / 2);
        break;
    }
    case EntityType::Arc: {
        const auto& a = static_cast<const ArcEntity&>(*e);
        if (prop == tr("Center") && p) out = std::make_shared<ArcEntity>(*p, a.radius(), a.startDeg(), a.endDeg());
        else if (prop == tr("Radius") && n && *n > 0) out = std::make_shared<ArcEntity>(a.center(), *n, a.startDeg(), a.endDeg());
        else if (prop == tr("Start angle (deg)") && n) out = std::make_shared<ArcEntity>(a.center(), a.radius(), *n, a.endDeg());
        else if (prop == tr("End angle (deg)") && n) out = std::make_shared<ArcEntity>(a.center(), a.radius(), a.startDeg(), *n);
        break;
    }
    case EntityType::Point:
        if (prop == tr("Position") && p) out = std::make_shared<PointEntity>(*p);
        break;
    case EntityType::XLine: {
        const auto& x = static_cast<const XLineEntity&>(*e);
        if (prop == tr("Base point") && p) out = std::make_shared<XLineEntity>(*p, x.direction(), x.isRay());
        break;
    }
    case EntityType::Ellipse: {
        EllipseGeom g = static_cast<const EllipseEntity&>(*e).geom();
        if (prop == tr("Center") && p) { g.center = *p; out = std::make_shared<EllipseEntity>(g); }
        break;
    }
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(*e);
        if (prop == tr("Width") && n && *n >= 0) {
            out = EntityPtr(pl.clone());
            static_cast<PolylineEntity&>(*out).setWidth(*n);
        } else if (prop.startsWith(tr("Vertex ")) && p) {
            bool ok = false;
            const int i = prop.mid(tr("Vertex ").size()).toInt(&ok) - 1;
            if (ok && i >= 0 && i < int(pl.vertices().size())) {
                std::vector<Vec2> v = pl.vertices();
                v[std::size_t(i)] = *p;
                auto np = std::make_shared<PolylineEntity>(std::move(v), pl.bulges(), pl.isClosed());
                np->setWidth(pl.width());
                np->setFilled(pl.isFilled());
                out = np;
            }
        }
        break;
    }
    case EntityType::Spline:
        break;
    case EntityType::Text: {
        auto t = std::make_shared<TextEntity>(static_cast<const TextEntity&>(*e));
        QString v = value;
        if (prop == tr("Contents")) { v.replace(QStringLiteral("\\P"), QStringLiteral("\n")); t->setText(v.toStdString()); out = t; }
        else if (prop == tr("Position") && p) { t->setInsert(*p); out = t; }
        else if (prop == tr("Height") && n && *n > 0) { t->setHeight(*n); out = t; }
        else if (prop == tr("Rotation (deg)") && n) { t->setRotation(*n); out = t; }
        else if (prop == tr("Wrap width") && n && *n >= 0) { t->setWrapWidth(*n); out = t; }
        break;
    }
    case EntityType::Dimension: {
        auto d = std::make_shared<DimensionEntity>(static_cast<const DimensionEntity&>(*e));
        DimStyle st = d->dimStyle();
        if (prop == tr("Text override")) { d->setTextOverride(value.toStdString()); out = d; }
        else if (prop == tr("Text height") && n && *n > 0) { st.textHeight = *n; d->setDimStyle(st); out = d; }
        else if (prop == tr("Arrow size") && n && *n > 0) { st.arrowSize = *n; d->setDimStyle(st); out = d; }
        else if (prop == tr("Precision") && n && *n >= 0 && *n <= 8 && *n == std::floor(*n)) { st.precision = int(*n); d->setDimStyle(st); out = d; }
        break;
    }
    case EntityType::Leader: {
        auto l = std::make_shared<LeaderEntity>(static_cast<const LeaderEntity&>(*e));
        DimStyle st = l->dimStyle();
        QString v = value;
        if (prop == tr("Contents")) { v.replace(QStringLiteral("\\P"), QStringLiteral("\n")); l->setText(v.toStdString()); out = l; }
        else if (prop == tr("Text height") && n && *n > 0) { st.textHeight = *n; l->setDimStyle(st); out = l; }
        break;
    }
    }
    if (!out) return false;
    out->copyStyleFrom(*e);
    doc_.modifyWithUndo({{e->id(), out}}, "Edit property");
    return true;
}

} // namespace dyncad
