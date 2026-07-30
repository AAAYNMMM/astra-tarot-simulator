param(
    [int]$Width = 500
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$userAgent = 'AstraTarotLocalAssetBuilder/1.0 (offline educational tarot simulator)'
$ranks = @(
    'ace', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'ten', 'page', 'knight', 'queen', 'king'
)
$suits = @('wands', 'cups', 'swords', 'pentacles')

function Get-AppMajorSourceNumber {
    param([int]$Number)
    if ($Number -eq 8) { return 11 }
    if ($Number -eq 11) { return 8 }
    return $Number
}

function Save-CommonsFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FileName,
        [Parameter(Mandatory = $true)]
        [string]$Destination
    )

    $parent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    if (Test-Path -LiteralPath $Destination) {
        return
    }

    $normalizedName = $FileName.Replace(' ', '_')
    $md5 = [System.Security.Cryptography.MD5]::Create()
    try {
        $hashBytes = $md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($normalizedName))
    } finally {
        $md5.Dispose()
    }
    $hash = -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
    $encodedName = [uri]::EscapeDataString($normalizedName)
    $basePath = "https://upload.wikimedia.org/wikipedia/commons/$($hash.Substring(0, 1))/$($hash.Substring(0, 2))/$encodedName"
    $uri = if ($Width -gt 0) {
        "https://commons.wikimedia.org/w/thumb.php?f=$encodedName&width=$Width"
    } else {
        $basePath
    }

    Write-Output "Downloading $FileName"
    & curl.exe `
        --fail `
        --silent `
        --show-error `
        --location `
        --retry 12 `
        --retry-all-errors `
        --retry-delay 10 `
        --retry-max-time 600 `
        --connect-timeout 30 `
        --max-time 180 `
        --user-agent $userAgent `
        --output $Destination `
        $uri
    if ($LASTEXITCODE -ne 0) {
        if (Test-Path -LiteralPath $Destination) {
            Remove-Item -LiteralPath $Destination -Force
        }
        throw "Failed to download $FileName (curl exit code $LASTEXITCODE)."
    }
    Start-Sleep -Milliseconds 750
}

function Assert-Deck {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Directory,
        [Parameter(Mandatory = $true)]
        [string[]]$Extensions
    )

    $faces = @(
        Get-ChildItem -LiteralPath $Directory -File |
            Where-Object {
                $_.BaseName -ne 'card-back' -and
                $Extensions -contains $_.Extension.TrimStart('.').ToLowerInvariant()
            }
    )
    if ($faces.Count -ne 78) {
        throw "Expected 78 card faces in $Directory; found $($faces.Count)."
    }
    if (-not (Test-Path -LiteralPath (Join-Path $Directory 'card-back.jpg')) -and
        -not (Test-Path -LiteralPath (Join-Path $Directory 'card-back.png'))) {
        throw "Missing card back in $Directory."
    }
}

$arnoultDirectory = Join-Path $projectRoot 'assets\decks\arnoult'
$arnoultSuitCodes = @{
    wands = 'B'
    cups = 'C'
    swords = 'S'
    pentacles = 'P'
}
$arnoultRankCodes = @{
    ace = '1'
    two = '2'
    three = '3'
    four = '4'
    five = '5'
    six = '6'
    seven = '7'
    eight = '8'
    nine = '9'
    ten = '10'
    page = 'J'
    knight = 'H'
    queen = 'Q'
    king = 'K'
}

for ($number = 0; $number -le 21; $number += 1) {
    $sourceNumber = Get-AppMajorSourceNumber -Number $number
    $sourceName = if ($sourceNumber -eq 0) {
        'TT Tarot.png'
    } else {
        "T$sourceNumber Tarot.png"
    }
    Save-CommonsFile -FileName $sourceName `
        -Destination (Join-Path $arnoultDirectory "major-$number.png")
}

foreach ($suit in $suits) {
    foreach ($rank in $ranks) {
        $sourceName = "$($arnoultRankCodes[$rank])$($arnoultSuitCodes[$suit]) Tarot.png"
        Save-CommonsFile -FileName $sourceName `
            -Destination (Join-Path $arnoultDirectory "$suit-$rank.png")
    }
}

Save-CommonsFile `
    -FileName 'Jeu de tarot miniature, dit "tarot Arnoult" - jeu de cartes, dessin - btv1b10510965g (002 of 156).jpg' `
    -Destination (Join-Path $arnoultDirectory 'card-back.jpg')

$swissDirectory = Join-Path $projectRoot 'assets\decks\swiss-1jj'
$swissMajors = @{
    0 = 'Troccas-0-der-narr.jpg'
    1 = 'Swiss Tarrot trump card I, The Magician (1JJ).jpg'
    2 = 'Swiss Tarrot trump card II, Junon (1JJ).jpg'
    3 = 'Swiss Tarrot trump card III, The Empress (1JJ).jpg'
    4 = '1JJ Tarot - Trump 04 - German - Der Herrscher.jpg'
    5 = 'Tarot 1JJ - Jupiter.png'
    6 = 'Swiss Tarrot trump card VI, The Lovers (1JJ).jpg'
    7 = '1JJ Tarot - Trump 07 - English - The Chariot.jpg'
    8 = '1JJ Tarot - Trump 11 - French - La Force.jpg'
    9 = 'Swiss Tarrot trump card VIIII, The Hermit (1JJ).jpg'
    10 = 'Swiss Tarrot trump card X, Wheel of Fortune (1JJ).jpg'
    11 = 'Swiss Tarrot trump card VIII, Justice (1JJ).jpg'
    12 = 'Swiss Tarrot trump card XII, The Hanged Man (1JJ).jpg'
    13 = 'Troccas-13-der-tod.jpg'
    14 = '1JJ Tarot - Trump 14 - English - Temperance.jpg'
    15 = '1JJ Tarot - Trump 15 - German - Der Teufel.jpg'
    16 = '1JJ Tarot - Trump 16 - French - La Maison de Dieu.jpg'
    17 = 'Swiss Tarrot trump card XVII, The Star (1JJ).jpg'
    18 = 'Swiss Tarrot trump card XVIII, The Moon (1JJ).jpg'
    19 = 'Swiss Tarrot trump card XVIIII, The Sun (1JJ).jpg'
    20 = 'Swiss Tarrot trump card XX, Judgement (1JJ).jpg'
    21 = '1JJ Tarot - Trump 21 - French - Le Monde.jpg'
}

for ($number = 0; $number -le 21; $number += 1) {
    $extension = if ($number -eq 5) { 'png' } else { 'jpg' }
    Save-CommonsFile -FileName $swissMajors[$number] `
        -Destination (Join-Path $swissDirectory "major-$number.$extension")
}

foreach ($suit in $suits) {
    foreach ($rank in $ranks) {
        $sourceName = "Swiss Tarot, $rank of $suit (1JJ;Troccas).jpg"
        Save-CommonsFile -FileName $sourceName `
            -Destination (Join-Path $swissDirectory "$suit-$rank.jpg")
    }
}

$piedmontDirectory = Join-Path $projectRoot 'assets\decks\piedmont'
$piedmontMajorNames = @(
    'The Fool', 'The Magician', 'The Popess', 'The Empress', 'The Emperor',
    'The Pope', 'The Lovers', 'The Chariot', 'Justice', 'The Hermit',
    'Wheel of Fortune', 'Strength', 'The Hanged Man', 'Death', 'Temperance',
    'The Devil', 'The Tower', 'The Stars', 'The Moon', 'The Sun',
    'Judgement', 'The World'
)
$piedmontSuitNames = @{
    wands = 'Batons'
    cups = 'Cups'
    swords = 'Swords'
    pentacles = 'Coins'
}
$piedmontRankNames = @{
    ace = 'Ace'
    two = '2'
    three = '3'
    four = '4'
    five = '5'
    six = '6'
    seven = '7'
    eight = '8'
    nine = '9'
    ten = '10'
    page = 'Jack'
    knight = 'Knight'
    queen = 'Queen'
    king = 'King'
}

for ($number = 0; $number -le 21; $number += 1) {
    $sourceNumber = Get-AppMajorSourceNumber -Number $number
    $sourceName = 'Piedmontese tarot deck - Solesio - 1865 - Trump - {0:D2} - {1}.jpg' -f (
        $sourceNumber,
        $piedmontMajorNames[$sourceNumber]
    )
    Save-CommonsFile -FileName $sourceName `
        -Destination (Join-Path $piedmontDirectory "major-$number.jpg")
}

foreach ($suit in $suits) {
    foreach ($rank in $ranks) {
        $sourceName = "Piedmontese tarot deck - Solesio - 1865 - $($piedmontRankNames[$rank]) of $($piedmontSuitNames[$suit]).jpg"
        Save-CommonsFile -FileName $sourceName `
            -Destination (Join-Path $piedmontDirectory "$suit-$rank.jpg")
    }
}

Save-CommonsFile `
    -FileName 'Piedmontese tarot deck - Solesio - 1865 - Back side.jpg' `
    -Destination (Join-Path $piedmontDirectory 'card-back.jpg')

$rwsDirectory = Join-Path $projectRoot 'assets\rws'
Save-CommonsFile `
    -FileName 'Waite–Smith Tarot Roses and Lilies cropped.jpg' `
    -Destination (Join-Path $rwsDirectory 'card-back-rws.jpg')

Assert-Deck -Directory $arnoultDirectory -Extensions @('png')
Assert-Deck -Directory $swissDirectory -Extensions @('jpg', 'png')
Assert-Deck -Directory $piedmontDirectory -Extensions @('jpg')

Write-Output 'Prepared three complete historical tarot decks.'
