# UHK Layer editor

**DEPRECATED**
***This utility is meant to be used with old versions up to 8.10.12 (or karel's firmware equivalent)***


A tool for copying/cloning/erasing layers for [UHK](https://github.com/UltimateHackingKeyboard/agent).

You can use it online [here](https://izk666.github.io/UHK-Viewer/), or dowload all the files and run on your computer.


## Capabilities

- Create new blank keymaps
- Clone and delete existing keymaps (last keymap can't be removed)
- Copy/Paste/Clear layers (Left side and right side separately). You can copy/paste modules, but they don't get cleared.
- Rename keymaps (name and abbreviation)

- Create new macros
- Edit macros (Only write text)
- Clone and delete macros
- Rename macros

- Import keymaps and macros from other configuration files (merge).

## Extras

- Colored macros for [Karel's firmware](https://github.com/kareltucek). Only in view mode.
- Removing or changing names of macros or keymaps modifies the calls from macros (commenting lines if they are removed)

## Notes

- Individual keys can't be assigned. Only view mode
- When a side is copied, modules are copied too (key cluster for left side and trackball/touchpad/trackpoint for right side), although not shown
- Modules don't get cleared.
- Files to merge must have the same format (compatibility with modules)
- Macros and keymaps from imported files will point to keymaps and macros imported. Not the existing ones.
- **A warning will prevent you from loading or merging any incompatible file**