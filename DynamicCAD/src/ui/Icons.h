// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include <QIcon>
#include <QString>

namespace dyncad::Icons {
// Original vector icons painted at runtime (no third-party artwork).
QIcon get(const QString& name);
QIcon appIcon();
} // namespace dyncad::Icons
