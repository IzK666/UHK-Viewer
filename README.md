# UHK Layer editor

A tool for copying/cloning/erasing layers for [UHK](https://github.com/UltimateHackingKeyboard/agent).

You can use it online [here](https://izk666.github.io/UHK-Viewer/), or dowload all the files and run on your computer.


## Tools

- Create new blank keymaps
- Clone and delete existing keymaps (last keymap can't be removed)
- Copy/Paste/Clear layers (Left side and right side separately)
- Rename keymaps (name and abbreviation)

## Extras

- Colored macros for [Karel's firmware](https://github.com/kareltucek)

## Notes

- Individual keys can't be assigned. Only view mode
- When a side is copied, modules are copied too (key cluster for left side and trackball for right side), although not shown
- Modules don't get cleared.

## Changelog
### 26 July 2021
- Added: Confirmation for keymap deletion
- Fixed: Default keymap wasn't assigned correctly after removing the default one
- UI: Keymap name in red
- UI: Added some animations to buttons

### 24 July 2021
- New: Clone and delete keymaps

### 23 july 2021
- New: File format detection. The web now detects if you upload an old configuration (no modules) or the new one and exports the right format.
- UI: Copy/Paste/Clear buttons always shown
- UI: Show clipboard content (abbreviation and layer)
- Fixed: Edit abbreviations

## To do
- Edit macros
- Show modules