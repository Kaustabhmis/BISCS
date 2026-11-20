// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/Ribbon.h"

#include <QAction>
#include <QFrame>
#include <QHBoxLayout>
#include <QLabel>
#include <QToolButton>
#include <QVBoxLayout>

namespace dyncad {

RibbonPage::RibbonPage(QWidget* parent) : QWidget(parent) {
    layout_ = new QHBoxLayout(this);
    layout_->setContentsMargins(4, 2, 4, 2);
    layout_->setSpacing(4);
    layout_->addStretch(1);
}

void RibbonPage::addGroup(const QString& title, const QList<QAction*>& actions) {
    auto* group = new QWidget(this);
    auto* v = new QVBoxLayout(group);
    v->setContentsMargins(2, 0, 2, 0);
    v->setSpacing(0);
    auto* row = new QHBoxLayout;
    row->setSpacing(1);
    for (QAction* a : actions) {
        auto* b = new QToolButton(group);
        b->setDefaultAction(a);
        b->setToolButtonStyle(Qt::ToolButtonTextUnderIcon);
        b->setIconSize(QSize(28, 28));
        b->setAutoRaise(true);
        b->setMinimumWidth(56);
        row->addWidget(b);
    }
    v->addLayout(row);
    auto* label = new QLabel(title, group);
    label->setObjectName("RibbonGroupTitle");
    label->setAlignment(Qt::AlignCenter);
    label->setEnabled(false);
    v->addWidget(label);

    const int insertAt = layout_->count() - 1; // before the stretch
    if (insertAt > 0) {
        auto* sep = new QFrame(this);
        sep->setObjectName("RibbonSeparator");
        sep->setFrameShape(QFrame::VLine);
        sep->setFrameShadow(QFrame::Plain);
        layout_->insertWidget(insertAt, sep);
        layout_->insertWidget(insertAt + 1, group);
    } else {
        layout_->insertWidget(insertAt, group);
    }
}

Ribbon::Ribbon(QWidget* parent) : QTabWidget(parent) {
    setObjectName("Ribbon");
    setDocumentMode(true);
    setSizePolicy(QSizePolicy::Preferred, QSizePolicy::Fixed);
}

RibbonPage* Ribbon::addPage(const QString& title) {
    auto* page = new RibbonPage(this);
    addTab(page, title);
    return page;
}

} // namespace dyncad
