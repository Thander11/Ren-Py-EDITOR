# Ren-Py-EDITOR
Visual editor for Ren'Py that lets you create visual novels without coding. Manage assets like characters, sprites, and backgrounds using draggable blocks. Automatically generates clean code with real-time preview.

## Features

- **Block builder**: write scenes with blocks (narration, dialogue, show/hide sprites, scene changes, choices, conditions, music, jumps, calls…) and see the generated Ren'Py code in real time.
- **Declarations**: manage characters, sprites, side expressions, backgrounds, scenes, animations and positions from their own window.
- **Main menu editor**: customize the game's main menu visually (see below).
- **Projects**: create new Ren'Py projects from the editor, or open existing ones. The files and folders the editor needs are created automatically.
- **Ren'Py SDK**: detected automatically, or downloaded and installed for you.
- **10 languages** (English, Spanish, German, French, Italian, Brazilian Portuguese, Russian, Simplified Chinese, Traditional Chinese, Japanese) and light/dark themes.

## Main menu editor

Open it with the **Main menu** button. It shows a live preview of the menu at the game's resolution, and **Test in Ren'Py** saves and launches the game.

- **Background**: the project's original one, a solid color, an image, an animated GIF or a looping video. Ren'Py doesn't play GIFs, so the editor extracts their frames and builds an equivalent animation.
- **Top layer**: show or hide the original dark side panel, and darken the background with any color and opacity.
- **Title**: custom text (or the game name), size, color, font, outline, position, and the game version.
- **Buttons**:
  - Show, hide, rename and reorder Start, Load, Preferences, About, Help and Quit.
  - Place them in a column or a row anywhere on the screen, with their size, spacing, colors, font and outline.
  - Button backgrounds can be a color or an image, for all the buttons or for a single one. Images can keep their own size (text centered on them) or stretch to fit the text while keeping their decorated borders.
  - Each button can also be an image (with an optional hover image and scale).
  - Each button can have its own position, independent from the rest.
- **Music**: menu music from the `game/audio` folder.
- **Positioning**: drag the title and the buttons in the preview, use the 9 quick positions or the sliders.

### Fonts

You can pick fonts installed on your computer or a font file. Fonts are copied into the game, so **only installed fonts whose license allows distributing them are listed** (SIL Open Font License, Apache, MIT, public domain…), based on the license stated in each font's data. Most fonts that come with the operating system (Arial, Calibri, Segoe UI…) don't allow it, so they aren't listed. The editor links to Google Fonts to get free alternatives. Font files with no free license stated ask for confirmation before being used.

### Generated files

- `game/main_menu_custom.rpy` replaces the `main_menu` screen of `screens.rpy` without modifying it (`init offset = 1`). Untick **Use custom menu** to go back to the original menu. The menu settings are stored in the first line of this file.
- `game/gui/main_menu_custom/` holds the backgrounds, fonts and button images copied into the project. Files that are no longer used are deleted when saving.

Both are created, with the custom menu disabled, when a project is opened or created, so the game keeps its original menu until a custom one is saved. Manual changes to `main_menu_custom.rpy` are overwritten when the menu is saved from the editor.

## Running the editor

Requires [Node.js](https://nodejs.org/).

```
cd renpy-editor
npm install
npm start
```

On Windows you can also run `renpy-editor/start.bat`.
