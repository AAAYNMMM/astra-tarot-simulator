param(
    [Parameter(Mandatory = $true)]
    [string]$ArchivePath
)

$ErrorActionPreference = 'Stop'

$resolvedArchive = (Resolve-Path -LiteralPath $ArchivePath).Path
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$assetDirectory = Join-Path $projectRoot 'assets\rws'
$stagingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) (
    'astra-rws-' + [guid]::NewGuid().ToString('N')
)

New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $stagingDirectory | Out-Null
Expand-Archive -LiteralPath $resolvedArchive -DestinationPath $stagingDirectory

$sourceDirectory = Get-ChildItem -LiteralPath $stagingDirectory -Directory -Recurse |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName '00-TheFool.jpg') } |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $sourceDirectory) {
    throw 'The archive does not contain the expected Cards-jpg deck.'
}

for ($majorIndex = 0; $majorIndex -le 21; $majorIndex += 1) {
    $source = Get-ChildItem -LiteralPath $sourceDirectory -File |
        Where-Object { $_.Name -match ('^{0:D2}-' -f $majorIndex) } |
        Select-Object -First 1
    if (-not $source) {
        throw "Missing major arcana card $majorIndex."
    }
    Copy-Item -LiteralPath $source.FullName `
        -Destination (Join-Path $assetDirectory "major-$majorIndex.jpg") -Force
}

$ranks = @(
    'ace', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'ten', 'page', 'knight', 'queen', 'king'
)
$suits = @{
    wands = 'Wands'
    cups = 'Cups'
    swords = 'Swords'
    pentacles = 'Pentacles'
}

foreach ($suit in $suits.Keys) {
    for ($rankIndex = 0; $rankIndex -lt $ranks.Count; $rankIndex += 1) {
        $source = Join-Path $sourceDirectory (
            '{0}{1:D2}.jpg' -f $suits[$suit], ($rankIndex + 1)
        )
        if (-not (Test-Path -LiteralPath $source)) {
            throw "Missing minor arcana image: $source"
        }
        Copy-Item -LiteralPath $source `
            -Destination (Join-Path $assetDirectory "$suit-$($ranks[$rankIndex]).jpg") -Force
    }
}

Copy-Item -LiteralPath (Join-Path $sourceDirectory 'CardBacks.jpg') `
    -Destination (Join-Path $assetDirectory 'card-back.jpg') -Force

$cardFaces = @(
    Get-ChildItem -LiteralPath $assetDirectory -File -Filter '*.jpg' |
        Where-Object Name -NotLike 'card-back*'
)
if ($cardFaces.Count -ne 78) {
    throw "Expected 78 card faces after preparation; found $($cardFaces.Count)."
}

Write-Output "Prepared 78 Rider-Waite-Smith faces and one card back in $assetDirectory"
Write-Output "Temporary extraction directory: $stagingDirectory"
