// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include <QList>
#include <QTabWidget>

class QAction;
class QHBoxLayout;

namespace dyncad {

// Lightweight ribbon: tabs containing titled groups of large tool buttons.
// Every button is bound to a real QAction (no decorative-only buttons).
class RibbonPage : public QWidget {
    Q_OBJECT
public:
    explicit RibbonPage(QWidget* parent = nullptr);
    void addGroup(const QString& title, const QList<QAction*>& actions);
    // Group containing arbitrary widgets (e.g. layer / colour drop-downs).
    void addWidgetGroup(const QString& title, QWidget* content);

private:
    void insertGroup(QWidget* group);
    QHBoxLayout* layout_;
};

class Ribbon : public QTabWidget {
    Q_OBJECT
public:
    explicit Ribbon(QWidget* parent = nullptr);
    RibbonPage* addPage(const QString& title);
};

} // namespace dyncad
