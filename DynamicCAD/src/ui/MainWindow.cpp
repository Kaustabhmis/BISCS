// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/MainWindow.h"

#include "canvas/CadCanvas.h"
#include "dxf/DxfReader.h"
#include "commands/GripAndClipboard.h"
#include "fileio/DynFormat.h"
#include "ui/CommandLine.h"
#include "ui/Icons.h"
#include "ui/LayerPanel.h"
#include "ui/PropertiesPanel.h"
#include "ui/StyleWidgets.h"
#include "commands/ModifyCommands.h"
#include "ui/Ribbon.h"
#include "version.h"

#include <QAction>
#include <QActionGroup>
#include <QApplication>
#include <QCloseEvent>
#include <QDialog>
#include <QDialogButtonBox>
#include <QDir>
#include <QDockWidget>
#include <QFile>
#include <QFileDialog>
#include <QFileInfo>
#include <QClipboard>
#include <QGuiApplication>
#include <QComboBox>
#include <QGridLayout>
#include <QLabel>
#include <QMimeData>
#include <QLineEdit>
#include <QMenuBar>
#include <QMessageBox>
#include <QSettings>
#include <QStatusBar>
#include <QTextBrowser>
#include <QToolButton>
#include <QVBoxLayout>

#include <set>

namespace dyncad {

MainWindow::MainWindow(QWidget* parent) : QMainWindow(parent), proc_(doc_, selection_) {
    setWindowIcon(Icons::appIcon());
    registerCoreCommands(proc_, doc_);

    canvas_ = new CadCanvas(doc_, selection_, proc_, this);
    setCentralWidget(canvas_);

    createActions();
    createDraftingAids();
    createMenus();
    createRibbon();
    createDocks();
    createStatusBar();
    registerUiCommands();

    proc_.onMessage = [this](const std::string& m) { message(QString::fromStdString(m)); };
    proc_.onStateChanged = [this] { onProcessorState(); };
    selection_.onChanged = [this] {
        props_->scheduleRefresh();
        refreshPropertyCombos();
        actErase_->setEnabled(!selection_.empty() || !proc_.isActive());
        canvas_->update();
    };
    docListener_ = doc_.addListener([this] { onDocumentChanged(); });

    connect(cmdLine_, &CommandLine::submitted, this, &MainWindow::executeCommandText);
    connect(cmdLine_, &CommandLine::cancelRequested, this, [this] {
        if (proc_.isActive()) proc_.cancel();
        else selection_.clear();
        canvas_->setFocus();
    });
    connect(canvas_, &CadCanvas::textTyped, cmdLine_, &CommandLine::insertText);
    connect(cmdLine_->input(), &QLineEdit::textChanged, canvas_, &CadCanvas::setDynamicInputText);
    connect(canvas_, &CadCanvas::enterRequested, this, [this] { executeCommandText(QString()); });
    connect(canvas_, &CadCanvas::escapeRequested, this, [this] {
        if (proc_.isActive()) proc_.cancel();
        else selection_.clear();
    });
    connect(canvas_, &CadCanvas::deleteRequested, this, [this] {
        if (!selection_.empty()) startCommand("ERASE");
    });
    connect(canvas_, &CadCanvas::cursorMoved, this, [this](double x, double y) {
        coordLabel_->setText(QStringLiteral("%1, %2").arg(x, 0, 'f', 4).arg(y, 0, 'f', 4));
    });

    QSettings s;
    restoreGeometry(s.value("window/geometry").toByteArray());
    restoreState(s.value("window/state").toByteArray());
    if (!s.contains("window/geometry")) resize(1360, 860);

    message(tr("DYNAMIC CAD %1 - Dynamic Engineers. Type HELP for commands.").arg(DYNCAD_VERSION_STRING));
    onProcessorState();
    updateTitle();
    refreshPropertyCombos();
    canvas_->setFocus();
}

MainWindow::~MainWindow() {
    // Members (doc_, selection_, proc_) are destroyed *before* the QMainWindow
    // base deletes child widgets, so tear the widgets down here while the
    // document still exists (the canvas unregisters its document listener).
    doc_.removeListener(docListener_);
    selection_.onChanged = nullptr;
    proc_.onMessage = nullptr;
    proc_.onStateChanged = nullptr;
    const auto children = findChildren<QWidget*>(QString(), Qt::FindDirectChildrenOnly);
    for (QWidget* w : children) delete w;
    canvas_ = nullptr;
    cmdLine_ = nullptr;
    props_ = nullptr;
}

// ------------------------------------------------------------------ setup

void MainWindow::createActions() {
    auto make = [this](const QString& text, const QString& icon, const QKeySequence& key, const QString& tip) {
        auto* a = new QAction(icon.isEmpty() ? QIcon() : Icons::get(icon), text, this);
        if (!key.isEmpty()) a->setShortcut(key);
        a->setStatusTip(tip);
        a->setToolTip(key.isEmpty() ? tip : QStringLiteral("%1 (%2)").arg(tip, key.toString(QKeySequence::NativeText)));
        return a;
    };
    actNew_ = make(tr("&New"), "new", QKeySequence::New, tr("Start a new drawing"));
    actOpen_ = make(tr("&Open..."), "open", QKeySequence::Open, tr("Open a drawing (*.dyn) or import a DXF file"));
    actImportDxf_ = make(tr("&Import DXF..."), "import-dxf", QKeySequence(), tr("Import an AutoCAD DXF file"));
    actImportDxf_->setIconText(tr("Import"));
    actSave_ = make(tr("&Save"), "save", QKeySequence::Save, tr("Save the drawing"));
    actSaveAs_ = make(tr("Save &As..."), "", QKeySequence(Qt::CTRL | Qt::SHIFT | Qt::Key_S), tr("Save the drawing under a new name"));
    actExit_ = make(tr("E&xit"), "", QKeySequence(Qt::ALT | Qt::Key_F4), tr("Exit DYNAMIC CAD"));
    connect(actNew_, &QAction::triggered, this, &MainWindow::newDrawing);
    connect(actOpen_, &QAction::triggered, this, &MainWindow::openDrawing);
    connect(actImportDxf_, &QAction::triggered, this, [this] {
        if (!maybeSave()) return;
        QSettings s;
        const QString path = QFileDialog::getOpenFileName(this, tr("Import DXF"), s.value("files/lastDir").toString(),
                                                          tr("AutoCAD DXF (*.dxf);;All Files (*)"));
        if (!path.isEmpty()) importDxfPath(path);
    });
    connect(actSave_, &QAction::triggered, this, &MainWindow::save);
    connect(actSaveAs_, &QAction::triggered, this, &MainWindow::saveAs);
    connect(actExit_, &QAction::triggered, this, &QWidget::close);

    actUndo_ = make(tr("&Undo"), "undo", QKeySequence::Undo, tr("Undo the last action"));
    actRedo_ = make(tr("&Redo"), "redo", QKeySequence(Qt::CTRL | Qt::Key_Y), tr("Redo the last undone action"));
    actErase_ = make(tr("&Erase"), "erase", QKeySequence(), tr("Erase selected objects (Delete key)"));
    actSelectAll_ = make(tr("Select &All"), "select-all", QKeySequence::SelectAll, tr("Select all objects"));
    actDeselect_ = make(tr("&Deselect All"), "", QKeySequence(), tr("Clear the selection (Esc)"));
    connect(actUndo_, &QAction::triggered, this, [this] { startCommand("UNDO"); });
    connect(actRedo_, &QAction::triggered, this, [this] { startCommand("REDO"); });
    connect(actErase_, &QAction::triggered, this, [this] { startCommand("ERASE"); });
    connect(actSelectAll_, &QAction::triggered, this, [this] {
        std::vector<EntityId> ids;
        for (const auto& e : doc_.entities()) ids.push_back(e->id());
        selection_.add(ids);
    });
    connect(actDeselect_, &QAction::triggered, this, [this] { selection_.clear(); });

    actLine_ = make(tr("&Line"), "line", QKeySequence(), tr("Draw lines (L)"));
    actCircle_ = make(tr("&Circle"), "circle", QKeySequence(), tr("Draw a circle (C)"));
    actRect_ = make(tr("&Rectangle"), "rectangle", QKeySequence(), tr("Draw a rectangle (REC)"));
    connect(actLine_, &QAction::triggered, this, [this] { startCommand("LINE"); });
    connect(actCircle_, &QAction::triggered, this, [this] { startCommand("CIRCLE"); });
    connect(actRect_, &QAction::triggered, this, [this] { startCommand("RECTANGLE"); });
    struct Tool { QAction** act; const char* text; const char* icon; const char* cmd; const char* tip; };
    const Tool tools[] = {
        {&actPline_, "&Polyline", "pline", "PLINE", "Draw a polyline of lines and arcs (PL)"},
        {&actArc_, "&Arc", "arc", "ARC", "Draw an arc through 3 points, or from a center (A)"},
        {&actPolygon_, "Pol&ygon", "polygon", "POLYGON", "Draw a regular polygon (POL)"},
        {&actEllipse_, "&Ellipse", "ellipse", "ELLIPSE", "Draw an ellipse (EL)"},
        {&actSpline_, "&Spline", "spline", "SPLINE", "Draw a smooth curve through points (SPL)"},
        {&actPoint_, "Poin&t", "point", "POINT", "Place a point (PO)"},
        {&actSquare_, "S&quare", "square", "SQUARE", "Draw a square (SQ)"},
        {&actArrow_, "Arro&w", "arrow", "ARROW", "Draw an arrow with a filled head (ARW)"},
        {&actXline_, "&Xline", "xline", "XLINE", "Infinite construction line (XL)"},
        {&actRay_, "&Ray", "ray", "RAY", "Construction line starting at a point"},
        {&actDonut_, "&Donut", "donut", "DONUT", "Filled ring or disc (DO)"},
        {&actRevcloud_, "Re&vcloud", "revcloud", "REVCLOUD", "Revision cloud around changed areas (RC)"},
    };
    for (const Tool& t : tools) {
        *t.act = make(tr(t.text), t.icon, QKeySequence(), tr(t.tip));
        const QString cmd = t.cmd;
        connect(*t.act, &QAction::triggered, this, [this, cmd] { startCommand(cmd); });
    }
    const Tool editTools[] = {
        {&actMove_, "&Move", "move", "MOVE", "Move objects (M)"},
        {&actCopy_, "&Copy", "copy", "COPY", "Copy objects, multiple placements (CO)"},
        {&actRotate_, "&Rotate", "rotate", "ROTATE", "Rotate objects about a base point (RO)"},
        {&actScale_, "&Scale", "scale", "SCALE", "Scale objects, or by Reference length (SC)"},
        {&actMirror_, "M&irror", "mirror", "MIRROR", "Mirror objects about a line (MI)"},
        {&actStretch_, "S&tretch", "stretch", "STRETCH", "Stretch objects with a crossing window (S)"},
        {&actArray_, "&Array", "array", "ARRAY", "Rectangular or polar array (AR)"},
        {&actOffset_, "&Offset", "offset", "OFFSET", "Parallel copy at a distance (O)"},
        {&actTrim_, "&Trim", "trim", "TRIM", "Trim objects at their intersections (TR)"},
        {&actExtend_, "E&xtend", "extend", "EXTEND", "Extend objects to the nearest boundary (EX)"},
        {&actFillet_, "&Fillet", "fillet", "FILLET", "Round a corner between two lines (F)"},
        {&actChamfer_, "C&hamfer", "chamfer", "CHAMFER", "Bevel a corner between two lines (CHA)"},
        {&actBreak_, "&Break", "break", "BREAK", "Break an object between two points (BR)"},
        {&actJoin_, "&Join", "join", "JOIN", "Join touching lines, arcs and polylines (J)"},
        {&actExplode_, "Ex&plode", "explode", "EXPLODE", "Split polylines into lines and arcs (X)"},
    };
    for (const Tool& t : editTools) {
        *t.act = make(tr(t.text), t.icon, QKeySequence(), tr(t.tip));
        const QString cmd = t.cmd;
        connect(*t.act, &QAction::triggered, this, [this, cmd] { startCommand(cmd); });
    }
    actLwt_ = make(tr("L&WT"), "lwt", QKeySequence(), tr("Show lineweights"));
    actLwt_->setCheckable(true);
    actLwt_->setChecked(QSettings().value("aids/lwt", false).toBool());
    canvas_->setLineweightDisplay(actLwt_->isChecked());
    connect(actLwt_, &QAction::toggled, this, [this](bool on) {
        canvas_->setLineweightDisplay(on);
        QSettings().setValue("aids/lwt", on);
    });
    actLayers_ = make(tr("&Layer Manager"), "layers", QKeySequence(), tr("Open the layer manager (LAYER)"));
    connect(actLayers_, &QAction::triggered, this, [this] { layerDock_->show(); layerDock_->raise(); });
    actMatchProp_ = make(tr("&Match Properties"), "matchprop", QKeySequence(), tr("Copy properties from one object to others (MA)"));
    connect(actMatchProp_, &QAction::triggered, this, [this] { startCommand("MATCHPROP"); });
    actCutClip_ = make(tr("Cu&t"), "cut", QKeySequence::Cut, tr("Cut selected objects to the clipboard"));
    actCopyClip_ = make(tr("Copy C&lip"), "copyclip", QKeySequence::Copy, tr("Copy selected objects to the clipboard"));
    actPasteClip_ = make(tr("&Paste"), "paste", QKeySequence::Paste, tr("Paste objects from the clipboard"));
    connect(actCutClip_, &QAction::triggered, this, [this] { copyToClipboard(true); });
    connect(actCopyClip_, &QAction::triggered, this, [this] { copyToClipboard(false); });
    connect(actPasteClip_, &QAction::triggered, this, &MainWindow::pasteFromClipboard);

    actZoomExt_ = make(tr("Zoom &Extents"), "zoom-extents", QKeySequence(Qt::CTRL | Qt::Key_0), tr("Fit the whole drawing in the view"));
    actZoomIn_ = make(tr("Zoom &In"), "zoom-in", QKeySequence::ZoomIn, tr("Zoom in"));
    actZoomOut_ = make(tr("Zoom &Out"), "zoom-out", QKeySequence::ZoomOut, tr("Zoom out"));
    connect(actZoomExt_, &QAction::triggered, canvas_, &CadCanvas::zoomExtents);
    connect(actZoomIn_, &QAction::triggered, canvas_, [this] { canvas_->zoomBy(1.5); });
    connect(actZoomOut_, &QAction::triggered, canvas_, [this] { canvas_->zoomBy(1.0 / 1.5); });

    actGrid_ = make(tr("&Grid"), "grid", QKeySequence(Qt::Key_F7), tr("Show/hide grid"));
    actSnap_ = make(tr("&Snap"), "snap", QKeySequence(Qt::Key_F9), tr("Snap cursor to grid"));
    actOrtho_ = make(tr("&Ortho"), "ortho", QKeySequence(Qt::Key_F8), tr("Restrict picks to horizontal/vertical"));
    for (QAction* a : {actGrid_, actSnap_, actOrtho_}) a->setCheckable(true);
    actGrid_->setChecked(true);
    connect(actGrid_, &QAction::toggled, canvas_, &CadCanvas::setGridVisible);
    connect(actSnap_, &QAction::toggled, canvas_, &CadCanvas::setSnapEnabled);
    connect(actOrtho_, &QAction::toggled, this, [this](bool on) { proc_.setOrtho(on); canvas_->update(); });
    connect(actGrid_, &QAction::toggled, this, [this](bool on) { message(on ? tr("<Grid on>") : tr("<Grid off>")); });
    connect(actSnap_, &QAction::toggled, this, [this](bool on) { message(on ? tr("<Snap on>") : tr("<Snap off>")); });
    connect(actOrtho_, &QAction::toggled, this, [this](bool on) { message(on ? tr("<Ortho on>") : tr("<Ortho off>")); });

    actDark_ = make(tr("&Dark Theme"), "theme", QKeySequence(), tr("Use the dark theme"));
    actLight_ = make(tr("&Light Theme"), "theme", QKeySequence(), tr("Use the light theme"));
    auto* themes = new QActionGroup(this);
    for (QAction* a : {actDark_, actLight_}) { a->setCheckable(true); themes->addAction(a); }
    connect(actDark_, &QAction::triggered, this, [this] { setTheme(ThemeKind::Dark); });
    connect(actLight_, &QAction::triggered, this, [this] { setTheme(ThemeKind::Light); });

    actHelp_ = make(tr("&Command Reference"), "", QKeySequence::HelpContents, tr("List available commands"));
    actAbout_ = make(tr("&About DYNAMIC CAD"), "", QKeySequence(), tr("Version and copyright"));
    actAboutQt_ = make(tr("About &Qt"), "", QKeySequence(), tr("Qt version and licence"));
    actNotices_ = make(tr("Third-Party &Notices"), "", QKeySequence(), tr("Open-source licences used by DYNAMIC CAD"));
    connect(actHelp_, &QAction::triggered, this, &MainWindow::showHelp);
    connect(actAbout_, &QAction::triggered, this, &MainWindow::showAbout);
    connect(actAboutQt_, &QAction::triggered, qApp, &QApplication::aboutQt);
    connect(actNotices_, &QAction::triggered, this, &MainWindow::showNotices);

    // Shortcuts must work while the canvas has focus.
    addActions({actNew_, actOpen_, actSave_, actSaveAs_, actUndo_, actRedo_, actSelectAll_, actZoomExt_, actZoomIn_,
                actZoomOut_, actGrid_, actSnap_, actOrtho_, actHelp_, actCutClip_, actCopyClip_, actPasteClip_});
}

void MainWindow::createDraftingAids() {
    QSettings st;
    auto make = [this](const QString& text, const QString& icon, const QKeySequence& key, const QString& tip) {
        auto* a = new QAction(Icons::get(icon), text, this);
        a->setShortcut(key);
        a->setCheckable(true);
        a->setStatusTip(tip);
        a->setToolTip(QStringLiteral("%1 (%2)").arg(tip, key.toString(QKeySequence::NativeText)));
        addAction(a);
        return a;
    };
    actOsnap_ = make(tr("O&snap"), "osnap", QKeySequence(Qt::Key_F3), tr("Object snap: endpoints, midpoints, centres, intersections..."));
    actPolar_ = make(tr("&Polar"), "polar", QKeySequence(Qt::Key_F10), tr("Polar tracking along fixed angles"));
    actDyn_ = make(tr("&Dyn"), "dyn", QKeySequence(Qt::Key_F12), tr("Dynamic input: coordinates, length and angle at the cursor"));
    actOsnap_->setChecked(st.value("aids/osnap", true).toBool());
    actPolar_->setChecked(st.value("aids/polar", true).toBool());
    actDyn_->setChecked(st.value("aids/dyn", true).toBool());
    canvas_->setOsnapEnabled(actOsnap_->isChecked());
    proc_.setPolar(actPolar_->isChecked() && !actOrtho_->isChecked());
    canvas_->setDynamicInput(actDyn_->isChecked());
    connect(actOsnap_, &QAction::toggled, this, [this](bool on) {
        canvas_->setOsnapEnabled(on);
        QSettings().setValue("aids/osnap", on);
        message(on ? tr("<Osnap on>") : tr("<Osnap off>"));
    });
    connect(actPolar_, &QAction::toggled, this, [this](bool on) {
        if (on && actOrtho_->isChecked()) actOrtho_->setChecked(false); // ORTHO and POLAR are exclusive
        proc_.setPolar(on);
        QSettings().setValue("aids/polar", on);
        message(on ? tr("<Polar on>") : tr("<Polar off>"));
    });
    connect(actOrtho_, &QAction::toggled, this, [this](bool on) {
        if (on && actPolar_->isChecked()) actPolar_->setChecked(false);
    });
    connect(actDyn_, &QAction::toggled, this, [this](bool on) {
        canvas_->setDynamicInput(on);
        QSettings().setValue("aids/dyn", on);
    });

    // Object snap mode menu.
    snapMenu_ = new QMenu(tr("Object Snap Modes"), this);
    const std::uint32_t saved = st.value("aids/snapModes", kDefaultSnapModes).toUInt();
    canvas_->setSnapModes(saved);
    const SnapMode modes[] = {SnapEndpoint, SnapMidpoint, SnapCenter, SnapQuadrant, SnapIntersection,
                              SnapPerpendicular, SnapTangent, SnapNearest, SnapNode};
    for (SnapMode m : modes) {
        auto* a = snapMenu_->addAction(tr(snapModeName(m)));
        a->setCheckable(true);
        a->setChecked(saved & m);
        connect(a, &QAction::toggled, this, [this, m](bool on) {
            std::uint32_t v = canvas_->snapModes();
            v = on ? (v | m) : (v & ~std::uint32_t(m));
            canvas_->setSnapModes(v);
            QSettings().setValue("aids/snapModes", v);
        });
    }
    snapMenu_->addSeparator();
    connect(snapMenu_->addAction(tr("Select All")), &QAction::triggered, this, [this] {
        for (QAction* a : snapMenu_->actions()) if (a->isCheckable()) a->setChecked(true);
    });
    connect(snapMenu_->addAction(tr("Clear All")), &QAction::triggered, this, [this] {
        for (QAction* a : snapMenu_->actions()) if (a->isCheckable()) a->setChecked(false);
    });
    actOsnap_->setMenu(snapMenu_);

    polarMenu_ = new QMenu(tr("Polar Angle Increment"), this);
    auto* group = new QActionGroup(this);
    for (double deg : {5.0, 10.0, 15.0, 22.5, 30.0, 45.0, 90.0}) {
        auto* a = polarMenu_->addAction(QStringLiteral("%1\u00B0").arg(deg));
        a->setCheckable(true);
        a->setData(deg);
        group->addAction(a);
        connect(a, &QAction::triggered, this, [this, deg] { setPolarIncrement(deg); });
    }
    actPolar_->setMenu(polarMenu_);
    setPolarIncrement(st.value("aids/polarIncrement", 45.0).toDouble());

}

void MainWindow::setPolarIncrement(double deg) {
    proc_.setPolarIncrement(deg);
    QSettings().setValue("aids/polarIncrement", proc_.polarIncrement());
    if (polarMenu_)
        for (QAction* a : polarMenu_->actions()) a->setChecked(std::abs(a->data().toDouble() - proc_.polarIncrement()) < 1e-9);
}

void MainWindow::createMenus() {
    QMenu* file = menuBar()->addMenu(tr("&File"));
    file->addActions({actNew_, actOpen_, actSave_, actSaveAs_});
    file->addSeparator();
    file->addAction(actImportDxf_);
    file->addSeparator();
    file->addAction(actExit_);

    QMenu* edit = menuBar()->addMenu(tr("&Edit"));
    edit->addActions({actUndo_, actRedo_});
    edit->addSeparator();
    edit->addActions({actCutClip_, actCopyClip_, actPasteClip_});
    edit->addSeparator();
    edit->addActions({actErase_, actSelectAll_, actDeselect_});

    QMenu* modify = menuBar()->addMenu(tr("&Modify"));
    modify->addActions({actMove_, actCopy_, actRotate_, actScale_, actMirror_, actStretch_, actArray_});
    modify->addSeparator();
    modify->addActions({actOffset_, actTrim_, actExtend_, actFillet_, actChamfer_, actBreak_, actJoin_, actExplode_});

    QMenu* draw = menuBar()->addMenu(tr("&Draw"));
    draw->addActions({actLine_, actPline_, actArc_, actCircle_, actEllipse_, actSpline_});
    draw->addSeparator();
    draw->addActions({actRect_, actSquare_, actPolygon_});
    draw->addSeparator();
    draw->addActions({actPoint_, actArrow_, actDonut_, actRevcloud_});
    draw->addSeparator();
    draw->addActions({actXline_, actRay_});

    QMenu* view = menuBar()->addMenu(tr("&View"));
    view->addActions({actZoomExt_, actZoomIn_, actZoomOut_});
    view->addSeparator();
    view->addActions({actGrid_, actSnap_, actOrtho_, actOsnap_, actPolar_, actDyn_});
    view->addMenu(snapMenu_);
    view->addMenu(polarMenu_);
    view->addSeparator();
    view->addActions({actDark_, actLight_});
    view->addSeparator();
    // Panel toggles are added in createDocks().
    view->setObjectName("ViewMenu");

    QMenu* help = menuBar()->addMenu(tr("&Help"));
    help->addAction(actHelp_);
    help->addSeparator();
    help->addActions({actNotices_, actAboutQt_, actAbout_});
}

void MainWindow::createRibbon() {
    ribbon_ = new Ribbon(this);
    RibbonPage* home = ribbon_->addPage(tr("Home"));
    home->addGroup(tr("File"), {actNew_, actOpen_, actSave_, actImportDxf_});
    home->addGroup(tr("Draw"), {actLine_, actPline_, actArc_, actCircle_, actEllipse_, actSpline_});
    home->addGroup(tr("Shapes"), {actRect_, actSquare_, actPolygon_, actPoint_, actArrow_, actDonut_, actRevcloud_});
    home->addGroup(tr("Edit"), {actErase_, actUndo_, actRedo_});
    createLayerRibbonGroup(home);
    RibbonPage* mod = ribbon_->addPage(tr("Modify"));
    mod->addGroup(tr("Transform"), {actMove_, actCopy_, actRotate_, actScale_, actMirror_, actStretch_, actArray_});
    mod->addGroup(tr("Edit Geometry"), {actOffset_, actTrim_, actExtend_, actFillet_, actChamfer_, actBreak_, actJoin_, actExplode_});
    mod->addGroup(tr("Clipboard"), {actCutClip_, actCopyClip_, actPasteClip_});
    RibbonPage* construct = ribbon_->addPage(tr("Construction"));
    construct->addGroup(tr("Construction Lines"), {actXline_, actRay_});
    home->addGroup(tr("Selection"), {actSelectAll_});
    RibbonPage* view = ribbon_->addPage(tr("View"));
    view->addGroup(tr("Navigate"), {actZoomExt_, actZoomIn_, actZoomOut_});
    view->addGroup(tr("Drafting Aids"), {actGrid_, actSnap_, actOrtho_, actOsnap_, actPolar_, actDyn_});
    view->addGroup(tr("Appearance"), {actDark_, actLight_});
    // Menu bar on top, ribbon directly beneath it as a fixed toolbar-like dock.
    auto* dock = new QDockWidget(tr("Ribbon"), this);
    dock->setObjectName("RibbonDock");
    dock->setWidget(ribbon_);
    dock->setFeatures(QDockWidget::NoDockWidgetFeatures);
    dock->setTitleBarWidget(new QWidget(dock));
    addDockWidget(Qt::TopDockWidgetArea, dock);
}

void MainWindow::createLayerRibbonGroup(RibbonPage* home) {
    auto* box = new QWidget;
    auto* grid = new QGridLayout(box);
    grid->setContentsMargins(0, 0, 0, 0);
    grid->setSpacing(3);
    layerCombo_ = new QComboBox(box);
    layerCombo_->setMinimumWidth(150);
    layerCombo_->setToolTip(tr("Current layer (with objects selected: move them to this layer)"));
    colorCombo_ = new QComboBox(box);
    colorCombo_->setToolTip(tr("Colour of the selected objects"));
    ltCombo_ = new QComboBox(box);
    ltCombo_->setToolTip(tr("Linetype of the selected objects"));
    lwCombo_ = new QComboBox(box);
    lwCombo_->setToolTip(tr("Lineweight of the selected objects"));
    auto* mgr = new QToolButton(box);
    mgr->setDefaultAction(actLayers_);
    mgr->setToolButtonStyle(Qt::ToolButtonIconOnly);
    mgr->setAutoRaise(true);
    auto* match = new QToolButton(box);
    match->setDefaultAction(actMatchProp_);
    match->setToolButtonStyle(Qt::ToolButtonIconOnly);
    match->setAutoRaise(true);
    grid->addWidget(mgr, 0, 0);
    grid->addWidget(layerCombo_, 0, 1, 1, 2);
    grid->addWidget(match, 1, 0);
    grid->addWidget(colorCombo_, 1, 1);
    grid->addWidget(ltCombo_, 1, 2);
    grid->addWidget(lwCombo_, 2, 1, 1, 2);
    home->addWidgetGroup(tr("Layers & Properties"), box);

    connect(layerCombo_, &QComboBox::activated, this, [this] {
        const std::string name = layerCombo_->currentData().toString().toStdString();
        if (!selection_.empty()) {
            changeEntityStyles(doc_, selection_.ids(), [&](EntityStyle& s) { s.layer = name; }, "Change layer");
        } else {
            StyleTables t = doc_.styles();
            if (t.setCurrentLayer(name)) doc_.setStylesWithUndo(std::move(t), "Set current layer");
            else message(tr("Layer %1 is frozen and cannot be current.").arg(QString::fromStdString(name)));
        }
        canvas_->setFocus();
    });
    connect(colorCombo_, &QComboBox::activated, this, [this] {
        if (selection_.empty()) { refreshPropertyCombos(); return; }
        if (auto c = StyleWidgets::colorFromCombo(colorCombo_, this))
            changeEntityStyles(doc_, selection_.ids(), [&](EntityStyle& s) { s.color = *c; }, "Change colour");
        refreshPropertyCombos();
    });
    connect(ltCombo_, &QComboBox::activated, this, [this] {
        if (selection_.empty()) return;
        const std::string v = ltCombo_->currentData().toString().toStdString();
        changeEntityStyles(doc_, selection_.ids(), [&](EntityStyle& s) { s.linetype = v; }, "Change linetype");
    });
    connect(lwCombo_, &QComboBox::activated, this, [this] {
        if (selection_.empty()) return;
        const int v = lwCombo_->currentData().toInt();
        changeEntityStyles(doc_, selection_.ids(), [&](EntityStyle& s) { s.lineweight = v; }, "Change lineweight");
    });
}

void MainWindow::refreshPropertyCombos() {
    if (!layerCombo_) return;
    const StyleTables& t = doc_.styles();
    {
        const QSignalBlocker b(layerCombo_);
        layerCombo_->clear();
        std::string shown = t.currentLayer();
        if (!selection_.empty()) {
            std::set<std::string> ls;
            for (EntityId id : selection_.ids()) if (auto e = doc_.findEntity(id)) ls.insert(e->layer());
            if (ls.size() == 1) shown = *ls.begin();
        }
        for (const Layer& l : t.layers()) {
            QString label = QString::fromStdString(l.name);
            if (!l.visible()) label += tr("  (hidden)");
            if (l.locked) label += tr("  (locked)");
            layerCombo_->addItem(StyleWidgets::colorSwatch(l.color), label, QString::fromStdString(l.name));
        }
        layerCombo_->setCurrentIndex(std::max(0, layerCombo_->findData(QString::fromStdString(shown))));
    }
    CadColor c;
    std::string lt = kByLayer;
    int lw = kLwByLayer;
    if (selection_.size() >= 1)
        if (auto e = doc_.findEntity(selection_.ids().front())) { c = e->color(); lt = e->linetype(); lw = e->lineweight(); }
    StyleWidgets::fillColorCombo(colorCombo_, true, c);
    StyleWidgets::fillLinetypeCombo(ltCombo_, t, true, lt);
    StyleWidgets::fillLineweightCombo(lwCombo_, true, lw);
    for (QComboBox* b : {colorCombo_, ltCombo_, lwCombo_}) b->setEnabled(!selection_.empty());
}

void MainWindow::createDocks() {
    props_ = new PropertiesPanel(doc_, selection_, this);
    auto* propDock = new QDockWidget(tr("Properties"), this);
    propDock->setObjectName("PropertiesDock");
    propDock->setWidget(props_);
    addDockWidget(Qt::RightDockWidgetArea, propDock);

    cmdLine_ = new CommandLine(this);
    auto* cmdDock = new QDockWidget(tr("Command Line"), this);
    cmdDock->setObjectName("CommandDock");
    cmdDock->setWidget(cmdLine_);
    cmdDock->setFeatures(QDockWidget::DockWidgetMovable | QDockWidget::DockWidgetFloatable);
    addDockWidget(Qt::BottomDockWidgetArea, cmdDock);
    resizeDocks({cmdDock}, {130}, Qt::Vertical);
    resizeDocks({propDock}, {280}, Qt::Horizontal);

    layers_ = new LayerPanel(doc_, this);
    layerDock_ = new QDockWidget(tr("Layers"), this);
    layerDock_->setObjectName("LayersDock");
    layerDock_->setWidget(layers_);
    addDockWidget(Qt::RightDockWidgetArea, layerDock_);
    tabifyDockWidget(propDock, layerDock_);
    propDock->raise();
    connect(layers_, &LayerPanel::message, this, &MainWindow::message);
    connect(props_, &PropertiesPanel::message, this, &MainWindow::message);
    if (auto* view = menuBar()->findChild<QMenu*>("ViewMenu")) {
        view->addAction(propDock->toggleViewAction());
        view->addAction(layerDock_->toggleViewAction());
    }
}

void MainWindow::createStatusBar() {
    coordLabel_ = new QLabel("0.0000, 0.0000", this);
    coordLabel_->setMinimumWidth(220);
    coordLabel_->setToolTip(tr("Cursor coordinates (X, Y) in drawing units"));
    statusBar()->addWidget(coordLabel_);
    for (QAction* a : {actGrid_, actSnap_, actOrtho_, actPolar_, actOsnap_, actDyn_, actLwt_}) {
        auto* b = new QToolButton(this);
        b->setDefaultAction(a);
        if (a->menu()) {
            b->setPopupMode(QToolButton::MenuButtonPopup);
            b->setMinimumWidth(b->fontMetrics().horizontalAdvance(a->text().remove('&')) + 34);
        }
        b->setToolButtonStyle(Qt::ToolButtonTextOnly);
        b->setAutoRaise(true);
        statusBar()->addPermanentWidget(b);
    }
    unitsLabel_ = new QLabel(this);
    unitsLabel_->setToolTip(tr("Drawing units"));
    statusBar()->addPermanentWidget(unitsLabel_);
}

void MainWindow::registerUiCommands() {
    proc_.registerAction("ZOOM", {"Z"}, [this](const std::vector<std::string>& args) {
        const std::string a = args.empty() ? "E" : toUpper(args.front());
        if (a == "E" || a == "EXTENTS") canvas_->zoomExtents();
        else if (a == "IN") canvas_->zoomBy(1.5);
        else if (a == "OUT") canvas_->zoomBy(1.0 / 1.5);
        else if (auto f = parseNumber(a); f && *f > 0) canvas_->zoomBy(*f);
        else message(tr("ZOOM options: E (extents), IN, OUT, or a factor such as 2 or 0.5."));
    }, true);
    proc_.registerAction("NEW", {}, [this](const std::vector<std::string>&) { newDrawing(); });
    proc_.registerAction("OPEN", {}, [this](const std::vector<std::string>&) { openDrawing(); });
    proc_.registerAction("DXFIN", {"IMPORT"}, [this](const std::vector<std::string>&) { actImportDxf_->trigger(); });
    proc_.registerAction("SAVE", {"QSAVE"}, [this](const std::vector<std::string>&) { save(); });
    proc_.registerAction("SAVEAS", {}, [this](const std::vector<std::string>&) { saveAs(); });
    proc_.registerAction("GRID", {}, [this](const std::vector<std::string>&) { actGrid_->toggle(); }, true);
    proc_.registerAction("SNAP", {}, [this](const std::vector<std::string>&) { actSnap_->toggle(); }, true);
    proc_.registerAction("ORTHO", {}, [this](const std::vector<std::string>&) { actOrtho_->toggle(); }, true);
    proc_.registerAction("OSNAP", {}, [this](const std::vector<std::string>&) { actOsnap_->toggle(); }, true);
    proc_.registerAction("POLAR", {}, [this](const std::vector<std::string>&) { actPolar_->toggle(); }, true);
    proc_.registerAction("DYNMODE", {}, [this](const std::vector<std::string>&) { actDyn_->toggle(); }, true);
    proc_.registerAction("POLARANG", {}, [this](const std::vector<std::string>& args) {
        auto v = args.empty() ? std::nullopt : parseNumber(args.front());
        if (!v || !(*v > 0) || *v > 180) { message(tr("Usage: POLARANG <degrees>, e.g. POLARANG 15")); return; }
        setPolarIncrement(*v);
        message(tr("Polar angle increment: %1\u00B0").arg(*v));
    }, true);
    proc_.registerAction("COPYCLIP", {}, [this](const std::vector<std::string>&) { copyToClipboard(false); });
    proc_.registerAction("CUTCLIP", {}, [this](const std::vector<std::string>&) { copyToClipboard(true); });
    proc_.registerAction("PASTECLIP", {}, [this](const std::vector<std::string>&) { pasteFromClipboard(); });
    proc_.registerAction("LAYER", {"LA"}, [this](const std::vector<std::string>&) { actLayers_->trigger(); }, true);
    proc_.registerAction("LWDISPLAY", {}, [this](const std::vector<std::string>&) { actLwt_->toggle(); }, true);
    proc_.registerAction("LTSCALE", {"LTS"}, [this](const std::vector<std::string>& args) {
        auto v = args.empty() ? std::nullopt : parseNumber(args.front());
        if (!v || !(*v > 0)) {
            message(tr("Usage: LTSCALE <factor>   (current %1)").arg(doc_.styles().ltscale()));
            return;
        }
        StyleTables t = doc_.styles();
        t.setLtscale(*v);
        doc_.setStylesWithUndo(std::move(t), "Linetype scale");
        message(tr("Global linetype scale: %1").arg(*v));
    }, true);
    proc_.registerAction("HELP", {"?"}, [this](const std::vector<std::string>&) {
        message(tr("Draw: LINE (L), PLINE (PL), ARC (A), CIRCLE (C), ELLIPSE (EL), SPLINE (SPL), RECTANGLE (REC),"
                   " SQUARE (SQ), POLYGON (POL), POINT (PO), ARROW (ARW), DONUT (DO), REVCLOUD (RC), XLINE (XL), RAY."));
        message(tr("Modify: MOVE (M), COPY (CO), ROTATE (RO), SCALE (SC), MIRROR (MI), STRETCH (S), ARRAY (AR), OFFSET (O),"
                   " TRIM (TR), EXTEND (EX), FILLET (F), CHAMFER (CHA), BREAK (BR), JOIN (J), EXPLODE (X)."
                   " Click a grip of a selected object to reshape it. Ctrl+C / Ctrl+X / Ctrl+V use the clipboard."));
        message(tr("Layers: LAYER (LA), MATCHPROP (MA), LTSCALE <factor>, LWDISPLAY. Use the Home ribbon drop-downs to"
                   " change the layer, colour, linetype and lineweight of selected objects."));
        message(tr("Other: ERASE (E), UNDO (U), REDO, ZOOM (Z) [E|IN|OUT|factor],"
                   " NEW, OPEN, SAVE, SAVEAS, DXFIN (IMPORT), GRID, SNAP, ORTHO, HELP."));
        message(tr("Coordinates: x,y  @dx,dy (relative)  @dist<angle (relative polar)  dist<angle  or a distance typed"
                   " while moving the cursor. Enter/Space/right-click = Enter, Esc = cancel."));
        message(tr("ZOOM, GRID, SNAP, ORTHO, OSNAP, POLAR, POLARANG and HELP also work in the middle of a command."));
        message(tr("At a point prompt type END, MID, CEN, QUA, INT, PER, TAN, NEA or NOD for a one-time object snap."));
    }, true);
}

// ------------------------------------------------------------------ commands

void MainWindow::startCommand(const QString& name) {
    if (proc_.isActive()) proc_.cancel();
    message(QStringLiteral("Command: %1").arg(name));
    proc_.runCommand(name.toStdString());
    canvas_->setFocus();
}

void MainWindow::executeCommandText(const QString& text) {
    message(QStringLiteral("%1 %2").arg(QString::fromStdString(proc_.prompt()), text));
    proc_.submit(text.toStdString());
    canvas_->setFocus();
    canvas_->update();
}

void MainWindow::message(const QString& m) {
    if (cmdLine_) cmdLine_->appendMessage(m);
}

void MainWindow::onProcessorState() {
    cmdLine_->setPrompt(QString::fromStdString(proc_.prompt()));
    canvas_->update();
}

void MainWindow::onDocumentChanged() {
    selection_.prune(doc_);
    props_->scheduleRefresh();
    if (layers_) layers_->scheduleRefresh();
    refreshPropertyCombos();
    actUndo_->setEnabled(doc_.undoStack().canUndo());
    actRedo_->setEnabled(doc_.undoStack().canRedo());
    updateTitle();
}

void MainWindow::updateTitle() {
    QString name = currentFile_.isEmpty() ? tr("Drawing1.dyn") : QFileInfo(currentFile_).fileName();
    if (currentFile_.isEmpty() && !importedFrom_.isEmpty())
        name = tr("%1 (imported)").arg(QFileInfo(importedFrom_).fileName());
    setWindowTitle(QStringLiteral("%1[*] - DYNAMIC CAD").arg(name));
    if (unitsLabel_) unitsLabel_->setText(tr("Units: %1").arg(QString::fromStdString(doc_.units())));
    setWindowModified(doc_.isModified());
}

// ------------------------------------------------------------------ files

bool MainWindow::maybeSave() {
    if (!doc_.isModified()) return true;
    const auto r = QMessageBox::warning(this, tr("DYNAMIC CAD"), tr("The drawing has been modified.\nSave changes?"),
                                        QMessageBox::Save | QMessageBox::Discard | QMessageBox::Cancel);
    if (r == QMessageBox::Save) return save();
    return r == QMessageBox::Discard;
}

void MainWindow::newDrawing() {
    if (!maybeSave()) return;
    proc_.cancel();
    selection_.clear();
    doc_.reset();
    currentFile_.clear();
    importedFrom_.clear();
    canvas_->resetView();
    updateTitle();
    message(tr("New drawing."));
}

void MainWindow::openDrawing() {
    if (!maybeSave()) return;
    QSettings s;
    const QString path = QFileDialog::getOpenFileName(this, tr("Open Drawing"), s.value("files/lastDir").toString(),
                                                      tr("All Drawings (*.dyn *.dxf);;DYNAMIC CAD Drawing (*.dyn);;"
                                                         "AutoCAD DXF (*.dxf);;All Files (*)"));
    if (!path.isEmpty()) openFile(path);
}

bool MainWindow::openFile(const QString& path) {
    if (QFileInfo(path).suffix().compare("dxf", Qt::CaseInsensitive) == 0) return importDxfPath(path);
    proc_.cancel();
    selection_.clear();
    const FileResult r = loadDynFile(doc_, path);
    if (!r.ok) {
        QMessageBox::critical(this, tr("Open Drawing"), QString::fromStdString(r.error));
        message(tr("Open failed: %1").arg(QString::fromStdString(r.error)));
        return false;
    }
    currentFile_ = QFileInfo(path).absoluteFilePath();
    importedFrom_.clear();
    QSettings().setValue("files/lastDir", QFileInfo(path).absolutePath());
    for (const auto& w : r.warnings) message(tr("Warning: %1").arg(QString::fromStdString(w)));
    if (!r.warnings.empty())
        QMessageBox::warning(this, tr("Open Drawing"),
                             tr("The drawing was opened, but %n item(s) could not be read and were skipped.\n"
                                "See the command line for details.", "", int(r.warnings.size())));
    canvas_->zoomExtents();
    updateTitle();
    message(tr("Opened %1 (%2 objects).").arg(QDir::toNativeSeparators(currentFile_)).arg(doc_.entityCount()));
    return true;
}

bool MainWindow::importDxfPath(const QString& path, bool showReport) {
    proc_.cancel();
    selection_.clear();
    QApplication::setOverrideCursor(Qt::WaitCursor);
    const DxfImportResult r = importDxfFile(path, doc_);
    QApplication::restoreOverrideCursor();
    if (!r.ok) {
        message(tr("DXF import failed: %1").arg(QString::fromStdString(r.error)));
        if (showReport) QMessageBox::critical(this, tr("Import DXF"), QString::fromStdString(r.error));
        return false;
    }
    currentFile_.clear(); // never overwrite the DXF: Save asks for a .dyn name
    importedFrom_ = QFileInfo(path).absoluteFilePath();
    QSettings().setValue("files/lastDir", QFileInfo(path).absolutePath());
    canvas_->zoomExtents();
    updateTitle();

    QStringList lines;
    lines << tr("Source: %1").arg(QString::fromStdString(describeAcadVersion(r.acadVersion)));
    lines << tr("Imported: %1 objects on %2 layers (%3 block insertions expanded)")
                 .arg(r.imported).arg(r.layerCount).arg(r.blockInsertsExpanded);
    lines << tr("Units: %1%2").arg(QString::fromStdString(r.units), r.unitsAssumed ? tr(" (assumed)") : QString());
    QStringList details;
    if (r.unsupportedTotal()) {
        details << tr("Not imported yet (not supported in this version):");
        for (const auto& [type, n] : r.unsupported) details << tr("  %1 x %2").arg(n).arg(QString::fromStdString(type));
    }
    if (r.paperSpaceSkipped) details << tr("%1 paper-space (layout) objects skipped; only model space is imported.").arg(r.paperSpaceSkipped);
    for (const auto& w : r.warnings) details << QString::fromStdString(w);

    message(tr("Imported DXF %1").arg(QDir::toNativeSeparators(importedFrom_)));
    for (const QString& l : lines + details) message(QStringLiteral("  ") + l);

    if (showReport) {
        QMessageBox box(details.isEmpty() ? QMessageBox::Information : QMessageBox::Warning, tr("Import DXF"),
                        lines.join("\n"), QMessageBox::Ok, this);
        if (!details.isEmpty()) {
            box.setInformativeText(tr("Some content was not imported. Check the drawing against the original before use. "
                                      "Click \"Show Details\" for the list."));
            box.setDetailedText(details.join("\n"));
        }
        box.exec();
    }
    return true;
}

bool MainWindow::saveToFile(const QString& path) {
    const FileResult r = saveDynFile(doc_, path);
    if (!r.ok) {
        QMessageBox::critical(this, tr("Save Drawing"), QString::fromStdString(r.error));
        return false;
    }
    currentFile_ = QFileInfo(path).absoluteFilePath();
    importedFrom_.clear();
    QSettings().setValue("files/lastDir", QFileInfo(path).absolutePath());
    doc_.markSaved();
    updateTitle();
    message(tr("Saved %1.").arg(QDir::toNativeSeparators(currentFile_)));
    return true;
}

bool MainWindow::save() {
    if (currentFile_.isEmpty()) return saveAs();
    return saveToFile(currentFile_);
}

bool MainWindow::saveAs() {
    QSettings s;
    QString suggestion = currentFile_;
    if (suggestion.isEmpty() && !importedFrom_.isEmpty()) {
        const QFileInfo fi(importedFrom_);
        suggestion = fi.absoluteDir().filePath(fi.completeBaseName() + ".dyn");
    }
    if (suggestion.isEmpty()) suggestion = s.value("files/lastDir").toString();
    QString path = QFileDialog::getSaveFileName(this, tr("Save Drawing As"), suggestion,
                                                tr("DYNAMIC CAD Drawing (*.dyn)"));
    if (path.isEmpty()) return false;
    if (QFileInfo(path).suffix().isEmpty()) path += ".dyn";
    return saveToFile(path);
}

void MainWindow::closeEvent(QCloseEvent* ev) {
    if (!maybeSave()) { ev->ignore(); return; }
    QSettings s;
    s.setValue("window/geometry", saveGeometry());
    s.setValue("window/state", saveState());
    ev->accept();
}

// ------------------------------------------------------------------ misc

void MainWindow::setTheme(ThemeKind kind) {
    theme_ = kind;
    Theme::apply(*qApp, kind);
    canvas_->setColors(Theme::canvasColors(kind));
    (kind == ThemeKind::Dark ? actDark_ : actLight_)->setChecked(true);
    QSettings().setValue("ui/theme", kind == ThemeKind::Dark ? "dark" : "light");
}

void MainWindow::showAbout() {
    QMessageBox::about(this, tr("About DYNAMIC CAD"),
                       tr("<h3>DYNAMIC CAD %1</h3>"
                          "<p>Professional 2D CAD by <b>Dynamic Engineers</b>.</p>"
                          "<p>Copyright &copy; Dynamic Engineers. All rights reserved.</p>"
                          "<p>Built with Qt %2 (LGPL v3). See Help &gt; Third-Party Notices.</p>")
                           .arg(DYNCAD_VERSION_STRING, qVersion()));
}

void MainWindow::showNotices() {
    QFile f(":/legal/THIRD_PARTY_NOTICES.md");
    QString text = f.open(QIODevice::ReadOnly) ? QString::fromUtf8(f.readAll()) : tr("Notices file missing.");
    QDialog dlg(this);
    dlg.setWindowTitle(tr("Third-Party Notices"));
    auto* browser = new QTextBrowser(&dlg);
    browser->setMarkdown(text);
    browser->setOpenExternalLinks(true);
    auto* buttons = new QDialogButtonBox(QDialogButtonBox::Close, &dlg);
    connect(buttons, &QDialogButtonBox::rejected, &dlg, &QDialog::reject);
    auto* lay = new QVBoxLayout(&dlg);
    lay->addWidget(browser);
    lay->addWidget(buttons);
    dlg.resize(720, 520);
    dlg.exec();
}

void MainWindow::showHelp() { proc_.runCommand("HELP"); }

namespace {
const char* kClipMime = "application/x-dynamiccad-entities";
}

void MainWindow::copyToClipboard(bool cut) {
    std::vector<EntityPtr> ents;
    for (EntityId id : selection_.ids())
        if (auto e = doc_.findEntity(id)) ents.push_back(e);
    if (ents.empty()) { message(tr("Select objects first, then copy.")); return; }
    auto* mime = new QMimeData;
    const QByteArray data = serializeEntities(ents);
    mime->setData(kClipMime, data);
    mime->setText(QString::fromUtf8(data));
    QGuiApplication::clipboard()->setMimeData(mime);
    message(tr("%n object(s) copied to the clipboard.", "", int(ents.size())));
    if (cut) {
        doc_.eraseWithUndo(selection_.ids());
        selection_.clear();
    }
}

void MainWindow::pasteFromClipboard() {
    const QMimeData* mime = QGuiApplication::clipboard()->mimeData();
    QByteArray data;
    if (mime && mime->hasFormat(kClipMime)) data = mime->data(kClipMime);
    else if (mime && mime->hasText()) data = mime->text().toUtf8();
    auto ents = deserializeEntities(data);
    if (ents.empty()) { message(tr("The clipboard does not contain DYNAMIC CAD objects.")); return; }
    if (proc_.isActive()) proc_.cancel();
    message(QStringLiteral("Command: PASTECLIP"));
    proc_.runCommandInstance(std::make_unique<PasteCommand>(std::move(ents)));
    canvas_->setFocus();
}

} // namespace dyncad
