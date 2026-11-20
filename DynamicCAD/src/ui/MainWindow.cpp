// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/MainWindow.h"

#include "canvas/CadCanvas.h"
#include "fileio/DynFormat.h"
#include "ui/CommandLine.h"
#include "ui/Icons.h"
#include "ui/PropertiesPanel.h"
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
#include <QLabel>
#include <QMenuBar>
#include <QMessageBox>
#include <QSettings>
#include <QStatusBar>
#include <QTextBrowser>
#include <QToolButton>
#include <QVBoxLayout>

namespace dyncad {

MainWindow::MainWindow(QWidget* parent) : QMainWindow(parent), proc_(doc_, selection_) {
    setWindowIcon(Icons::appIcon());
    registerCoreCommands(proc_, doc_);

    canvas_ = new CadCanvas(doc_, selection_, proc_, this);
    setCentralWidget(canvas_);

    createActions();
    createMenus();
    createRibbon();
    createDocks();
    createStatusBar();
    registerUiCommands();

    proc_.onMessage = [this](const std::string& m) { message(QString::fromStdString(m)); };
    proc_.onStateChanged = [this] { onProcessorState(); };
    selection_.onChanged = [this] {
        props_->refresh();
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
    actOpen_ = make(tr("&Open..."), "open", QKeySequence::Open, tr("Open a DYNAMIC CAD drawing (*.dyn)"));
    actSave_ = make(tr("&Save"), "save", QKeySequence::Save, tr("Save the drawing"));
    actSaveAs_ = make(tr("Save &As..."), "", QKeySequence(Qt::CTRL | Qt::SHIFT | Qt::Key_S), tr("Save the drawing under a new name"));
    actExit_ = make(tr("E&xit"), "", QKeySequence(Qt::ALT | Qt::Key_F4), tr("Exit DYNAMIC CAD"));
    connect(actNew_, &QAction::triggered, this, &MainWindow::newDrawing);
    connect(actOpen_, &QAction::triggered, this, &MainWindow::openDrawing);
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
                actZoomOut_, actGrid_, actSnap_, actOrtho_, actHelp_});
}

void MainWindow::createMenus() {
    QMenu* file = menuBar()->addMenu(tr("&File"));
    file->addActions({actNew_, actOpen_, actSave_, actSaveAs_});
    file->addSeparator();
    file->addAction(actExit_);

    QMenu* edit = menuBar()->addMenu(tr("&Edit"));
    edit->addActions({actUndo_, actRedo_});
    edit->addSeparator();
    edit->addActions({actErase_, actSelectAll_, actDeselect_});

    QMenu* draw = menuBar()->addMenu(tr("&Draw"));
    draw->addActions({actLine_, actCircle_, actRect_});

    QMenu* view = menuBar()->addMenu(tr("&View"));
    view->addActions({actZoomExt_, actZoomIn_, actZoomOut_});
    view->addSeparator();
    view->addActions({actGrid_, actSnap_, actOrtho_});
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
    home->addGroup(tr("File"), {actNew_, actOpen_, actSave_});
    home->addGroup(tr("Draw"), {actLine_, actCircle_, actRect_});
    home->addGroup(tr("Modify"), {actErase_, actUndo_, actRedo_});
    home->addGroup(tr("Selection"), {actSelectAll_});
    RibbonPage* view = ribbon_->addPage(tr("View"));
    view->addGroup(tr("Navigate"), {actZoomExt_, actZoomIn_, actZoomOut_});
    view->addGroup(tr("Drafting Aids"), {actGrid_, actSnap_, actOrtho_});
    view->addGroup(tr("Appearance"), {actDark_, actLight_});
    // Menu bar on top, ribbon directly beneath it as a fixed toolbar-like dock.
    auto* dock = new QDockWidget(tr("Ribbon"), this);
    dock->setObjectName("RibbonDock");
    dock->setWidget(ribbon_);
    dock->setFeatures(QDockWidget::NoDockWidgetFeatures);
    dock->setTitleBarWidget(new QWidget(dock));
    addDockWidget(Qt::TopDockWidgetArea, dock);
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

    if (auto* view = menuBar()->findChild<QMenu*>("ViewMenu")) view->addAction(propDock->toggleViewAction());
}

void MainWindow::createStatusBar() {
    coordLabel_ = new QLabel("0.0000, 0.0000", this);
    coordLabel_->setMinimumWidth(220);
    coordLabel_->setToolTip(tr("Cursor coordinates (X, Y) in drawing units"));
    statusBar()->addWidget(coordLabel_);
    for (QAction* a : {actGrid_, actSnap_, actOrtho_}) {
        auto* b = new QToolButton(this);
        b->setDefaultAction(a);
        b->setToolButtonStyle(Qt::ToolButtonTextOnly);
        b->setAutoRaise(true);
        statusBar()->addPermanentWidget(b);
    }
    auto* units = new QLabel(tr("Units: mm"), this);
    statusBar()->addPermanentWidget(units);
}

void MainWindow::registerUiCommands() {
    proc_.registerAction("ZOOM", {"Z"}, [this](const std::vector<std::string>& args) {
        const std::string a = args.empty() ? "E" : toUpper(args.front());
        if (a == "E" || a == "EXTENTS") canvas_->zoomExtents();
        else if (a == "IN") canvas_->zoomBy(1.5);
        else if (a == "OUT") canvas_->zoomBy(1.0 / 1.5);
        else if (auto f = parseNumber(a); f && *f > 0) canvas_->zoomBy(*f);
        else message(tr("ZOOM options: E (extents), IN, OUT, or a factor such as 2 or 0.5."));
    });
    proc_.registerAction("NEW", {}, [this](const std::vector<std::string>&) { newDrawing(); });
    proc_.registerAction("OPEN", {}, [this](const std::vector<std::string>&) { openDrawing(); });
    proc_.registerAction("SAVE", {"QSAVE"}, [this](const std::vector<std::string>&) { save(); });
    proc_.registerAction("SAVEAS", {}, [this](const std::vector<std::string>&) { saveAs(); });
    proc_.registerAction("GRID", {}, [this](const std::vector<std::string>&) { actGrid_->toggle(); });
    proc_.registerAction("SNAP", {}, [this](const std::vector<std::string>&) { actSnap_->toggle(); });
    proc_.registerAction("ORTHO", {}, [this](const std::vector<std::string>&) { actOrtho_->toggle(); });
    proc_.registerAction("HELP", {"?"}, [this](const std::vector<std::string>&) {
        message(tr("Commands: LINE (L), CIRCLE (C), RECTANGLE (REC), ERASE (E), UNDO (U), REDO, ZOOM (Z) [E|IN|OUT|factor],"
                   " NEW, OPEN, SAVE, SAVEAS, GRID, SNAP, ORTHO, HELP."));
        message(tr("Coordinates: x,y  @dx,dy (relative)  @dist<angle (relative polar)  dist<angle  or a distance typed"
                   " while moving the cursor. Enter/Space/right-click = Enter, Esc = cancel."));
    });
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
    props_->refresh();
    actUndo_->setEnabled(doc_.undoStack().canUndo());
    actRedo_->setEnabled(doc_.undoStack().canRedo());
    updateTitle();
}

void MainWindow::updateTitle() {
    const QString name = currentFile_.isEmpty() ? tr("Drawing1.dyn") : QFileInfo(currentFile_).fileName();
    setWindowTitle(QStringLiteral("%1[*] - DYNAMIC CAD").arg(name));
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
    canvas_->resetView();
    updateTitle();
    message(tr("New drawing."));
}

void MainWindow::openDrawing() {
    if (!maybeSave()) return;
    QSettings s;
    const QString path = QFileDialog::getOpenFileName(this, tr("Open Drawing"), s.value("files/lastDir").toString(),
                                                      tr("DYNAMIC CAD Drawing (*.dyn);;All Files (*)"));
    if (!path.isEmpty()) openFile(path);
}

bool MainWindow::openFile(const QString& path) {
    proc_.cancel();
    selection_.clear();
    const FileResult r = loadDynFile(doc_, path);
    if (!r.ok) {
        QMessageBox::critical(this, tr("Open Drawing"), QString::fromStdString(r.error));
        message(tr("Open failed: %1").arg(QString::fromStdString(r.error)));
        return false;
    }
    currentFile_ = QFileInfo(path).absoluteFilePath();
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

bool MainWindow::saveToFile(const QString& path) {
    const FileResult r = saveDynFile(doc_, path);
    if (!r.ok) {
        QMessageBox::critical(this, tr("Save Drawing"), QString::fromStdString(r.error));
        return false;
    }
    currentFile_ = QFileInfo(path).absoluteFilePath();
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
    QString path = QFileDialog::getSaveFileName(this, tr("Save Drawing As"),
                                                currentFile_.isEmpty() ? s.value("files/lastDir").toString() : currentFile_,
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

} // namespace dyncad
