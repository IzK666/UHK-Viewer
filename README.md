# UHK Layer editor

A tool for copying/cloning/erasing layers for [UHK](https://github.com/UltimateHackingKeyboard/agent).

You can use it online [here](https://izk666.github.io/UHK-Viewer/), or dowload all the files and run on your computer.


## Tools

- Create new blank keymaps
- Clone and delete existing keymaps (last keymap can't be removed)
- Copy/Paste/Clear layers (Left side and right side separately). Modules only copy/paste.
- Rename keymaps (name and abbreviation)
- Create new macros
- Edit macros (Only write text)
- Clone and delete macros
- Rename macros

## Extras

- Colored macros for [Karel's firmware](https://github.com/kareltucek). Only in view mode.
- Removing or changing names of macros or keymamps modifies the calls from macros (commenting lines if they are removed)

## Notes

- Individual keys can't be assigned. Only view mode
- When a side is copied, modules are copied too (key cluster for left side and trackball for right side), although not shown
- Modules don't get cleared.

## To do
- Edit macros (Text highlight for edit)
- Show modules

## Changelog

### v2.27
- Macro Editor: Show a small keyboard in the macro editor, specially useful for people who don't use the american layout. Abbreviation key names are copied to clipboard when the key is clicked (only those alternate names that appears).
- Fixed: Color macro syntax

### v2.26
- Changed: Removed confirmation for keymap and macro deletion.
- UI: Trash button for keymap no longer disappear when you can't use it (still disabled)
- Fixed: Keymap and macro removal updates all calls from keys and macros correctly

### v2.25
- Added: Create, clone, remove and rename macros
- Added: Simple macro editor
- Macro viewer: Add new lines to macros and reorder existing ones
- Fixed: When a keymap or macro is renamed, the keys assigned to them points to the new values.

### v2.20
- Updated: New commands for Karel's macros

### v2.15
- Fixed: Copy layers wasn't working correctly

### v2.11
- Added: Confirmation for keymap deletion
- Fixed: Default keymap wasn't assigned correctly after removing the default one
- UI: Keymap name in red
- UI: Added some animations to buttons

### v2.1
- New: Clone and delete keymaps

### v2
- New: File format detection. The web now detects if you upload an old configuration (no modules) or the new one and exports the right format.
- UI: Copy/Paste/Clear buttons always shown
- UI: Show clipboard content (abbreviation and layer)
- Fixed: Edit abbreviations