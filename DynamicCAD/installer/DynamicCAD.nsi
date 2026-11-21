; DYNAMIC CAD Windows installer (NSIS 3, zlib licence - free for commercial use).
; Build (from the repository root after windeployqt has filled DynamicCAD\dist):
;   makensis /DVERSION=0.5.0 /DSRCDIR=..\dist DynamicCAD\installer\DynamicCAD.nsi
Unicode true
ManifestDPIAware true
SetCompressor /SOLID lzma

!ifndef VERSION
  !define VERSION "0.0.0"
!endif
!ifndef SRCDIR
  !define SRCDIR "..\dist"
!endif
!ifndef OUTFILE
  !define OUTFILE "DynamicCAD-Setup-${VERSION}-x64.exe"
!endif

!define PRODUCT     "DYNAMIC CAD"
!define COMPANY     "Dynamic Engineers"
!define EXE         "DynamicCAD.exe"
!define UNINSTKEY   "Software\Microsoft\Windows\CurrentVersion\Uninstall\DynamicCAD"
!define PROGID      "DynamicCAD.Drawing"

!include "MUI2.nsh"
!include "x64.nsh"
!include "FileFunc.nsh"

Name "${PRODUCT} ${VERSION}"
OutFile "${OUTFILE}"
InstallDir "$PROGRAMFILES64\${COMPANY}\${PRODUCT}"
InstallDirRegKey HKLM "Software\${COMPANY}\${PRODUCT}" "InstallDir"
RequestExecutionLevel admin
BrandingText "${COMPANY}"

VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCT}"
VIAddVersionKey "CompanyName" "${COMPANY}"
VIAddVersionKey "LegalCopyright" "Copyright (C) ${COMPANY}"
VIAddVersionKey "FileDescription" "${PRODUCT} Setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"

!define MUI_ICON "..\resources\branding\dynamic-cad.ico"
!define MUI_UNICON "..\resources\branding\dynamic-cad.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Start ${PRODUCT} now"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "installer-license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "${PRODUCT} requires 64-bit Windows 10 or Windows 11."
    Abort
  ${EndIf}
  SetRegView 64
FunctionEnd

Function un.onInit
  SetRegView 64
FunctionEnd

Section "${PRODUCT} (required)" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"
  File /r "${SRCDIR}\*.*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  WriteRegStr HKLM "Software\${COMPANY}\${PRODUCT}" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "${UNINSTKEY}" "DisplayName" "${PRODUCT} ${VERSION}"
  WriteRegStr HKLM "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "${UNINSTKEY}" "Publisher" "${COMPANY}"
  WriteRegStr HKLM "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\${EXE}"
  WriteRegStr HKLM "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKLM "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINSTKEY}" "NoRepair" 1
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "${UNINSTKEY}" "EstimatedSize" "$0"

  CreateDirectory "$SMPROGRAMS\${PRODUCT}"
  CreateShortcut "$SMPROGRAMS\${PRODUCT}\${PRODUCT}.lnk" "$INSTDIR\${EXE}"
  CreateShortcut "$SMPROGRAMS\${PRODUCT}\Uninstall ${PRODUCT}.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Desktop shortcut" SecDesktop
  CreateShortcut "$DESKTOP\${PRODUCT}.lnk" "$INSTDIR\${EXE}"
SectionEnd

Section "Open .dyn drawings with ${PRODUCT}" SecAssoc
  WriteRegStr HKLM "Software\Classes\.dyn" "" "${PROGID}"
  WriteRegStr HKLM "Software\Classes\${PROGID}" "" "${PRODUCT} Drawing"
  WriteRegStr HKLM "Software\Classes\${PROGID}\DefaultIcon" "" "$INSTDIR\${EXE},0"
  WriteRegStr HKLM "Software\Classes\${PROGID}\shell\open\command" "" '"$INSTDIR\${EXE}" "%1"'
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} "The application, Qt runtime libraries, licences and sample drawings."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Place a shortcut on the desktop."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAssoc} "Double-click .dyn files to open them in ${PRODUCT}."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section "Uninstall"
  Delete "$DESKTOP\${PRODUCT}.lnk"
  RMDir /r "$SMPROGRAMS\${PRODUCT}"
  ReadRegStr $0 HKLM "Software\Classes\${PROGID}\shell\open\command" ""
  StrCmp $0 '"$INSTDIR\${EXE}" "%1"' 0 +3
    DeleteRegKey HKLM "Software\Classes\${PROGID}"
    DeleteRegKey HKLM "Software\Classes\.dyn"
  DeleteRegKey HKLM "${UNINSTKEY}"
  DeleteRegKey HKLM "Software\${COMPANY}\${PRODUCT}"
  RMDir /r "$INSTDIR"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
SectionEnd
