// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include <QStringList>
#include <QWidget>

class QLabel;
class QLineEdit;
class QPlainTextEdit;

namespace dyncad {

// Command history + prompt + input line. Space and Enter submit (as in most
// CAD programs); Esc cancels; Up/Down recall previous input.
class CommandLine : public QWidget {
    Q_OBJECT
public:
    explicit CommandLine(QWidget* parent = nullptr);

    void appendMessage(const QString& text);
    void setPrompt(const QString& prompt);
    // Focuses the input and appends text (used when typing on the canvas).
    void insertText(const QString& text);
    QString history() const;
    QLineEdit* input() const { return input_; }
    // While typing free text (TEXT, MTEXT), Space inserts a space instead of submitting.
    void setTextMode(bool on) { textMode_ = on; }

signals:
    void submitted(const QString& text);
    void cancelRequested();

protected:
    bool eventFilter(QObject* obj, QEvent* ev) override;

private:
    void submit();

    QPlainTextEdit* history_;
    QLabel* prompt_;
    QLineEdit* input_;
    QStringList recall_;
    int recallPos_ = 0;
    bool textMode_ = false;
};

} // namespace dyncad
