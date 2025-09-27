Naraka Settings Configurator
================================

Small static configurator for editing the game's `QualitySettingsData.json` format.

Files:
- `index.html` - UI
- `app.js` - editor logic, presets, import/export
- `styles.css` - styling

Usage:
1. Open `naraka-configurator/index.html` in a browser.
2. Edit values inline.
3. Download `QualitySettingsData.json` and place it in your Naraka game folder (backup original first!).

Notes:
- The configurator runs fully client-side and stores your last edited settings in browser localStorage.
- Presets are a convenience only — consult https://old.naraka.wiki/en/Graphic-Settings for the game's official meaning of each setting.

Quick PowerShell helper
-----------------------

If you're on Windows you can use the included `Save-NarakaSettings.ps1` helper to copy the exported `QualitySettingsData.json` into the game's config directory with a timestamped backup. Example commands (PowerShell):

1) Copy from the current directory to the typical install path (edit the path to match your install):

   .\Save-NarakaSettings.ps1 -SourcePath .\QualitySettingsData.json -GameDataPath "C:\Program Files (x86)\Naraka\Saved\Config\WindowsNoEditor"

2) If you want to skip making a backup of the existing file:

   .\Save-NarakaSettings.ps1 -SourcePath .\QualitySettingsData.json -GameDataPath "C:\Program Files (x86)\Naraka\Saved\Config\WindowsNoEditor" -NoBackup

The script will request elevation if needed, create the target directory if it doesn't exist, back up any existing `QualitySettingsData.json` with a timestamp, and copy your file into place.

License & safety
---------------

This repository does not and will not modify game files automatically from the browser. The PowerShell helper is an optional local convenience that you run manually; it is safer because it performs a backup and requires explicit elevation.
