# Development check (not shipped): audits DXF files written by DYNAMIC CAD with ezdxf (MIT licence).
# Usage: pip install ezdxf; run test_dxf_export (writes dxf-export-*.dxf), then
#   python3 audit_dxf_with_ezdxf.py dxf-export-sample.dxf dxf-export-sheet.dxf
import sys, ezdxf
from ezdxf import recover
for p in sys.argv[1:]:
    doc = ezdxf.readfile(p)
    auditor = doc.audit()
    print(p, "version", doc.dxfversion, "entities", len(doc.modelspace()), "errors", len(auditor.errors), "fixes", len(auditor.fixes))
    for e in auditor.errors[:20]: print("  ERR", e.message)
    for f in auditor.fixes[:20]: print("  FIX", f.message)
    from collections import Counter
    print("  ", Counter(e.dxftype() for e in doc.modelspace()))
