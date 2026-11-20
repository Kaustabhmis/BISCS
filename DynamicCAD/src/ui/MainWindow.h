// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "commands/CommandProcessor.h"
#include "document/Document.h"
#include "selection/SelectionSet.h"
#include "ui/Theme.h"

#include <QMainWindow>
#include <memory>

class QAction;
class QLabel;

namespace dyncad {

class CadCanvas;
class CommandLine;
class PropertiesPanel;
class Ribbon;

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget* parent = nullptr);
    ~MainWindow() override;

    bool openFile(const QString& path);
    bool saveToFile(const QString& path);
    // Executes one command-line string exactly as if typed by the user.
    void executeCommandText(const QString& text);

    Document& document() { return doc_; }
    SelectionSet& selection() { return selection_; }
    CommandProcessor& processor() { return proc_; }
    CadCanvas* canvas() const { return canvas_; }
    CommandLine* commandLine() const { return cmdLine_; }
    const QString& currentFile() const { return currentFile_; }

public slots:
    void newDrawing();
    void openDrawing();
    bool save();
    bool saveAs();
    void setTheme(ThemeKind kind);

protected:
    void closeEvent(QCloseEvent* ev) override;

private:
    void createActions();
    void createMenus();
    void createRibbon();
    void createDocks();
    void createStatusBar();
    void registerUiCommands();
    void startCommand(const QString& name);
    bool maybeSave();
    void onDocumentChanged();
    void onProcessorState();
    void updateTitle();
    void message(const QString& m);
    void showAbout();
    void showNotices();
    void showHelp();

    Document doc_;
    SelectionSet selection_;
    CommandProcessor proc_;
    int docListener_ = 0;
    QString currentFile_;
    ThemeKind theme_ = ThemeKind::Dark;

    CadCanvas* canvas_ = nullptr;
    CommandLine* cmdLine_ = nullptr;
    PropertiesPanel* props_ = nullptr;
    Ribbon* ribbon_ = nullptr;
    QLabel* coordLabel_ = nullptr;

    QAction *actNew_{}, *actOpen_{}, *actSave_{}, *actSaveAs_{}, *actExit_{};
    QAction *actUndo_{}, *actRedo_{}, *actErase_{}, *actSelectAll_{}, *actDeselect_{};
    QAction *actLine_{}, *actCircle_{}, *actRect_{};
    QAction *actZoomExt_{}, *actZoomIn_{}, *actZoomOut_{};
    QAction *actGrid_{}, *actSnap_{}, *actOrtho_{}, *actDark_{}, *actLight_{};
    QAction *actAbout_{}, *actAboutQt_{}, *actNotices_{}, *actHelp_{};
};

} // namespace dyncad
