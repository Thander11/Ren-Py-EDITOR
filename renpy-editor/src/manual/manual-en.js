// Ren'Py EDITOR — User manual (English; shown for every language except Spanish)
(window.MANUALS = window.MANUALS || {}).en = {
  title: 'Ren\'Py EDITOR manual',
  search: 'Search the manual',
  contents: 'Contents',
  noResults: 'No section contains that text.',
  html: `
<section id="intro">
  <h2>Welcome</h2>
  <p>Ren'Py EDITOR is a visual editor for making visual novels with <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a>. Instead of writing all the code by hand, you build each scene out of <strong>blocks</strong> (dialogue, background changes, characters coming and going, choices…) and the editor writes the Ren'Py code for you. The code is always there if you want to see it, and you can edit it directly.</p>
  <p>The editor works on your Ren'Py project's own files: what you save here is a normal project that you can also open with the Ren'Py launcher or any text editor.</p>
  <div class="man-note"><strong>Code words.</strong> Names that come from Ren'Py code (<code>label</code>, <code>jump</code>, <code>call</code>, <code>Solid</code>…) stay the same in every language, so they match what you see in the code.</div>
</section>

<section id="start">
  <h2>Getting started</h2>
  <h3>What you need</h3>
  <p>To <strong>test the game</strong>, <strong>create new projects</strong> and <strong>build</strong>, you need Ren'Py (the SDK) on your computer. If the editor can't find it, it offers three options:</p>
  <ul>
    <li><strong>Download and install automatically:</strong> downloads the latest version from renpy.org (about 160 MB), checks that the file isn't damaged and installs it in the folder you choose.</li>
    <li><strong>Go to the Ren'Py website</strong> to download it yourself.</li>
    <li><strong>I already have it: select renpy.exe:</strong> you pick the <code>renpy.exe</code> file of your installation.</li>
  </ul>
  <p>You can change it any time in <a href="#settings">Settings</a> → Ren'Py → <em>Change or install</em>.</p>
  <h3>The main screen</h3>
  <ul>
    <li><strong>Sidebar (left):</strong> the editor's sections (<em>Map, Scenes, Declarations, Main menu, Game interface</em>), the project actions (<em>Open project folder, New project, Game settings, Build game</em>) and, at the bottom, <em>Launch game</em>, this <em>Manual</em> and the editor's <em>Settings</em>. The open project's folder appears underneath.</li>
    <li><strong>Header:</strong> the active <code>.rpy</code> file, the <em>Target label</em>, the <em>Show</em> menu to choose which panels to see, <em>Clear all</em> and <em>Save to file</em>.</li>
    <li><strong>Work area:</strong> the file list, the block palette, the scene's block list, the scene preview and the code preview.</li>
  </ul>
  <div class="man-tip"><strong>Tip:</strong> press <kbd>F1</kbd> at any time to open this manual.</div>
</section>

<section id="projects">
  <h2>Projects</h2>
  <h3>Opening a project</h3>
  <p>Click <strong>Open project folder</strong> and choose your game's folder (the one containing the <code>game</code> folder) or the <code>game</code> folder itself. The editor remembers the last project and opens it automatically next time.</p>
  <p>When it opens a project, the editor creates what it needs if it's missing: the folders <code>audio</code>, <code>images/characters</code>, <code>images/backgrounds</code>, <code>images/scenes</code> and <code>images/expressions</code>, and the files where it keeps declarations (<code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code>, <code>animations.rpy</code>, <code>positions.rpy</code> and <code>audio.rpy</code>). It doesn't touch your other files.</p>
  <p>If you have images declared in folders with other names, the editor asks whether to move them to the English folders and update the paths in the <code>.rpy</code> files. You can say no.</p>
  <h3>Creating a new project</h3>
  <p>Click <strong>New project</strong>, type a name, choose the <strong>resolution</strong> (1920×1080 is a good middle ground) and the game's <strong>interface colors</strong>. The project is created with Ren'Py in your <em>projects folder</em> (if you haven't set one, the editor asks for it) and opens automatically.</p>
  <h3>Changes made outside the editor</h3>
  <p>If you edit a <code>.rpy</code> file with another program (or Claude changes it, see <a href="#claude">Connection with Claude</a>), the editor notices and reloads the project's data.</p>
</section>

<section id="declarations">
  <h2>Declarations: characters, images and more</h2>
  <p>The <strong>Declarations</strong> window holds everything the story uses: characters, their images, backgrounds… What you add here then appears in the blocks' pickers. It has these tabs:</p>
  <ul>
    <li><strong>Characters:</strong> each character has a <em>non-visible name</em> (the one used in the code, letters only), the <em>visible name in the story</em>, the name's color and the tag of their expressions.</li>
    <li><strong>Sprites:</strong> each character's images, organized by type (for example, an outfit). They are named <code>character_type_id</code> (e.g. <code>Ryu_hunter_1</code>). You can add single images or <em>Import folder</em> to add many at once.</li>
    <li><strong>Expressions:</strong> the side images that go with dialogue.</li>
    <li><strong>Backgrounds</strong> and <strong>Scenes:</strong> the backgrounds of each place and the illustrations (CGs) of specific moments.</li>
    <li><strong>Animations</strong> and <strong>Positions:</strong> the <code>transform</code>s and positions you can use when showing characters.</li>
  </ul>
  <p>When you delete something, the editor asks whether to delete the image file too or keep it.</p>
</section>

<section id="scenes">
  <h2>Scenes: the block editor</h2>
  <p>This is the main section. A scene is a Ren'Py <code>label</code>, and its content is a list of blocks.</p>
  <h3>Files and target label</h3>
  <ul>
    <li>In the <strong>Files</strong> panel you choose the active <code>.rpy</code> file. <strong>+</strong> creates a new file.</li>
    <li>In <strong>Target label</strong> you choose which label to edit: the editor loads its blocks. If you choose <em>— End of file —</em>, what you save is added at the end of the file as something new.</li>
  </ul>
  <h3>Adding and arranging blocks</h3>
  <p>The <strong>Add block</strong> palette groups blocks by color: <em>Text, Scene, Flow, Audio, Advanced</em> (and <em>Patch</em> if you turned it on). Clicking one opens its form; the new block goes <strong>below the selected block</strong>.</p>
  <p>Click a block to select it: its actions appear (<em>Edit, Duplicate below, Duplicate to end, Move up, Move down, Delete</em>) and the preview shows the scene at that moment. Double-click to edit it. You can also drag blocks to reorder them.</p>
  <table>
    <tr><th>Key</th><th>Action</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Select the previous or next block</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>Move the block up or down</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>Edit the block</td></tr>
    <tr><td><kbd>Delete</kbd></td><td>Delete the block (asks first)</td></tr>
  </table>
  <h3>Saving</h3>
  <p><strong>Save to file</strong> writes the blocks to the active file: if there is a target label, it <strong>replaces all its content</strong> (it asks first); otherwise it adds them at the end. <strong>Clear all</strong> empties the block list without touching the file.</p>
  <p>If you have unsaved changes and switch label or file, the editor warns you before discarding them.</p>
  <h3>Panels</h3>
  <p>With <strong>Show</strong> you choose which panels to see: <em>Files, Blocks, Preview</em> and <em>Code</em>. You can resize panels by dragging their edges; double-clicking an edge restores its initial size. The editor remembers your layout.</p>
</section>

<section id="blocks">
  <h2>Block types</h2>
  <h3>Text</h3>
  <ul>
    <li><strong>Dialogue:</strong> what a character says. You can choose a side <em>expression</em> for that moment and mark it as a <em>thought</em> (shown in italics between &lt;&lt; &gt;&gt;).</li>
    <li><strong>Narration:</strong> the narrator's text, with no name.</li>
  </ul>
  <h3>Scene</h3>
  <ul>
    <li><strong>Scene change:</strong> shows a background or an illustration (<code>scene</code>) and removes every character. You can add a transition (<code>with</code>) and blur the image.</li>
    <li><strong>Show sprite:</strong> makes a character appear (<code>show</code>). You choose the image, the position or animation (<code>at</code>), the transition, whether it goes behind another image (<code>behind</code>), and whether it's flipped (<code>xflip</code>) or blurred.</li>
    <li><strong>Show multiple:</strong> several characters at once, with one shared transition.</li>
    <li><strong>Hide sprite</strong> and <strong>Hide multiple:</strong> remove characters from the screen (<code>hide</code>). The editor suggests the ones on screen according to the previous blocks.</li>
    <li><strong>Solid:</strong> a layer of solid color (for example, a fade to black or a tint), with its opacity.</li>
  </ul>
  <h3>Flow</h3>
  <ul>
    <li><strong>Decision:</strong> a menu of options (<code>menu</code>). Each option can jump to a label (<code>jump</code>), call it (<code>call</code>), run code or hold its own blocks. You can show a character next to the options and place them on the left like a thought bubble.</li>
    <li><strong>Condition:</strong> blocks that only run when a condition is met (<code>if</code>), with optional <code>elif</code> and <code>else</code>. Example: <code>friendship &gt;= 3 and not confessed</code>.</li>
    <li><strong>Jump:</strong> goes to another label and doesn't come back.</li>
    <li><strong>Call:</strong> goes to another label and, when it ends with <code>return</code>, comes back here. Useful for parts repeated in several places.</li>
    <li><strong>Label:</strong> creates a new label, right after or at the end of the file.</li>
    <li><strong>Pause:</strong> waits a few seconds or, if left empty, until the player clicks.</li>
  </ul>
  <h3>Audio</h3>
  <ul>
    <li><strong>Music:</strong> play (<code>play</code>), queue (<code>queue</code>) or stop (<code>stop</code>) the music, looping or not. You can listen to the files in <code>game/audio</code> before choosing.</li>
  </ul>
  <h3>Advanced</h3>
  <ul>
    <li><strong>Comment:</strong> a note for yourself that doesn't appear in the game.</li>
    <li><strong>Custom code:</strong> any Ren'Py code that has no block of its own.</li>
  </ul>
  <h3>Blocks inside blocks</h3>
  <p>The options of a <em>Decision</em> and the branches of a <em>Condition</em> can hold other blocks. Their form has a row of buttons to add them and a list where you edit, reorder or delete them.</p>
</section>

<section id="preview">
  <h2>Scene preview and code preview</h2>
  <h3>Scene preview</h3>
  <p>Shows how the scene looks at the selected block: background, characters in their positions, the dialogue box with name and text, or a choice's options. It uses the resolution, colors, fonts and sizes of your <code>gui.rpy</code>, so it looks very much like the game. It doesn't play transitions or animations.</p>
  <p>Drag its bottom edge to make it taller or shorter.</p>
  <h3>Code preview</h3>
  <p>Shows the Ren'Py code your blocks produce. You can <strong>edit it directly</strong>: the blocks follow what you type. <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes and <kbd>Ctrl</kbd>+<kbd>Y</kbd> redoes. <em>Copy code</em> copies it to the clipboard and <em>Export</em> saves it to a separate file.</p>
  <div class="man-tip"><strong>Spell checker:</strong> if you turn it on in Settings, typos in the story's texts are underlined. Right-click a word to see suggestions or add it to the dictionary.</div>
</section>

<section id="map">
  <h2>Story map</h2>
  <p>The <strong>Map</strong> shows every scene (label) as connected cards, so you can see at a glance how the story moves on and where each choice leads.</p>
  <ul>
    <li>Each card shows the label's name, a thumbnail of its background, a summary (its first line, or the comment written after <code>label name:</code>), how many characters and choices it has, and its size.</li>
    <li>Lines show <strong>Jump</strong> (solid), <strong>Call</strong> (dashed) and <strong>Choice</strong>, with the option's text and its condition, if any.</li>
    <li>Badges: <strong>START</strong> (the <code>start</code> label), <strong>ENDING</strong> (ends the game), <strong>MISSING</strong> (something jumps to a label you haven't written yet) and <strong>UNREACHABLE</strong> (nothing leads to that scene). Scenes with patch content carry a <em>patch</em> mark.</li>
    <li>Labels with parameters (helper routines) aren't shown, so the map doesn't get crowded.</li>
  </ul>
  <h3>Moving around</h3>
  <p>Drag to move and use the mouse wheel (or the <em>Zoom in, Zoom out</em> and <em>Fit</em> buttons) to zoom.</p>
  <h3>Side panel</h3>
  <ul>
    <li><strong>Scene:</strong> click a card to see its file, which scenes it leads to and which lead to it, its characters and its choices with what each option does. <em>Open for editing</em> loads it in the scenes editor.</li>
    <li><strong>Variables:</strong> the story's variables, their initial value, where they change and where they are checked. Clicking one highlights those scenes on the map. If a variable has no initial value, the editor recommends adding a <code>default</code>.</li>
  </ul>
</section>

<section id="main-menu">
  <h2>Main menu</h2>
  <p>Design the game's main menu without writing code. Turn on <strong>Use custom menu</strong> and adjust:</p>
  <ul>
    <li><strong>Background:</strong> the project's original one, a color, an image, an animated GIF (the editor extracts its frames, since Ren'Py doesn't play GIFs) or a video (WebM recommended).</li>
    <li><strong>Top layer:</strong> the dark side panel of the original menu and a darkening of the background.</li>
    <li><strong>Title</strong> and <strong>version:</strong> text, size, font, color, outline and position.</li>
    <li><strong>Buttons:</strong> which ones are shown (Start, Load, Preferences, About, Help, Quit), vertical or horizontal layout, alignment, spacing, colors and background. Each button can be text, an image, or text over a background image, and can have its <em>own position</em>.</li>
    <li>The menu's <strong>music</strong>, from the <code>game/audio</code> folder.</li>
  </ul>
  <p>In the preview you can <strong>drag</strong> the title and buttons into place. <em>Save</em> writes it to the project, <em>Test in Ren'Py</em> opens the game, <em>Reset</em> goes back to the initial values and <em>Discard changes</em> drops what you haven't saved.</p>
  <h3>Fonts</h3>
  <p>Fonts are copied into the game, so only those with a <strong>free license</strong> that allows distributing them are offered. Most system fonts (Arial, Calibri…) don't allow it. Use <em>Free fonts (Google Fonts)</em> to get more.</p>
</section>

<section id="gui">
  <h2>Game interface</h2>
  <p>Change the look of the game's interface (what <code>gui.rpy</code> defines) and see the result at once. The preview has three tabs: <strong>Dialogue</strong>, <strong>Choice</strong> and <strong>Game menu</strong>; the settings on the left follow the tab.</p>
  <ul>
    <li><strong>General text:</strong> fonts and sizes of dialogue, names and menus; colors; accent color; <em>text speed</em> (letters per second; 0 = all at once).</li>
    <li><strong>Dialogue box</strong> and <strong>Character name:</strong> height, position and width of the text, alignment and the name box.</li>
    <li><strong>Choice buttons</strong> and <strong>Game menus:</strong> sizes, idle, hover and selected colors, and backgrounds.</li>
  </ul>
  <p>For each image (dialogue box, name box, buttons, menu background) you choose between <strong>Current</strong> (the one the project already has), <strong>My image</strong> or <strong>Color and shape</strong> (the editor draws it with the color, opacity, rounded corners and margin you choose). Before replacing an image for the first time, it keeps the original in <code>gui/editor_backup</code>.</p>
  <p>In the preview you can <strong>drag</strong> the dialogue box, the name and the buttons to move and resize them.</p>
  <h3>Google Fonts</h3>
  <p><em>Google Fonts…</em> opens a catalog of fonts under the SIL Open Font License, which you can use and distribute with your game. Adding one downloads it into the project's <code>fonts</code> folder with its license. You can also add a font from a file.</p>
  <p><em>Save</em> writes only the values you changed; <em>Discard changes</em> drops what you haven't saved.</p>
</section>

<section id="game-settings">
  <h2>Game settings</h2>
  <h3>General</h3>
  <ul>
    <li><strong>Game name</strong> and <strong>Version</strong> (<code>config.name</code> and <code>config.version</code>).</li>
    <li><strong>File name</strong> (<code>build.name</code>): no spaces or accents; used for the files the build creates. It follows the game's name until you change it by hand.</li>
    <li><strong>Game icon:</strong> choose an image (preferably square, 512×512 or larger) and the editor creates the window icon and the Windows (<code>icon.ico</code>) and Mac (<code>icon.icns</code>) icons.</li>
  </ul>
  <p>The saved games folder doesn't change when the name does, so players don't lose their saves when the game is updated.</p>
  <h3>Patch</h3>
  <p>See <a href="#patch">Patches</a>.</p>
</section>

<section id="build">
  <h2>Building the game</h2>
  <p><strong>Build game</strong> creates the files other people can download and play without having Ren'Py. Choose the systems:</p>
  <ul>
    <li><strong>Windows</strong> (.zip), <strong>Linux</strong> (.tar.bz2) and <strong>Mac</strong> (app compressed in a .zip).</li>
    <li><strong>Windows and Linux together:</strong> a single .zip for both.</li>
    <li><strong>For stores (itch.io, Steam…):</strong> a .zip with all three systems, ready to upload to a store.</li>
  </ul>
  <p>Choose the destination folder and click <em>Build</em>. You'll see the progress; you can hide the dialog meanwhile (it tells you when it's done) or stop it. When it finishes, <em>Open folder</em> takes you to the files.</p>
  <p>If your novel has a patch, this is also where you choose which version to build (see <a href="#patch">Patches</a>).</p>
  <h3>Testing the game</h3>
  <p><strong>Launch game</strong>, in the sidebar, opens your novel with Ren'Py as it is saved. If there are errors in the code, Ren'Py shows them when it starts.</p>
</section>

<section id="patch">
  <h2>Patches</h2>
  <p>Some novels are published on stores like Steam without part of their content, and the author offers that content on their website as a <strong>patch</strong> that players add to the game. The editor prepares all of it for you.</p>
  <h3>1. Turning the patch on</h3>
  <p>In <strong>Game settings → Patch</strong>, turn on <em>This novel has a patch</em>, give it a name and write the instructions for players (they go inside the patch as a text file). On the right you see what the patch has and any possible problems.</p>
  <h3>2. Marking the patch content</h3>
  <ul>
    <li><strong>"Patch content" block</strong> (<em>Patch</em> group of the palette). It has two parts:
      <ul>
        <li><strong>With the patch:</strong> the blocks only players with the patch see. They are kept apart, in <code>game/patch/</code>.</li>
        <li><strong>Without the patch:</strong> what players without it see (for example, on Steam). It can stay empty: then the story just goes on.</li>
      </ul>
      To save patch content, the scene needs a <em>Target label</em>.</li>
    <li><strong>Images:</strong> with <em>Choose patch images…</em> you mark the ones that only go in the patch. The editor moves them to <code>images/patch/</code> along with their declaration. Unchecking them puts them back in the game.</li>
  </ul>
  <p>The scene preview shows a <strong>Without the patch / With the patch</strong> switch to see both versions, and on the map scenes with patch content carry their mark.</p>
  <h3>3. Building</h3>
  <p>In <strong>Build game</strong> you choose:</p>
  <ul>
    <li><strong>Game without the patch + separate patch:</strong> for Steam. The game comes without the patch content (not even locked) and the patch in a separate .zip, with its content packed and no readable code, plus the instructions.</li>
    <li><strong>Full version:</strong> everything in one game, for your website or itch.io.</li>
    <li><strong>Only the game without the patch:</strong> to upload an update when the patch hasn't changed.</li>
  </ul>
  <p>Before building, the editor checks that nothing in the game depends on the patch: for example, a patch image also used in a normal scene, or a jump to a scene that only exists in the patch.</p>
  <h3>For players</h3>
  <p>Installing the patch means unzipping the .zip inside the game folder (where the executable is). The game detects it by itself. On Mac the game folder is inside the app; if you publish for Mac, explain it in the instructions.</p>
  <div class="man-note"><strong>Store rules:</strong> before publishing on Steam or another store, check its rules about content added outside the store.</div>
</section>

<section id="settings">
  <h2>Editor settings</h2>
  <ul>
    <li><strong>Theme:</strong> <em>Dark, Light, OLED</em> or <em>Custom</em>. With the custom one, <em>Edit colors</em> opens an editor where you choose the colors of the interface and the code; changes show at once. <em>Reset colors</em> goes back to the initial ones and <em>Cancel</em> drops the changes.</li>
    <li><strong>Language:</strong> Spanish, English, German, French, Italian, Portuguese, Russian, Simplified Chinese, Traditional Chinese and Japanese.</li>
    <li><strong>Spell checker:</strong> the languages the story's texts are checked in.</li>
    <li><strong>Ren'Py:</strong> which installation is used, and the button to change it or install another one.</li>
    <li><strong>Projects folder:</strong> where new projects are created.</li>
    <li><strong>Connection with Claude:</strong> see the next section.</li>
  </ul>
</section>

<section id="claude">
  <h2>Connection with Claude</h2>
  <p>If you use <strong>Claude Code</strong> or <strong>Claude Desktop</strong>, you can connect it to the editor and ask it things about your novel in your own words: "which choices are there on day 2?", "show me how the start of this scene looks", "add a new option to this choice"… It works with your own Claude account, while the editor is open.</p>
  <h3>Turning it on</h3>
  <ol>
    <li>In <strong>Settings → Connection with Claude</strong>, check <em>Turn on connection</em>. It's off by default.</li>
    <li><strong>Claude Code:</strong> click <em>Copy command</em> and run it once in a terminal.</li>
    <li><strong>Claude Desktop:</strong> click <em>Add to Claude Desktop</em> (the editor first keeps a copy of its configuration) and restart Claude Desktop.</li>
  </ol>
  <p>The status shows whether Claude is connected and how many requests it has made. The connection only accepts programs on your own computer that have the key. <em>New key</em> invalidates the old one (you'll need to run the Claude Code command again) and <em>Port</em> lets you change it if another program uses the same one.</p>
  <h3>What Claude can do</h3>
  <ul>
    <li><strong>Look up:</strong> the project, the story map, the code of any label or file, characters, images and audio, variables, interface settings and a check for problems (jumps to labels that don't exist, missing images or audio…).</li>
    <li><strong>Change:</strong> write or edit labels and files, add characters, backgrounds, illustrations and variables, and change the interface or the game's name and version.</li>
    <li><strong>See and show:</strong> get a picture of any moment of a scene, open a label in the editor or on the map, and launch the game.</li>
  </ul>
  <h3>Claude's changes and undo</h3>
  <p>Before every change, the editor keeps a copy of the affected files and logs it in <strong>Claude's changes</strong> (in the same Settings section). From there you can <strong>undo</strong> any change; if the file was edited afterwards, it warns you first. A notice appears every time Claude changes something, and if it changes the label you have open, the editor reloads it (or asks which version you want if you had unsaved changes).</p>
</section>

<section id="files">
  <h2>Files the editor creates</h2>
  <table>
    <tr><th>File or folder</th><th>What it's for</th></tr>
    <tr><td><code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code></td><td>Declarations of characters and images</td></tr>
    <tr><td><code>animations.rpy</code>, <code>positions.rpy</code>, <code>audio.rpy</code></td><td>Animations, positions and audio</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> and its <code>.rpy</code></td><td>The custom main menu</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>The interface's original images before you changed them</td></tr>
    <tr><td><code>fonts/</code></td><td>The fonts you add, with their license</td></tr>
    <tr><td><code>patch_support.rpy</code>, <code>patch/</code>, <code>images/patch/</code></td><td>The patch (if you turn it on)</td></tr>
    <tr><td><code>.renpy-editor/</code> (next to <code>game</code>)</td><td>Patch settings and the copies of Claude's changes. Not included in the game.</td></tr>
  </table>
</section>

<section id="report">
  <h2>Reporting a problem or suggesting something</h2>
  <p>If something doesn't work or you miss something, click <strong>Report or suggest</strong> in the sidebar. Your message goes straight to the editor's author.</p>
  <ul>
    <li>Choose whether it's <strong>a problem</strong> or <strong>a suggestion</strong>, give it a title and explain it in detail. For a problem, it helps a lot to say what you were doing, what you expected and what happened.</li>
    <li><strong>Your email</strong> is optional: it's only there so you can be answered.</li>
    <li><strong>Attach technical details</strong> adds the editor's version, the system and the language. Before sending you see exactly what's included; your novel and your files are never sent.</li>
    <li><strong>By email or on GitHub?</strong> By email it goes straight to the author and you need no account. If you prefer GitHub, choose <em>On GitHub</em>: a public issue opens in your browser already filled in, and you publish it with your account.</li>
  </ul>
  <p>If there's no connection, you can <em>Copy the message</em> to send it another way.</p>
</section>

<section id="troubleshooting">
  <h2>Troubleshooting</h2>
  <dl>
    <dt>"Ren'Py is required" or the game doesn't launch</dt>
    <dd>Check in Settings → Ren'Py that the path points to your <code>renpy.exe</code>, or use <em>Change or install</em>.</dd>
    <dt>A character or background doesn't appear in the pickers</dt>
    <dd>It has to be declared in the <a href="#declarations">Declarations</a> window (or in the editor's declaration files).</dd>
    <dt>The preview shows a box with an image's name</dt>
    <dd>That image isn't declared or its file doesn't exist. The map and Claude's check also help you find these cases.</dd>
    <dt>I can't find an installed font</dt>
    <dd>Only fonts with a free license are shown, because they are copied into the game. Look for a similar one in Google Fonts.</dd>
    <dt>I lost changes to a label</dt>
    <dd>Save to file replaces the target label's content. If the change was made by Claude, you can undo it in <em>Claude's changes</em>.</dd>
  </dl>
</section>
`
};
