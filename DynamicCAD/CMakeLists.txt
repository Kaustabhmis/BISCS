# DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
cmake_minimum_required(VERSION 3.21)

project(DynamicCAD VERSION 0.9.0 LANGUAGES CXX
        DESCRIPTION "DYNAMIC CAD - professional 2D CAD by Dynamic Engineers")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

option(DYNCAD_BUILD_TESTS "Build the automated test suite" ON)
option(DYNCAD_SANITIZE "Build with AddressSanitizer + UBSan (GCC/Clang, for testing)" OFF)

if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
endif()

# Qt 6 is used under the LGPL v3: link dynamically (shared Qt libraries), never
# statically, so end users can replace the Qt DLLs. See LICENSES/.
find_package(Qt6 6.2 REQUIRED COMPONENTS Core Gui Widgets PrintSupport)

if(MSVC)
    add_compile_options(/W4 /permissive- /utf-8 /Zc:__cplusplus)
else()
    add_compile_options(-Wall -Wextra -Wpedantic)
    if(DYNCAD_SANITIZE)
        add_compile_options(-fsanitize=address,undefined -fno-omit-frame-pointer)
        add_link_options(-fsanitize=address,undefined)
    endif()
endif()

configure_file(src/version.h.in ${CMAKE_CURRENT_BINARY_DIR}/generated/version.h @ONLY)

# ---------------------------------------------------------------- core library
# GUI-independent engine: geometry, entities, document/undo, commands,
# selection, view math and file I/O. Depends on QtCore only (JSON, files).
add_library(dyncad_core STATIC
    src/geometry/Vec2.h
    src/geometry/BoundingBox.h
    src/geometry/Geometry.h            src/geometry/Geometry.cpp
    src/geometry/Affine2D.h
    src/geometry/Arc.h                 src/geometry/Arc.cpp
    src/geometry/Ellipse.h             src/geometry/Ellipse.cpp
    src/geometry/Nurbs.h               src/geometry/Nurbs.cpp
    src/geometry/Intersections.h       src/geometry/Intersections.cpp
    src/entities/Entity.h
    src/entities/LineEntity.h          src/entities/LineEntity.cpp
    src/entities/CircleEntity.h        src/entities/CircleEntity.cpp
    src/entities/PolylineEntity.h      src/entities/PolylineEntity.cpp
    src/entities/ArcEntity.h           src/entities/ArcEntity.cpp
    src/entities/CurveEntities.h       src/entities/CurveEntities.cpp
    src/entities/EntityGeometry.h      src/entities/EntityGeometry.cpp
    src/entities/XLineEntity.h         src/entities/XLineEntity.cpp
    src/entities/Annotation.h          src/entities/Annotation.cpp
    src/entities/BlockEntities.h       src/entities/BlockEntities.cpp
    src/entities/HatchEntity.h         src/entities/HatchEntity.cpp
    src/layers/Style.h                 src/layers/Style.cpp
    src/layers/LayerTable.h            src/layers/LayerTable.cpp
    src/document/UndoStack.h           src/document/UndoStack.cpp
    src/document/Document.h            src/document/Document.cpp
    src/document/EditCommands.h        src/document/EditCommands.cpp
    src/selection/SelectionSet.h       src/selection/SelectionSet.cpp
    src/snapping/SnapEngine.h          src/snapping/SnapEngine.cpp
    src/commands/InputParser.h         src/commands/InputParser.cpp
    src/commands/InteractiveCommand.h  src/commands/InteractiveCommand.cpp
    src/commands/DrawCommands.h        src/commands/DrawCommands.cpp
    src/commands/ShapeCommands.h       src/commands/ShapeCommands.cpp
    src/commands/ModifyCommands.h      src/commands/ModifyCommands.cpp
    src/commands/CurveEdit.h           src/commands/CurveEdit.cpp
    src/commands/GripAndClipboard.h    src/commands/GripAndClipboard.cpp
    src/commands/AnnotationCommands.h  src/commands/AnnotationCommands.cpp
    src/commands/BlockHatchCommands.h  src/commands/BlockHatchCommands.cpp
    src/commands/CommandProcessor.h    src/commands/CommandProcessor.cpp
    src/canvas/ViewTransform.h         src/canvas/ViewTransform.cpp
    src/fileio/DynFormat.h             src/fileio/DynFormat.cpp
    src/fileio/AutoSave.h              src/fileio/AutoSave.cpp
    src/dxf/DxfReader.h                src/dxf/DxfReader.cpp
    src/dxf/DxfWriter.h                src/dxf/DxfWriter.cpp
    src/sheets/PlotLayout.h            src/sheets/PlotLayout.cpp
    src/sheets/SheetTemplates.h        src/sheets/SheetTemplates.cpp
    src/commands/SheetCommands.h       src/commands/SheetCommands.cpp
)
target_include_directories(dyncad_core PUBLIC src ${CMAKE_CURRENT_BINARY_DIR}/generated)
target_link_libraries(dyncad_core PUBLIC Qt6::Core)

# ---------------------------------------------------------------- UI library
add_library(dyncad_ui STATIC
    src/canvas/CadCanvas.h       src/canvas/CadCanvas.cpp
    src/ui/Theme.h               src/ui/Theme.cpp
    src/ui/Icons.h               src/ui/Icons.cpp
    src/ui/CommandLine.h         src/ui/CommandLine.cpp
    src/ui/PropertiesPanel.h     src/ui/PropertiesPanel.cpp
    src/ui/StyleWidgets.h        src/ui/StyleWidgets.cpp
    src/ui/LayerPanel.h          src/ui/LayerPanel.cpp
    src/ui/Ribbon.h              src/ui/Ribbon.cpp
    src/ui/MainWindow.h          src/ui/MainWindow.cpp
    src/ui/Plotter.h             src/ui/Plotter.cpp
    resources/resources.qrc
)
target_link_libraries(dyncad_ui PUBLIC dyncad_core Qt6::Gui Qt6::Widgets Qt6::PrintSupport)

# ---------------------------------------------------------------- application
set(DYNCAD_APP_SOURCES src/app/main.cpp)
if(WIN32)
    set(DYNCAD_ICON_PATH "${CMAKE_CURRENT_SOURCE_DIR}/resources/branding/dynamic-cad.ico")
    file(TO_CMAKE_PATH "${DYNCAD_ICON_PATH}" DYNCAD_ICON_PATH)
    configure_file(resources/windows/DynamicCAD.rc.in ${CMAKE_CURRENT_BINARY_DIR}/generated/DynamicCAD.rc @ONLY)
    list(APPEND DYNCAD_APP_SOURCES ${CMAKE_CURRENT_BINARY_DIR}/generated/DynamicCAD.rc)
endif()
add_executable(DynamicCAD WIN32 ${DYNCAD_APP_SOURCES})
target_link_libraries(DynamicCAD PRIVATE dyncad_ui)
set_target_properties(DynamicCAD PROPERTIES OUTPUT_NAME "DynamicCAD")

install(TARGETS DynamicCAD RUNTIME DESTINATION .)
install(DIRECTORY LICENSES/ DESTINATION licenses)
install(DIRECTORY docs/samples/ DESTINATION samples)

# ---------------------------------------------------------------- tests
if(DYNCAD_BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()
