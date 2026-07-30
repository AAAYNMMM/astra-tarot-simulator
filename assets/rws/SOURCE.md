# Rider–Waite–Smith card artwork

This folder contains 78 local JPG card faces from LuciellaES's
**Rider-Waite Smith Tarot Cards (CC0)** asset pack.

- Original illustrations: Pamela Colman Smith, commissioned by Arthur Edward
  Waite and first published in 1909–1910.
- Prepared asset pack:
  <https://luciellaes.itch.io/rider-waite-smith-tarot-cards-cc0>
- The pack author describes the faces as cleaned and resized scans of the
  original Rider–Waite–Smith deck sourced from Wikipedia. Its custom
  `card-back.jpg` is released under CC0 and remains as an unused source-pack
  asset.
- `card-back-rws.jpg` is the public-domain 1909 **Roses and Lilies** back
  downloaded from Wikimedia Commons and is the matching back used in the app:
  <https://commons.wikimedia.org/wiki/File:Waite%E2%80%93Smith_Tarot_Roses_and_Lilies_cropped.jpg>
- `card-back-v2.jpg` is an original blue-and-gold back designed for this
  simulator. It is retained as an unused design archive.
- Wikimedia Commons background and licensing note:
  <https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck>
- All images are bundled locally. The simulator does not fetch card art at
  runtime.

The application renders every face and the matching back directly from these
local files. No CSS filter, tint, blend mode, or recolouring is applied.

To rebuild the filenames from a freshly downloaded `Cards-jpg.zip`, run:

```powershell
.\scripts\fetch_rws_assets.ps1 -ArchivePath 'C:\path\to\Cards-jpg.zip'
```
