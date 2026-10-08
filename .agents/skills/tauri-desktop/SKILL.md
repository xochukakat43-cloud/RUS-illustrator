---
name: tauri-desktop
description: >-
  Guide and reference for packaging the Vector Studio React/Vite app into a lightweight,
  high-performance Windows desktop application using Tauri 2.0 and Rust.
---

# Tauri 2.0 Desktop Packaging Guide

Use this skill when initializing, building, or debugging the desktop version of Vector Studio.

## 1. Prerequisites (Windows)
- Rust toolchain: `rustup default stable-x86_64-pc-windows-msvc`
- Microsoft Visual C++ Build Tools
- Node.js & npm

---

## 2. Initialization & Configuration
To add Tauri to the existing Vite project:
```powershell
npm install -D @tauri-apps/cli
npx tauri init
```
- App name: `Vector Studio`
- Window title: `Adobe Illustrator - Vector Studio`
- Dev server URL: `http://localhost:5173`
- Frontend dist: `../dist`

### Window Configuration (`src-tauri/tauri.conf.json`)
```json
{
  "app": {
    "windows": [
      {
        "title": "Vector Studio",
        "width": 1440,
        "height": 900,
        "minWidth": 1024,
        "minHeight": 700,
        "resizable": true,
        "fullscreen": false,
        "decorations": true
      }
    ]
  }
}
```

---

## 3. Native OS Features
- **Native File Dialogs**: `@tauri-apps/plugin-dialog` for opening and saving `.ai.json` and `.svg` files directly to the Windows file system.
- **Native Menus**: Add File, Edit, View, Window native menu bar items with standard OS shortcuts (`Ctrl+N`, `Ctrl+O`, `Ctrl+S`, `Ctrl+Z`).
- **File Association**: Associate `.vzq` and `.ai.json` files in Windows Explorer to open Vector Studio automatically.

---

## 4. Production Build
```powershell
npm run build
npx tauri build
```
Generates a standalone, lightweight `.exe` installer (typically under 15-20 MB, compared to 150+ MB for Electron).
