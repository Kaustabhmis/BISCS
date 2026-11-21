// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "ui/CommandLine.h"

#include <QFontDatabase>
#include <QHBoxLayout>
#include <QKeyEvent>
#include <QLabel>
#include <QLineEdit>
#include <QPlainTextEdit>
#include <QScrollBar>
#include <QVBoxLayout>

namespace dyncad {

CommandLine::CommandLine(QWidget* parent) : QWidget(parent) {
    const QFont mono = QFontDatabase::systemFont(QFontDatabase::FixedFont);
    history_ = new QPlainTextEdit(this);
    history_->setReadOnly(true);
    history_->setFont(mono);
    history_->setMaximumBlockCount(2000);
    history_->setFocusPolicy(Qt::NoFocus);
    history_->setMinimumHeight(48);

    prompt_ = new QLabel(tr("Command:"), this);
    prompt_->setFont(mono);
    input_ = new QLineEdit(this);
    input_->setFont(mono);
    input_->setPlaceholderText(tr("Type a command (L, C, REC, E, U...) or coordinates"));
    input_->installEventFilter(this);

    auto* row = new QHBoxLayout;
    row->setContentsMargins(0, 0, 0, 0);
    row->addWidget(prompt_);
    row->addWidget(input_, 1);

    auto* lay = new QVBoxLayout(this);
    lay->setContentsMargins(4, 2, 4, 4);
    lay->setSpacing(2);
    lay->addWidget(history_, 1);
    lay->addLayout(row);
}

void CommandLine::appendMessage(const QString& text) {
    history_->appendPlainText(text);
    history_->verticalScrollBar()->setValue(history_->verticalScrollBar()->maximum());
}

void CommandLine::setPrompt(const QString& prompt) { prompt_->setText(prompt); }

void CommandLine::insertText(const QString& text) {
    input_->setFocus();
    input_->insert(text);
}

QString CommandLine::history() const { return history_->toPlainText(); }

void CommandLine::submit() {
    const QString text = textMode_ ? input_->text() : input_->text().trimmed();
    input_->clear();
    if (!text.isEmpty()) {
        recall_.append(text);
        if (recall_.size() > 200) recall_.removeFirst();
    }
    recallPos_ = recall_.size();
    emit submitted(text);
}

bool CommandLine::eventFilter(QObject* obj, QEvent* ev) {
    if (obj == input_ && ev->type() == QEvent::KeyPress) {
        auto* ke = static_cast<QKeyEvent*>(ev);
        switch (ke->key()) {
        case Qt::Key_Space:
            if (textMode_) return false; // normal typing
            submit();
            return true;
        case Qt::Key_Return:
        case Qt::Key_Enter:
            submit();
            return true;
        case Qt::Key_Escape:
            input_->clear();
            emit cancelRequested();
            return true;
        case Qt::Key_Up:
            if (recallPos_ > 0) input_->setText(recall_.at(--recallPos_));
            return true;
        case Qt::Key_Down:
            if (recallPos_ < recall_.size() - 1) input_->setText(recall_.at(++recallPos_));
            else { recallPos_ = recall_.size(); input_->clear(); }
            return true;
        default: break;
        }
    }
    return QWidget::eventFilter(obj, ev);
}

} // namespace dyncad
