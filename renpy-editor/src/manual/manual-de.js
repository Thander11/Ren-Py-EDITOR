// Ren'Py EDITOR — Benutzerhandbuch (Deutsch). {{key}} = Text der Oberfläche
(window.MANUALS = window.MANUALS || {}).de = {
  title: 'Handbuch zu Ren\'Py EDITOR',
  search: 'Im Handbuch suchen',
  contents: 'Inhalt',
  noResults: 'Kein Abschnitt enthält diesen Text.',
  html: `
<section id="intro">
  <h2>Willkommen</h2>
  <p>Ren'Py EDITOR ist ein visueller Editor für Visual Novels mit <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a>. Statt den gesamten Code von Hand zu schreiben, baust du jede Szene aus <strong>Blöcken</strong> (Dialoge, Hintergrundwechsel, Figuren, die kommen und gehen, Entscheidungen…) und der Editor schreibt den Ren'Py-Code für dich. Der Code ist jederzeit sichtbar, wenn du willst, und du kannst ihn direkt bearbeiten.</p>
  <p>Der Editor arbeitet mit den Dateien deines Ren'Py-Projekts: Was du hier speicherst, ist ein normales Projekt, das du auch mit dem Ren'Py-Launcher oder einem beliebigen Texteditor öffnen kannst.</p>
  <div class="man-note"><strong>Code-Wörter.</strong> Namen aus dem Ren'Py-Code (<code>label</code>, <code>jump</code>, <code>call</code>, <code>Solid</code>…) bleiben in allen Sprachen gleich, damit sie zu dem passen, was du im Code siehst.</div>
</section>

<section id="start">
  <h2>Erste Schritte</h2>
  <h3>Was du brauchst</h3>
  <p>Um das <strong>Spiel zu testen</strong>, <strong>neue Projekte zu erstellen</strong> und es zu <strong>erstellen (bauen)</strong>, brauchst du Ren'Py (das SDK) auf deinem Computer. Findet der Editor es nicht, bietet er drei Möglichkeiten an:</p>
  <ul>
    <li><strong>{{renpy_install_auto}}:</strong> lädt die neueste Version von renpy.org herunter (etwa 160 MB), prüft, dass die Datei nicht beschädigt ist, und installiert sie in einem Ordner deiner Wahl.</li>
    <li><strong>{{renpy_go_website}}</strong>, um es selbst herunterzuladen.</li>
    <li><strong>{{renpy_select_existing}}:</strong> du wählst die Datei <code>renpy.exe</code> deiner Installation.</li>
  </ul>
  <p>Du kannst das jederzeit unter <a href="#settings">{{settings}}</a> → Ren'Py → <em>{{renpy_change_or_install}}</em> ändern.</p>
  <h3>Der Hauptbildschirm</h3>
  <ul>
    <li><strong>Seitenleiste (links):</strong> die Bereiche des Editors (<em>{{map_button}}, {{nav_scenes}}, {{declarations}}, {{main_menu_button}}, {{gui_editor_title}}</em>), die Projektaktionen (<em>{{open_project}}, {{new_project}}, {{game_settings}}, {{build_game}}</em>) und unten <em>{{launch_project}}</em>, dieses <em>{{manual}}</em> und die <em>{{settings}}</em> des Editors. Darunter steht der Ordner des geöffneten Projekts.</li>
    <li><strong>Kopfzeile:</strong> die aktive <code>.rpy</code>-Datei, das <em>{{target_label}}</em>, das Menü <em>{{panels_show}}</em> zur Auswahl der Bereiche, <em>{{clear_all}}</em> und <em>{{save_to_file}}</em>.</li>
    <li><strong>Arbeitsbereich:</strong> die Dateiliste, die Blockpalette, die Blockliste der Szene, die Szenenvorschau und die Codevorschau.</li>
  </ul>
  <div class="man-tip"><strong>Tipp:</strong> Drücke jederzeit <kbd>F1</kbd>, um dieses Handbuch zu öffnen.</div>
</section>

<section id="projects">
  <h2>Projekte</h2>
  <h3>Ein Projekt öffnen</h3>
  <p>Klicke auf <strong>{{open_project}}</strong> und wähle den Ordner deines Spiels (den, der den Ordner <code>game</code> enthält) oder direkt den Ordner <code>game</code>. Der Editor merkt sich das letzte Projekt und öffnet es beim nächsten Mal automatisch.</p>
  <p>Beim Öffnen legt der Editor an, was ihm fehlt: die Ordner <code>audio</code>, <code>images/characters</code>, <code>images/backgrounds</code>, <code>images/scenes</code> und <code>images/expressions</code> sowie die Dateien für die Deklarationen (<code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code>, <code>animations.rpy</code>, <code>positions.rpy</code> und <code>audio.rpy</code>). Deine anderen Dateien bleiben unberührt.</p>
  <p>Sind Bilder in Ordnern mit anderen Namen deklariert, fragt der Editor, ob er sie in die englischen Ordner verschieben und die Pfade in den <code>.rpy</code>-Dateien anpassen soll. Du kannst ablehnen.</p>
  <h3>Ein neues Projekt erstellen</h3>
  <p>Klicke auf <strong>{{new_project}}</strong>, gib einen Namen ein, wähle die <strong>Auflösung</strong> (1920×1080 ist ein guter Mittelweg) und die <strong>Farben der Oberfläche</strong> des Spiels. Das Projekt wird mit Ren'Py in deinem <em>{{projects_dir}}</em> erstellt (ist keiner festgelegt, fragt der Editor danach) und automatisch geöffnet.</p>
  <h3>Änderungen außerhalb des Editors</h3>
  <p>Bearbeitest du eine <code>.rpy</code>-Datei mit einem anderen Programm (oder ändert Claude sie, siehe <a href="#claude">{{claude_connection}}</a>), bemerkt der Editor das und lädt die Projektdaten neu.</p>
</section>

<section id="declarations">
  <h2>{{declarations}}: Figuren, Bilder und mehr</h2>
  <p>Das Fenster <strong>{{declarations}}</strong> enthält alles, was die Geschichte verwendet: Figuren, ihre Bilder, Hintergründe… Was du hier hinzufügst, erscheint danach in den Auswahllisten der Blöcke. Es hat diese Reiter:</p>
  <ul>
    <li><strong>{{tab_characters}}:</strong> Jede Figur hat einen <em>{{char_id}}</em> (den Namen im Code), einen <em>{{char_name}}</em>, die Farbe des Namens und die Kennung ihrer Ausdrücke.</li>
    <li><strong>{{tab_sprites}}:</strong> die Bilder jeder Figur, nach Typ geordnet (zum Beispiel ein Outfit). Sie heißen <code>figur_typ_kennung</code> (z. B. <code>Ryu_hunter_1</code>). Du kannst einzelne Bilder hinzufügen oder mit <em>{{add_batch}}</em> viele auf einmal.</li>
    <li><strong>{{tab_expressions}}:</strong> die Seitenbilder (side images), die den Dialog begleiten.</li>
    <li><strong>{{tab_backgrounds}}</strong> und <strong>{{tab_scenes}}:</strong> die Hintergründe der Orte und die Illustrationen (CGs) besonderer Momente.</li>
    <li><strong>{{tab_animations}}</strong> und <strong>{{tab_positions}}:</strong> die <code>transform</code>s und Positionen, die du beim Anzeigen von Figuren nutzen kannst.</li>
  </ul>
  <p>Beim Löschen fragt der Editor, ob auch die Bilddatei gelöscht oder behalten werden soll.</p>
</section>

<section id="scenes">
  <h2>{{nav_scenes}}: der Block-Editor</h2>
  <p>Das ist der Hauptbereich. Eine Szene ist ein Ren'Py-<code>label</code>, und ihr Inhalt ist eine Liste von Blöcken.</p>
  <h3>Dateien und Ziel-label</h3>
  <ul>
    <li>Im Bereich <strong>{{panel_files}}</strong> wählst du die aktive <code>.rpy</code>-Datei. <strong>+</strong> erstellt eine neue Datei.</li>
    <li>Unter <strong>{{target_label}}</strong> wählst du das label, das du bearbeiten willst: Der Editor lädt seine Blöcke. Wählst du <em>{{end_of_file}}</em>, wird beim Speichern etwas Neues ans Ende der Datei angefügt.</li>
  </ul>
  <h3>Blöcke hinzufügen und anordnen</h3>
  <p>Die Palette <strong>{{palette_title}}</strong> gruppiert die Blöcke nach Farben: <em>{{block_group_text}}, {{block_group_scene}}, {{block_group_flow}}, {{block_group_audio}}, {{block_group_advanced}}</em> (und <em>{{block_group_patch}}</em>, wenn du ihn aktiviert hast). Ein Klick öffnet das Formular; der neue Block kommt <strong>unter den ausgewählten Block</strong>.</p>
  <p>Klicke auf einen Block, um ihn auszuwählen: Seine Aktionen erscheinen (<em>{{btn_edit}}, {{btn_duplicate}}, {{btn_duplicate_end}}, {{btn_move_up}}, {{btn_move_down}}, {{btn_delete}}</em>) und die Vorschau zeigt die Szene in diesem Moment. Doppelklick zum Bearbeiten. Du kannst Blöcke auch ziehen, um sie neu anzuordnen.</p>
  <table>
    <tr><th>Taste</th><th>Aktion</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Vorherigen oder nächsten Block auswählen</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>Block nach oben oder unten verschieben</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>Block bearbeiten</td></tr>
    <tr><td><kbd>Entf</kbd></td><td>Block löschen (mit Rückfrage)</td></tr>
  </table>
  <h3>Speichern</h3>
  <p><strong>{{save_to_file}}</strong> schreibt die Blöcke in die aktive Datei: Gibt es ein Ziel-label, <strong>ersetzt es dessen gesamten Inhalt</strong> (nach Rückfrage); sonst wird ans Ende angefügt. <strong>{{clear_all}}</strong> leert die Blockliste, ohne die Datei zu ändern.</p>
  <p>Hast du ungespeicherte Änderungen und wechselst label oder Datei, warnt dich der Editor, bevor sie verloren gehen.</p>
  <h3>Bereiche</h3>
  <p>Mit <strong>{{panels_show}}</strong> wählst du, welche Bereiche zu sehen sind: <em>{{panel_files}}, {{panel_palette}}, {{panel_preview}}</em> und <em>{{panel_code}}</em>. Die Größe änderst du, indem du die Ränder ziehst; ein Doppelklick auf einen Rand stellt die Anfangsgröße wieder her. Der Editor merkt sich deine Aufteilung.</p>
</section>

<section id="blocks">
  <h2>Blocktypen</h2>
  <h3>{{block_group_text}}</h3>
  <ul>
    <li><strong>{{block_dialogue}}:</strong> was eine Figur sagt. Du kannst einen seitlichen <em>Ausdruck</em> für diesen Moment wählen und ihn als <em>Gedanken</em> markieren (kursiv zwischen &lt;&lt; &gt;&gt;).</li>
    <li><strong>{{block_narration}}:</strong> Text des Erzählers, ohne Namen.</li>
  </ul>
  <h3>{{block_group_scene}}</h3>
  <ul>
    <li><strong>{{block_scene}}:</strong> zeigt einen Hintergrund oder eine Illustration (<code>scene</code>) und entfernt alle Figuren. Du kannst einen Übergang (<code>with</code>) hinzufügen und das Bild unscharf machen.</li>
    <li><strong>{{block_show}}:</strong> lässt eine Figur erscheinen (<code>show</code>). Du wählst das Bild, die Position oder Animation (<code>at</code>), den Übergang, ob sie hinter einem anderen Bild steht (<code>behind</code>), gespiegelt (<code>xflip</code>) oder unscharf ist.</li>
    <li><strong>{{block_show_multi}}:</strong> mehrere Figuren gleichzeitig, mit einem gemeinsamen Übergang.</li>
    <li><strong>{{block_hide}}</strong> und <strong>{{block_hide_multi}}:</strong> entfernen Figuren vom Bildschirm (<code>hide</code>). Der Editor schlägt die vor, die laut den vorherigen Blöcken zu sehen sind.</li>
    <li><strong>{{block_solid}}:</strong> eine einfarbige Ebene (zum Beispiel ein Abblenden nach Schwarz oder eine Tönung), mit Deckkraft.</li>
  </ul>
  <h3>{{block_group_flow}}</h3>
  <ul>
    <li><strong>{{block_menu}}:</strong> ein Auswahlmenü (<code>menu</code>). Jede Option kann zu einem label springen (<code>jump</code>), es aufrufen (<code>call</code>), Code ausführen oder eigene Blöcke enthalten. Du kannst eine Figur neben den Optionen zeigen und die Optionen links wie eine Gedankenblase anordnen.</li>
    <li><strong>{{block_condition}}:</strong> Blöcke, die nur ausgeführt werden, wenn eine Bedingung erfüllt ist (<code>if</code>), mit optionalem <code>elif</code> und <code>else</code>. Beispiel: <code>freundschaft &gt;= 3 and not gestanden</code>.</li>
    <li><strong>{{block_jump}}:</strong> springt zu einem anderen label und kehrt nicht zurück.</li>
    <li><strong>{{block_call}}:</strong> geht zu einem anderen label und kehrt hierher zurück, wenn dieses mit <code>return</code> endet. Praktisch für Teile, die sich an mehreren Stellen wiederholen.</li>
    <li><strong>{{block_label}}:</strong> erstellt ein neues label, direkt danach oder am Ende der Datei.</li>
    <li><strong>{{block_pause}}:</strong> wartet einige Sekunden oder, wenn leer, bis der Spieler klickt.</li>
  </ul>
  <h3>{{block_group_audio}}</h3>
  <ul>
    <li><strong>{{block_music}}:</strong> Musik abspielen (<code>play</code>), einreihen (<code>queue</code>) oder stoppen (<code>stop</code>), in Schleife oder nicht. Du kannst die Dateien in <code>game/audio</code> vorher anhören.</li>
  </ul>
  <h3>{{block_group_advanced}}</h3>
  <ul>
    <li><strong>{{block_comment}}:</strong> eine Notiz für dich, die im Spiel nicht erscheint.</li>
    <li><strong>{{block_custom}}:</strong> beliebiger Ren'Py-Code, für den es keinen eigenen Block gibt.</li>
  </ul>
  <h3>Blöcke in Blöcken</h3>
  <p>Die Optionen einer <em>{{block_menu}}</em> und die Zweige einer <em>{{block_condition}}</em> können weitere Blöcke enthalten. Ihr Formular hat eine Knopfleiste zum Hinzufügen und eine Liste zum Bearbeiten, Umordnen oder Löschen.</p>
</section>

<section id="preview">
  <h2>{{scene_preview}} und {{code_preview}}</h2>
  <h3>{{scene_preview}}</h3>
  <p>Zeigt, wie die Szene beim ausgewählten Block aussieht: Hintergrund, Figuren an ihrer Position, die Dialogbox mit Name und Text oder die Optionen einer Entscheidung. Sie nutzt Auflösung, Farben, Schriften und Größen deiner <code>gui.rpy</code> und sieht dem Spiel daher sehr ähnlich. Übergänge und Animationen werden nicht abgespielt.</p>
  <p>Ziehe den unteren Rand, um sie höher oder niedriger zu machen.</p>
  <h3>{{code_preview}}</h3>
  <p>Zeigt den Ren'Py-Code, den deine Blöcke erzeugen. Du kannst ihn <strong>direkt bearbeiten</strong>: Die Blöcke folgen dem, was du schreibst. <kbd>Strg</kbd>+<kbd>Z</kbd> macht rückgängig, <kbd>Strg</kbd>+<kbd>Y</kbd> stellt wieder her. <em>{{copy_code}}</em> kopiert ihn in die Zwischenablage, <em>{{export}}</em> speichert ihn in einer eigenen Datei.</p>
  <div class="man-tip"><strong>{{spellcheck}}:</strong> Wenn du sie in den {{settings}} aktivierst, werden Tippfehler in den Texten der Geschichte unterstrichen. Rechtsklick auf ein Wort zeigt Vorschläge oder fügt es dem Wörterbuch hinzu.</div>
</section>

<section id="map">
  <h2>{{map_title}}</h2>
  <p>Die <strong>{{map_button}}</strong> zeigt alle Szenen (labels) als verbundene Karten, damit du auf einen Blick siehst, wie die Geschichte verläuft und wohin jede Entscheidung führt.</p>
  <ul>
    <li>Jede Karte zeigt den Namen des labels, ein Vorschaubild seines Hintergrunds, eine Zusammenfassung (die erste Zeile oder den Kommentar nach <code>label name:</code>), wie viele Figuren und Entscheidungen es hat und seine Länge.</li>
    <li>Die Linien zeigen <strong>{{map_legend_jump}}</strong> (durchgezogen), <strong>{{map_legend_call}}</strong> (gestrichelt) und <strong>{{map_legend_choice}}</strong>, mit dem Text der Option und gegebenenfalls ihrer Bedingung.</li>
    <li>Markierungen: <strong>{{map_badge_start}}</strong> (das label <code>start</code>), <strong>{{map_badge_ending}}</strong> (beendet das Spiel), <strong>{{map_badge_missing}}</strong> (etwas springt zu einem label, das noch nicht geschrieben ist) und <strong>{{map_badge_unreachable}}</strong> (nichts führt zu dieser Szene). Szenen mit Patch-Inhalt tragen die Markierung <em>{{map_patch}}</em>.</li>
    <li>labels mit Parametern (Hilfsroutinen) werden nicht angezeigt, damit die Karte übersichtlich bleibt.</li>
  </ul>
  <h3>Bewegen</h3>
  <p>Ziehe, um dich zu bewegen, und nutze das Mausrad (oder <em>{{map_zoom_in}}, {{map_zoom_out}}</em> und <em>{{map_fit}}</em>) zum Zoomen.</p>
  <h3>Seitenleiste</h3>
  <ul>
    <li><strong>{{map_tab_scene}}:</strong> Klicke auf eine Karte, um ihre Datei zu sehen, zu welchen Szenen sie führt und von welchen man hinkommt, ihre Figuren und ihre Entscheidungen mit der Wirkung jeder Option. <em>{{map_open}}</em> lädt sie in den Szenen-Editor.</li>
    <li><strong>{{map_tab_vars}}:</strong> die Variablen der Geschichte, ihr Anfangswert, wo sie sich ändern und wo sie abgefragt werden. Ein Klick auf eine Variable hebt diese Szenen auf der Karte hervor. Hat eine Variable keinen Anfangswert, empfiehlt der Editor ein <code>default</code>.</li>
  </ul>
</section>

<section id="main-menu">
  <h2>{{main_menu_button}}</h2>
  <p>Gestalte das Hauptmenü des Spiels ohne Code. Aktiviere <strong>{{mm_enabled}}</strong> und stelle ein:</p>
  <ul>
    <li><strong>Hintergrund:</strong> der ursprüngliche des Projekts, eine Farbe, ein Bild, ein animiertes GIF (der Editor zerlegt es in Einzelbilder, da Ren'Py keine GIFs abspielt) oder ein Video (WebM empfohlen).</li>
    <li><strong>Obere Ebene:</strong> die dunkle Seitenleiste des ursprünglichen Menüs und eine Abdunklung des Hintergrunds.</li>
    <li><strong>Titel</strong> und <strong>Version:</strong> Text, Größe, Schrift, Farbe, Kontur und Position.</li>
    <li><strong>Schaltflächen:</strong> welche angezeigt werden ({{mm_btn_start}}, {{mm_btn_load}}, {{mm_btn_preferences}}, {{mm_btn_about}}, {{mm_btn_help}}, {{mm_btn_quit}}), senkrechte oder waagerechte Anordnung, Ausrichtung, Abstand, Farben und Hintergrund. Jede Schaltfläche kann Text, ein Bild oder Text auf einem Hintergrundbild sein und eine <em>eigene Position</em> haben.</li>
    <li>Die <strong>Musik</strong> des Menüs, aus dem Ordner <code>game/audio</code>.</li>
  </ul>
  <p>In der Vorschau kannst du Titel und Schaltflächen an ihren Platz <strong>ziehen</strong>. <em>{{mm_save}}</em> schreibt es ins Projekt, <em>{{mm_test}}</em> startet das Spiel, <em>{{mm_reset}}</em> stellt die Anfangswerte her und <em>{{discard_changes}}</em> verwirft Ungespeichertes.</p>
  <h3>Schriften</h3>
  <p>Schriften werden ins Spiel kopiert, daher werden nur solche mit einer <strong>freien Lizenz</strong> angeboten, die die Weitergabe erlaubt. Die meisten Systemschriften (Arial, Calibri…) erlauben das nicht. Mit <em>{{mm_fonts_get_free}}</em> bekommst du mehr.</p>
</section>

<section id="gui">
  <h2>{{gui_editor_title}}</h2>
  <p>Ändere das Aussehen der Spieloberfläche (was <code>gui.rpy</code> festlegt) und sieh das Ergebnis sofort. Die Vorschau hat drei Reiter: <strong>{{gui_tab_dialogue}}</strong>, <strong>{{gui_tab_choice}}</strong> und <strong>{{gui_tab_menu}}</strong>; die Einstellungen links richten sich nach dem Reiter.</p>
  <ul>
    <li><strong>{{gui_section_text}}:</strong> Schriften und Größen von Dialog, Namen und Menüs; Farben; Akzentfarbe; <em>{{gui_cps}}</em> (Buchstaben pro Sekunde; 0 = alles auf einmal).</li>
    <li><strong>{{gui_section_textbox}}</strong> und <strong>{{gui_section_name}}:</strong> Höhe, Position und Breite des Textes, Ausrichtung und die Namensbox.</li>
    <li><strong>{{gui_section_choice}}</strong> und <strong>{{gui_section_menu}}:</strong> Größen, Farben (normal, beim Überfahren, ausgewählt) und Hintergründe.</li>
  </ul>
  <p>Für jedes Bild (Dialogbox, Namensbox, Schaltflächen, Menühintergrund) wählst du zwischen <strong>{{gui_image_keep}}</strong> (das vorhandene Bild des Projekts), <strong>{{gui_image_own}}</strong> oder <strong>{{gui_image_generated}}</strong> (der Editor zeichnet es mit Farbe, Deckkraft, abgerundeten Ecken und Rand deiner Wahl). Bevor ein Bild zum ersten Mal ersetzt wird, sichert er das Original in <code>gui/editor_backup</code>.</p>
  <p>In der Vorschau kannst du Dialogbox, Namen und Schaltflächen <strong>ziehen</strong>, um sie zu verschieben und ihre Größe zu ändern.</p>
  <h3>Google Fonts</h3>
  <p><em>{{gfonts_open}}</em> öffnet einen Katalog von Schriften unter der SIL Open Font License, die du mit deinem Spiel nutzen und weitergeben darfst. Beim Hinzufügen wird die Schrift mit ihrer Lizenz in den Ordner <code>fonts</code> des Projekts geladen. Du kannst auch eine Schrift aus einer Datei hinzufügen.</p>
  <p><em>{{save}}</em> schreibt nur die geänderten Werte; <em>{{discard_changes}}</em> verwirft Ungespeichertes.</p>
</section>

<section id="game-settings">
  <h2>{{game_settings}}</h2>
  <h3>{{game_tab_general}}</h3>
  <ul>
    <li><strong>{{game_name}}</strong> und <strong>{{game_version}}</strong> (<code>config.name</code> und <code>config.version</code>).</li>
    <li><strong>{{game_build_name}}</strong> (<code>build.name</code>): ohne Leerzeichen und Akzente; wird für die erstellten Dateien verwendet. Er folgt dem Spielnamen, bis du ihn von Hand änderst.</li>
    <li><strong>{{game_icon}}:</strong> Wähle ein Bild (am besten quadratisch, 512×512 oder größer), und der Editor erstellt das Fenstersymbol sowie die Symbole für Windows (<code>icon.ico</code>) und Mac (<code>icon.icns</code>).</li>
  </ul>
  <p>Der Ordner der Spielstände ändert sich nicht mit dem Namen, damit Spieler bei einem Update ihre Spielstände nicht verlieren.</p>
  <h3>{{patch}}</h3>
  <p>Siehe <a href="#patch">Patches</a>.</p>
</section>

<section id="build">
  <h2>{{build_game}}</h2>
  <p><strong>{{build_game}}</strong> erstellt die Dateien, die andere herunterladen und ohne Ren'Py spielen können. Wähle die Systeme:</p>
  <ul>
    <li><strong>{{build_pkg_win}}</strong> (.zip), <strong>{{build_pkg_linux}}</strong> (.tar.bz2) und <strong>{{build_pkg_mac}}</strong> (App in einer .zip).</li>
    <li><strong>{{build_pkg_pc}}:</strong> eine einzige .zip für beide.</li>
    <li><strong>{{build_pkg_market}}:</strong> eine .zip mit allen drei Systemen, bereit für den Upload in einen Shop.</li>
  </ul>
  <p>Wähle den Zielordner und klicke auf <em>{{build_start}}</em>. Du siehst den Fortschritt; du kannst den Dialog währenddessen ausblenden (du wirst benachrichtigt, wenn es fertig ist) oder abbrechen. Am Ende führt <em>{{build_open_folder}}</em> zu den Dateien.</p>
  <p>Hat deine Novel einen Patch, wählst du hier außerdem die Version (siehe <a href="#patch">Patches</a>).</p>
  <h3>Das Spiel testen</h3>
  <p><strong>{{launch_project}}</strong> in der Seitenleiste öffnet deine Novel mit Ren'Py so, wie sie gespeichert ist. Gibt es Fehler im Code, zeigt Ren'Py sie beim Start.</p>
</section>

<section id="patch">
  <h2>Patches</h2>
  <p>Manche Novels erscheinen in Shops wie Steam ohne einen Teil ihres Inhalts, und die Autoren bieten diesen Inhalt auf ihrer Website als <strong>Patch</strong> an, den die Spieler dem Spiel hinzufügen. Der Editor bereitet alles für dich vor.</p>
  <h3>1. Den Patch aktivieren</h3>
  <p>Aktiviere unter <strong>{{game_settings}} → {{patch}}</strong> die Option <em>{{patch_enable}}</em>, gib ihm einen Namen und schreibe die Anleitung für die Spieler (sie liegt dem Patch als Textdatei bei). Rechts siehst du, was der Patch enthält, und mögliche Probleme.</p>
  <h3>2. Patch-Inhalte markieren</h3>
  <ul>
    <li><strong>Block „{{block_patch}}“</strong> (Gruppe <em>{{block_group_patch}}</em> der Palette). Er hat zwei Teile:
      <ul>
        <li><strong>{{patch_with}}:</strong> die Blöcke, die nur Spieler mit Patch sehen. Sie werden getrennt gespeichert, in <code>game/patch/</code>.</li>
        <li><strong>{{patch_without}}:</strong> was Spieler ohne Patch sehen (zum Beispiel auf Steam). Darf leer bleiben: Dann geht die Geschichte einfach weiter.</li>
      </ul>
      Um Patch-Inhalte zu speichern, braucht die Szene ein <em>{{target_label}}</em>.</li>
    <li><strong>Bilder:</strong> Mit <em>{{patch_choose_images}}</em> markierst du die, die nur zum Patch gehören. Der Editor verschiebt sie samt Deklaration nach <code>images/patch/</code>. Entfernst du das Häkchen, kommen sie zurück ins Spiel.</li>
  </ul>
  <p>In der Szenenvorschau erscheint der Schalter <strong>{{patch_without}} / {{patch_with}}</strong>, um beide Versionen zu sehen, und auf der Karte tragen Szenen mit Patch-Inhalt ihre Markierung.</p>
  <h3>3. Erstellen</h3>
  <p>Unter <strong>{{build_game}}</strong> wählst du:</p>
  <ul>
    <li><strong>{{build_patch_split}}:</strong> für Steam. Das Spiel enthält den Patch-Inhalt nicht (auch nicht gesperrt) und der Patch kommt in einer eigenen .zip, mit gepacktem Inhalt ohne lesbaren Code, plus Anleitung.</li>
    <li><strong>{{build_patch_full}}:</strong> alles in einem Spiel, für deine Website oder itch.io.</li>
    <li><strong>{{build_patch_base}}:</strong> um ein Update hochzuladen, wenn sich der Patch nicht geändert hat.</li>
  </ul>
  <p>Vor dem Erstellen prüft der Editor, dass nichts im Spiel vom Patch abhängt: zum Beispiel ein Patch-Bild, das auch in einer normalen Szene vorkommt, oder ein Sprung zu einer Szene, die nur im Patch existiert.</p>
  <h3>Für die Spieler</h3>
  <p>Den Patch installieren heißt, die .zip in den Spielordner (wo die ausführbare Datei liegt) zu entpacken. Das Spiel erkennt ihn von selbst. Auf dem Mac liegt der Spielordner in der App; wenn du für Mac veröffentlichst, erkläre das in der Anleitung.</p>
  <div class="man-note"><strong>Regeln der Shops:</strong> Prüfe vor der Veröffentlichung auf Steam oder einem anderen Shop deren Regeln zu Inhalten, die außerhalb des Shops hinzugefügt werden.</div>
</section>

<section id="settings">
  <h2>{{settings}} des Editors</h2>
  <ul>
    <li><strong>{{theme}}:</strong> <em>{{theme_dark}}, {{theme_light}}, {{theme_oled}}</em> oder <em>{{theme_custom}}</em>. Beim benutzerdefinierten Thema öffnet <em>{{custom_theme_edit}}</em> einen Editor, in dem du die Farben der Oberfläche und des Codes wählst; Änderungen sind sofort sichtbar. <em>{{custom_theme_reset}}</em> stellt die Anfangsfarben her und <em>{{cancel}}</em> verwirft die Änderungen.</li>
    <li><strong>{{language}}:</strong> Spanisch, Englisch, Deutsch, Französisch, Italienisch, Portugiesisch, Russisch, vereinfachtes und traditionelles Chinesisch sowie Japanisch.</li>
    <li><strong>{{spellcheck}}:</strong> die Sprachen, in denen die Texte der Geschichte geprüft werden.</li>
    <li><strong>Ren'Py:</strong> welche Installation verwendet wird, und der Knopf, um sie zu ändern oder eine andere zu installieren.</li>
    <li><strong>{{projects_dir}}:</strong> wo neue Projekte erstellt werden.</li>
    <li><strong>{{claude_connection}}:</strong> siehe nächsten Abschnitt.</li>
  </ul>
</section>

<section id="claude">
  <h2>{{claude_connection}}</h2>
  <p>Wenn du <strong>Claude Code</strong> oder <strong>Claude Desktop</strong> nutzt, kannst du es mit dem Editor verbinden und mit eigenen Worten Fragen zu deiner Novel stellen: „Welche Entscheidungen gibt es an Tag 2?“, „Zeig mir, wie der Anfang dieser Szene aussieht“, „Füge dieser Entscheidung eine neue Option hinzu“… Es funktioniert mit deinem eigenen Claude-Konto, solange der Editor geöffnet ist.</p>
  <h3>Aktivieren</h3>
  <ol>
    <li>Aktiviere unter <strong>{{settings}} → {{claude_connection}}</strong> die Option <em>{{claude_enable}}</em>. Sie ist zunächst aus.</li>
    <li><strong>Claude Code:</strong> Klicke auf <em>{{claude_copy_command}}</em> und führe ihn einmal in einem Terminal aus.</li>
    <li><strong>Claude Desktop:</strong> Klicke auf <em>{{claude_desktop_add}}</em> (der Editor sichert vorher dessen Konfiguration) und starte Claude Desktop neu.</li>
  </ol>
  <p>Der Status zeigt, ob Claude verbunden ist und wie viele Anfragen es gestellt hat. Die Verbindung akzeptiert nur Programme auf deinem eigenen Computer, die den Schlüssel haben. <em>{{claude_new_key}}</em> macht den alten ungültig (du musst den Claude-Code-Befehl erneut ausführen), und unter <em>{{claude_port}}</em> kannst du den Port ändern, falls ein anderes Programm ihn nutzt.</p>
  <h3>Was Claude kann</h3>
  <ul>
    <li><strong>Nachschlagen:</strong> das Projekt, die Karte der Geschichte, den Code jedes labels oder jeder Datei, Figuren, Bilder und Audio, Variablen, Oberflächeneinstellungen und eine Fehlerprüfung (Sprünge zu fehlenden labels, fehlende Bilder oder Audiodateien…).</li>
    <li><strong>Ändern:</strong> labels und Dateien schreiben oder bearbeiten, Figuren, Hintergründe, Illustrationen und Variablen hinzufügen, die Oberfläche sowie Name und Version des Spiels ändern.</li>
    <li><strong>Sehen und zeigen:</strong> ein Bild jedes Moments einer Szene erhalten, ein label im Editor oder auf der Karte öffnen und das Spiel starten.</li>
  </ul>
  <h3>Änderungen von Claude rückgängig machen</h3>
  <p>Vor jeder Änderung sichert der Editor die betroffenen Dateien und vermerkt sie unter <strong>{{claude_changes}}</strong> (im selben Bereich der {{settings}}). Dort kannst du jede Änderung <strong>rückgängig machen</strong>; wurde die Datei danach bearbeitet, warnt er dich vorher. Bei jeder Änderung durch Claude erscheint ein Hinweis, und ändert Claude das geöffnete label, lädt der Editor es neu (oder fragt, welche Version du willst, falls du ungespeicherte Änderungen hattest).</p>
</section>

<section id="files">
  <h2>Dateien, die der Editor anlegt</h2>
  <table>
    <tr><th>Datei oder Ordner</th><th>Wofür</th></tr>
    <tr><td><code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code></td><td>Deklarationen von Figuren und Bildern</td></tr>
    <tr><td><code>animations.rpy</code>, <code>positions.rpy</code>, <code>audio.rpy</code></td><td>Animationen, Positionen und Audio</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> und seine <code>.rpy</code></td><td>Das eigene Hauptmenü</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>Die Originalbilder der Oberfläche vor deinen Änderungen</td></tr>
    <tr><td><code>fonts/</code></td><td>Die hinzugefügten Schriften mit ihrer Lizenz</td></tr>
    <tr><td><code>patch_support.rpy</code>, <code>patch/</code>, <code>images/patch/</code></td><td>Der Patch (wenn aktiviert)</td></tr>
    <tr><td><code>.renpy-editor/</code> (neben <code>game</code>)</td><td>Patch-Einstellungen und Sicherungen der Änderungen von Claude. Nicht Teil des Spiels.</td></tr>
  </table>
</section>

<section id="report">
  <h2>{{report_title}}</h2>
  <p>Wenn etwas nicht funktioniert oder dir etwas fehlt, klicke in der Seitenleiste auf <strong>{{report_button}}</strong>. Deine Nachricht geht direkt an den Autor des Editors.</p>
  <ul>
    <li>Wähle <strong>{{report_kind_bug}}</strong> oder <strong>{{report_kind_idea}}</strong>, gib einen Titel ein und beschreibe es genau. Bei einem Problem hilft es sehr, zu sagen, was du gemacht hast, was du erwartet hast und was passiert ist.</li>
    <li><strong>{{report_email}}</strong>: nur, damit dir geantwortet werden kann.</li>
    <li><strong>{{report_tech}}</strong> fügt die Version des Editors, das System und die Sprache hinzu. Vor dem Senden siehst du genau, was dabei ist; deine Novel und deine Dateien werden nie gesendet.</li>
    <li><strong>{{report_via}}</strong> <em>{{report_via_email}}</em> geht direkt an den Autor, ohne Konto. Wenn du GitHub bevorzugst, wähle <em>{{report_via_github}}</em>: Im Browser öffnet sich ein bereits ausgefülltes öffentliches Issue, das du mit deinem Konto veröffentlichst.</li>
  </ul>
  <p>Ohne Verbindung kannst du mit <em>{{report_copy}}</em> die Nachricht auf anderem Weg senden.</p>
</section>

<section id="troubleshooting">
  <h2>Häufige Probleme</h2>
  <dl>
    <dt>„{{renpy_required_title}}“ oder das Spiel startet nicht</dt>
    <dd>Prüfe unter {{settings}} → Ren'Py, ob der Pfad auf deine <code>renpy.exe</code> zeigt, oder nutze <em>{{renpy_change_or_install}}</em>.</dd>
    <dt>Eine Figur oder ein Hintergrund erscheint nicht in den Auswahllisten</dt>
    <dd>Sie müssen im Fenster <a href="#declarations">{{declarations}}</a> deklariert sein (oder in den Deklarationsdateien des Editors).</dd>
    <dt>Die Vorschau zeigt ein Feld mit dem Namen eines Bildes</dt>
    <dd>Das Bild ist nicht deklariert oder seine Datei fehlt. Die Karte und Claudes Prüfung helfen, solche Fälle zu finden.</dd>
    <dt>Eine installierte Schrift fehlt</dt>
    <dd>Es werden nur Schriften mit freier Lizenz gezeigt, weil sie ins Spiel kopiert werden. Suche eine ähnliche bei Google Fonts.</dd>
    <dt>Ich habe Änderungen an einem label verloren</dt>
    <dd>{{save_to_file}} ersetzt den Inhalt des Ziel-labels. Hat Claude die Änderung gemacht, kannst du sie unter <em>{{claude_changes}}</em> rückgängig machen.</dd>
  </dl>
</section>
`
};
