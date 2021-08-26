## Changelog

### v2.29
- UI: New import/export page
- Fixed: View macro had UI issues with unknown commands

### v2.28
- Updated list of commands (v8.10.10.kt.3)
- Included list of deprecated comands

### v2.27
- Added: Show a small keyboard in the macro editor, specially useful for people who don't use the american layout. Key abbreviation names are copied to clipboard when the key is clicked (only those alternate names that appears on the bottom).
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