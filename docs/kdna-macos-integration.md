# KDNA macOS Integration — Design Specification

> **Status:** Design specification. Implementation pending in KDNAChat.

## Overview

Make `.kdna` files first-class citizens on macOS — double-clickable, previewable, and recognizably associated with KDNAChat.

## File Association

### Uniform Type Identifier (UTType)

Register a custom UTType for `.kdna` files:

```xml
<!-- Info.plist in KDNAChat.app -->
<key>UTExportedTypeDeclarations</key>
<array>
  <dict>
    <key>UTTypeIdentifier</key>
    <string>com.aikdna.kdna</string>
    <key>UTTypeDescription</key>
    <string>KDNA Domain Cognition Package</string>
    <key>UTTypeConformsTo</key>
    <array>
      <string>public.data</string>
      <string>public.archive</string>
      <string>com.pkware.zip-archive</string>
    </array>
    <key>UTTypeTagSpecification</key>
    <dict>
      <key>public.filename-extension</key>
      <array>
        <string>kdna</string>
      </array>
      <key>public.mime-type</key>
      <array>
        <string>application/x-kdna</string>
      </array>
    </dict>
  </dict>
</array>
```

### Document Type Role

```xml
<key>CFBundleDocumentTypes</key>
<array>
  <dict>
    <key>CFBundleTypeName</key>
    <string>KDNA Domain Package</string>
    <key>CFBundleTypeRole</key>
    <string>Viewer</string>
    <key>LSHandlerRank</key>
    <string>Owner</string>
    <key>LSItemContentTypes</key>
    <array>
      <string>com.aikdna.kdna</string>
    </array>
  </dict>
</array>
```

## User Interactions

### Double-Click

1. User double-clicks `writing.kdna` in Finder
2. macOS launches KDNAChat (if installed)
3. KDNAChat opens the Domain Inspector view
4. Shows: name, version, status, author, description, file inventory
5. Offers: "Install to KDNA Library" or "View Contents"

### Drag-and-Drop

1. User drags `.kdna` file onto:
   - KDNAChat dock icon → Opens in Domain Inspector
   - KDNAChat window → Same as double-click
   - Terminal → CLI could auto-run `kdna install ./file.kdna`

### Right-Click / Context Menu

Finder context menu options for `.kdna` files:

| Option | Action |
|--------|--------|
| **Open** | Opens in KDNAChat Domain Inspector |
| **Validate** | Shell: `kdna verify <file>` with result notification |
| **Install** | Shell: `kdna install <file>` with result notification |
| **Inspect** | Shows metadata without unpacking |
| **Share** | Standard macOS share sheet |

### Quick Look

Generate a Quick Look preview for `.kdna` files:

- Thumbnail: KDNA icon with domain name and version
- Preview panel: Shows manifest metadata (name, version, description, axioms count, evals count)

```swift
// QuickLookPreviewGenerator.swift
func generatePreview(for kdnaURL: URL) -> NSView {
    let manifest = readManifest(from: kdnaURL)
    return DomainPreviewView(manifest: manifest)
}
```

### Icon

Design a `.kdna` file icon that:
- Uses the KDNA brand mark (🧬 DNA helix + knowledge node)
- Works at 16px-512px
- Has a distinct silhouette for finder sidebar recognition
- Uses `.icns` format for macOS

## Installer Integration

When KDNAChat is installed or updated:

1. Register UTType via Launch Services
2. `LSSetDefaultRoleHandlerForContentType` for `com.aikdna.kdna`
3. Associate `.kdna` extension
4. Set as default handler (owner role)
5. Update Launch Services database

```bash
# After app install
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f /Applications/KDNAChat.app
```

## MIME Type Registration

Register with IANA (informational):

```
MIME type: application/x-kdna
Extension: .kdna
Description: KDNA Domain Cognition Package
```

## Design Principles

1. **No surprises:** Double-clicking never silently installs. Always shows metadata first.
2. **Trust is visible:** Signature status is prominently displayed.
3. **CLI parity:** Every GUI action maps to a `kdna` CLI command.
4. **Offline capable:** Domain inspection works without network. Install requires network for non-local files.

## Implementation Priority

| Phase | Feature |
|-------|---------|
| **P0** | UTType registration, double-click → Domain Inspector |
| **P1** | Drag-and-drop, right-click Validate/Install |
| **P2** | Quick Look preview generator |
| **P3** | Custom icon, share sheet integration |
