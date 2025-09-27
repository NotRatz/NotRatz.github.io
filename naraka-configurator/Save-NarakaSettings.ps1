<#
Save-NarakaSettings.ps1
Helper to copy an exported QualitySettingsData.json into Naraka's game folder safely.
Usage examples (PowerShell):
  .\Save-NarakaSettings.ps1 -SourcePath .\QualitySettingsData.json -GameDataPath "C:\Program Files (x86)\Naraka\Saved\Config\WindowsNoEditor"

This script will:
- Ensure it runs elevated (prompt for UAC if not)
- Create a timestamped backup of existing QualitySettingsData.json if one exists
- Copy the new file into place and verify it exists
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$SourcePath,
  [Parameter(Mandatory=$true)]
  [string]$GameDataPath,
  [string]$TargetFilename = "QualitySettingsData.json",
  [switch]$NoBackup
)

function Ensure-Elevation {
  $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin) {
    Write-Host "Not running as Administrator. Relaunching with elevation..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`" $($args -join ' ')"
    $psi.Verb = "runas"
    try { [System.Diagnostics.Process]::Start($psi) | Out-Null; exit } catch { Write-Error "Elevation cancelled."; exit 1 }
  }
}

Ensure-Elevation

if (-not (Test-Path $SourcePath)) { Write-Error "Source file not found: $SourcePath"; exit 1 }

if (-not (Test-Path $GameDataPath)) {
  Write-Host "Game data path does not exist. Creating: $GameDataPath"
  try { New-Item -ItemType Directory -Path $GameDataPath -Force | Out-Null } catch { Write-Error "Failed to create game data path: $_"; exit 1 }
}

$targetPath = Join-Path -Path $GameDataPath -ChildPath $TargetFilename

if ((Test-Path $targetPath) -and (-not $NoBackup)) {
  $ts = Get-Date -Format "yyyyMMdd-HHmmss"
  $backupName = "${TargetFilename}.backup.$ts"
  $backupPath = Join-Path -Path $GameDataPath -ChildPath $backupName
  Write-Host "Creating backup of existing file: $backupPath"
  try { Copy-Item -Path $targetPath -Destination $backupPath -Force } catch { Write-Error "Backup failed: $_"; exit 1 }
}

Write-Host "Copying $SourcePath -> $targetPath"
try { Copy-Item -Path $SourcePath -Destination $targetPath -Force } catch { Write-Error "Copy failed: $_"; exit 1 }

if (Test-Path $targetPath) { Write-Host "Success: file placed at $targetPath"; exit 0 } else { Write-Error "Failed to verify copied file."; exit 1 }
