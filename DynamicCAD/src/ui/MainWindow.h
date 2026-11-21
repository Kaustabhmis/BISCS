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
class QMenu;
class QComboBox;
class QDockWidget;

namespace dyncad {

class CadCanvas;
class CommandLine;
class PropertiesPanel;
class LayerPanel;
class Ribbon;

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget* parent = nullptr);
    ~MainWindow() override;

    // Opens a .dyn drawing or imports a .dxf file (chosen by extension).
    bool openFile(const QString& path);
    bool importDxfPath(const QString& path, bool showReport = true);
    bool saveToFile(const QString& path);
    // Executes one command-line string exactly as if typed by the user.
    void executeCommandText(const QString& text);

    Document& document() { return doc_; }
    SelectionSet& selection() { return selection_; }
    CommandProcessor& processor() { return proc_; }
    CadCanvas* canvas() const { return canvas_; }
    CommandLine* commandLine() const { return cmdLine_; }
    LayerPanel* layerPanel() const { return layers_; }
    PropertiesPanel* propertiesPanel() const { return props_; }
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
    void createDraftingAids();
    void setPolarIncrement(double deg);
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
    void copyToClipboard(bool cut);
    void pasteFromClipboard();

    Document doc_;
    SelectionSet selection_;
    CommandProcessor proc_;
    int docListener_ = 0;
    QString currentFile_;
    ThemeKind theme_ = ThemeKind::Dark;

    CadCanvas* canvas_ = nullptr;
    CommandLine* cmdLine_ = nullptr;
    PropertiesPanel* props_ = nullptr;
    LayerPanel* layers_ = nullptr;
    QDockWidget* layerDock_ = nullptr;
    QComboBox* layerCombo_ = nullptr;
    QComboBox* colorCombo_ = nullptr;
    QComboBox* ltCombo_ = nullptr;
    QComboBox* lwCombo_ = nullptr;
    QAction* actLwt_ = nullptr;
    QAction* actLayers_ = nullptr;
    QAction* actMatchProp_ = nullptr;
    void refreshPropertyCombos();
    void createLayerRibbonGroup(class RibbonPage* home);
    Ribbon* ribbon_ = nullptr;
    QLabel* coordLabel_ = nullptr;
    QLabel* unitsLabel_ = nullptr;
    QString importedFrom_; // source DXF of an imported, not-yet-saved drawing

    QAction *actNew_{}, *actOpen_{}, *actImportDxf_{}, *actSave_{}, *actSaveAs_{}, *actExit_{};
    QAction *actUndo_{}, *actRedo_{}, *actErase_{}, *actSelectAll_{}, *actDeselect_{};
    QAction *actLine_{}, *actCircle_{}, *actRect_{};
    QAction *actPline_{}, *actArc_{}, *actPolygon_{}, *actEllipse_{}, *actSpline_{}, *actPoint_{}, *actSquare_{}, *actArrow_{};
    QAction *actXline_{}, *actRay_{}, *actDonut_{}, *actRevcloud_{};
    QAction *actMove_{}, *actCopy_{}, *actRotate_{}, *actScale_{}, *actMirror_{}, *actStretch_{}, *actArray_{};
    QAction *actOffset_{}, *actTrim_{}, *actExtend_{}, *actFillet_{}, *actChamfer_{}, *actBreak_{}, *actJoin_{}, *actExplode_{};
    QAction *actCutClip_{}, *actCopyClip_{}, *actPasteClip_{};
    QAction *actText_{}, *actMText_{}, *actDimLin_{}, *actDimAli_{}, *actDimAng_{}, *actDimRad_{}, *actDimDia_{}, *actLeader_{};
    QAction *actDist_{}, *actArea_{}, *actId_{};
    QAction *actBlock_{}, *actInsert_{}, *actHatch_{}, *actPurge_{};
    QAction *actZoomExt_{}, *actZoomIn_{}, *actZoomOut_{};
    QAction *actGrid_{}, *actSnap_{}, *actOrtho_{}, *actDark_{}, *actLight_{};
    QAction *actOsnap_{}, *actPolar_{}, *actDyn_{};
    QMenu* snapMenu_ = nullptr;
    QMenu* polarMenu_ = nullptr;
    QAction *actAbout_{}, *actAboutQt_{}, *actNotices_{}, *actHelp_{};
};

} // namespace dyncad
