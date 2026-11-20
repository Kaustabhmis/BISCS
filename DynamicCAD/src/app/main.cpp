// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/Icons.h"
#include "ui/MainWindow.h"
#include "ui/Theme.h"
#include "version.h"

#include <QApplication>
#include <QSettings>

int main(int argc, char* argv[]) {
    QApplication app(argc, argv);
    QApplication::setApplicationName("DYNAMIC CAD");
    QApplication::setApplicationVersion(DYNCAD_VERSION_STRING);
    QApplication::setOrganizationName("Dynamic Engineers");
    QApplication::setWindowIcon(dyncad::Icons::appIcon());

    const bool light = QSettings().value("ui/theme", "dark").toString() == "light";
    dyncad::MainWindow w;
    w.setTheme(light ? dyncad::ThemeKind::Light : dyncad::ThemeKind::Dark);
    w.show();

    const QStringList args = QApplication::arguments();
    if (args.size() > 1) w.openFile(args.at(1));
    return app.exec();
}
