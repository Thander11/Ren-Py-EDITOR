// Ren'Py EDITOR — Manuale d'uso (italiano). {{key}} = testo dell'interfaccia
(window.MANUALS = window.MANUALS || {}).it = {
  title: 'Manuale di Ren\'Py EDITOR',
  search: 'Cerca nel manuale',
  contents: 'Indice',
  noResults: 'Nessuna sezione contiene questo testo.',
  html: `
<section id="intro">
  <h2>Benvenuto</h2>
  <p>Ren'Py EDITOR è un editor visuale per creare visual novel con <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a>. Invece di scrivere tutto il codice a mano, costruisci ogni scena con dei <strong>blocchi</strong> (dialoghi, cambi di sfondo, personaggi che entrano ed escono, scelte…) e l'editor scrive il codice Ren'Py per te. Il codice resta sempre visibile se lo vuoi, e puoi modificarlo direttamente.</p>
  <p>L'editor lavora sui file del tuo progetto Ren'Py: ciò che salvi qui è un progetto normale, che puoi aprire anche con il launcher di Ren'Py o con qualsiasi editor di testo.</p>
  <div class="man-note"><strong>Parole del codice.</strong> I nomi che vengono dal codice di Ren'Py (<code>label</code>, <code>jump</code>, <code>call</code>, <code>Solid</code>…) restano uguali in tutte le lingue, così coincidono con ciò che vedi nel codice.</div>
</section>

<section id="start">
  <h2>Primi passi</h2>
  <h3>Cosa ti serve</h3>
  <p>Per <strong>provare il gioco</strong>, <strong>creare nuovi progetti</strong> e <strong>compilare</strong> serve Ren'Py (l'SDK) sul computer. Se l'editor non lo trova, offre tre possibilità:</p>
  <ul>
    <li><strong>{{renpy_install_auto}}:</strong> scarica l'ultima versione da renpy.org (circa 160 MB), controlla che il file non sia danneggiato e la installa nella cartella che scegli.</li>
    <li><strong>{{renpy_go_website}}</strong> per scaricarlo tu.</li>
    <li><strong>{{renpy_select_existing}}:</strong> scegli il file <code>renpy.exe</code> della tua installazione.</li>
  </ul>
  <p>Puoi cambiarlo quando vuoi in <a href="#settings">{{settings}}</a> → Ren'Py → <em>{{renpy_change_or_install}}</em>.</p>
  <h3>La schermata principale</h3>
  <ul>
    <li><strong>Barra laterale (a sinistra):</strong> le sezioni dell'editor (<em>{{map_button}}, {{nav_scenes}}, {{declarations}}, {{main_menu_button}}, {{gui_editor_title}}</em>), le azioni del progetto (<em>{{open_project}}, {{new_project}}, {{game_settings}}, {{build_game}}</em>) e, in basso, <em>{{launch_project}}</em>, questo <em>{{manual}}</em> e le <em>{{settings}}</em> dell'editor. Sotto appare la cartella del progetto aperto.</li>
    <li><strong>Intestazione:</strong> il file <code>.rpy</code> attivo, il <em>{{target_label}}</em>, il menu <em>{{panels_show}}</em> per scegliere i pannelli, <em>{{clear_all}}</em> e <em>{{save_to_file}}</em>.</li>
    <li><strong>Area di lavoro:</strong> l'elenco dei file, la tavolozza dei blocchi, l'elenco dei blocchi della scena, l'anteprima della scena e l'anteprima del codice.</li>
  </ul>
  <div class="man-tip"><strong>Consiglio:</strong> premi <kbd>F1</kbd> in qualsiasi momento per aprire questo manuale.</div>
</section>

<section id="projects">
  <h2>Progetti</h2>
  <h3>Aprire un progetto</h3>
  <p>Premi <strong>{{open_project}}</strong> e scegli la cartella del tuo gioco (quella che contiene la cartella <code>game</code>) o direttamente la cartella <code>game</code>. L'editor ricorda l'ultimo progetto e lo apre da solo la volta successiva.</p>
  <p>All'apertura, l'editor crea ciò che gli serve se manca: le cartelle <code>audio</code>, <code>images/characters</code>, <code>images/backgrounds</code>, <code>images/scenes</code> e <code>images/expressions</code>, e i file dove salva le dichiarazioni (<code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code>, <code>animations.rpy</code>, <code>positions.rpy</code> e <code>audio.rpy</code>). Non tocca gli altri file.</p>
  <p>Se hai immagini dichiarate in cartelle con altri nomi, l'editor chiede se spostarle nelle cartelle in inglese e aggiornare i percorsi nei <code>.rpy</code>. Puoi rifiutare.</p>
  <h3>Creare un nuovo progetto</h3>
  <p>Premi <strong>{{new_project}}</strong>, scrivi un nome, scegli la <strong>risoluzione</strong> (1920×1080 è una buona via di mezzo) e i <strong>colori dell'interfaccia</strong> del gioco. Il progetto viene creato con Ren'Py nella tua <em>{{projects_dir}}</em> (se non è impostata, l'editor la chiede) e si apre automaticamente.</p>
  <h3>Modifiche fatte fuori dall'editor</h3>
  <p>Se modifichi un <code>.rpy</code> con un altro programma (o lo modifica Claude, vedi <a href="#claude">{{claude_connection}}</a>), l'editor se ne accorge e ricarica i dati del progetto.</p>
</section>

<section id="declarations">
  <h2>{{declarations}}: personaggi, immagini e altro</h2>
  <p>La finestra <strong>{{declarations}}</strong> raccoglie tutto ciò che la storia usa: personaggi, le loro immagini, sfondi… Ciò che aggiungi qui appare poi nei selettori dei blocchi. Ha queste schede:</p>
  <ul>
    <li><strong>{{tab_characters}}:</strong> ogni personaggio ha un <em>{{char_id}}</em> (quello del codice), un <em>{{char_name}}</em>, il colore del nome e l'etichetta delle sue espressioni.</li>
    <li><strong>{{tab_sprites}}:</strong> le immagini di ogni personaggio, ordinate per tipo (per esempio un abito). Si chiamano <code>personaggio_tipo_identificativo</code> (es. <code>Ryu_hunter_1</code>). Puoi aggiungere immagini singole o usare <em>{{add_batch}}</em> per aggiungerne molte in una volta.</li>
    <li><strong>{{tab_expressions}}:</strong> i volti laterali (side images) che accompagnano il dialogo.</li>
    <li><strong>{{tab_backgrounds}}</strong> e <strong>{{tab_scenes}}:</strong> gli sfondi di ogni luogo e le illustrazioni (CG) di momenti particolari.</li>
    <li><strong>{{tab_animations}}</strong> e <strong>{{tab_positions}}:</strong> i <code>transform</code> e le posizioni utilizzabili quando mostri i personaggi.</li>
  </ul>
  <p>Quando elimini qualcosa, l'editor chiede se eliminare anche il file dell'immagine o tenerlo.</p>
</section>

<section id="scenes">
  <h2>{{nav_scenes}}: l'editor a blocchi</h2>
  <p>È la sezione principale. Una scena è un <code>label</code> di Ren'Py, e il suo contenuto è un elenco di blocchi.</p>
  <h3>File e label di destinazione</h3>
  <ul>
    <li>Nel pannello <strong>{{panel_files}}</strong> scegli il file <code>.rpy</code> attivo. <strong>+</strong> crea un nuovo file.</li>
    <li>In <strong>{{target_label}}</strong> scegli il label da modificare: l'editor carica i suoi blocchi. Se scegli <em>{{end_of_file}}</em>, ciò che salvi viene aggiunto in fondo al file come qualcosa di nuovo.</li>
  </ul>
  <h3>Aggiungere e ordinare i blocchi</h3>
  <p>La tavolozza <strong>{{palette_title}}</strong> raggruppa i blocchi per colore: <em>{{block_group_text}}, {{block_group_scene}}, {{block_group_flow}}, {{block_group_audio}}, {{block_group_advanced}}</em> (e <em>{{block_group_patch}}</em> se l'hai attivata). Un clic apre il suo modulo; il nuovo blocco va <strong>sotto il blocco selezionato</strong>.</p>
  <p>Fai clic su un blocco per selezionarlo: compaiono le sue azioni (<em>{{btn_edit}}, {{btn_duplicate}}, {{btn_duplicate_end}}, {{btn_move_up}}, {{btn_move_down}}, {{btn_delete}}</em>) e l'anteprima mostra la scena in quel momento. Doppio clic per modificarlo. Puoi anche trascinare i blocchi per riordinarli.</p>
  <table>
    <tr><th>Tasto</th><th>Azione</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Selezionare il blocco precedente o successivo</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>Spostare il blocco su o giù</td></tr>
    <tr><td><kbd>Invio</kbd></td><td>Modificare il blocco</td></tr>
    <tr><td><kbd>Canc</kbd></td><td>Eliminare il blocco (con conferma)</td></tr>
  </table>
  <h3>Salvare</h3>
  <p><strong>{{save_to_file}}</strong> scrive i blocchi nel file attivo: se c'è un label di destinazione, <strong>ne sostituisce tutto il contenuto</strong> (dopo conferma); altrimenti li aggiunge in fondo. <strong>{{clear_all}}</strong> svuota l'elenco dei blocchi senza toccare il file.</p>
  <p>Se hai modifiche non salvate e cambi label o file, l'editor ti avvisa prima di perderle.</p>
  <h3>Pannelli</h3>
  <p>Con <strong>{{panels_show}}</strong> scegli quali pannelli vedere: <em>{{panel_files}}, {{panel_palette}}, {{panel_preview}}</em> e <em>{{panel_code}}</em>. Puoi ridimensionarli trascinandone i bordi; un doppio clic su un bordo ripristina la dimensione iniziale. L'editor ricorda la tua disposizione.</p>
</section>

<section id="blocks">
  <h2>Tipi di blocco</h2>
  <h3>{{block_group_text}}</h3>
  <ul>
    <li><strong>{{block_dialogue}}:</strong> ciò che dice un personaggio. Puoi scegliere un'<em>espressione</em> laterale per quel momento e segnarlo come <em>pensiero</em> (in corsivo tra &lt;&lt; &gt;&gt;).</li>
    <li><strong>{{block_narration}}:</strong> testo del narratore, senza nome.</li>
  </ul>
  <h3>{{block_group_scene}}</h3>
  <ul>
    <li><strong>{{block_scene}}:</strong> mostra uno sfondo o un'illustrazione (<code>scene</code>) e toglie tutti i personaggi. Puoi aggiungere una transizione (<code>with</code>) e sfocare l'immagine.</li>
    <li><strong>{{block_show}}:</strong> fa apparire un personaggio (<code>show</code>). Scegli l'immagine, la posizione o l'animazione (<code>at</code>), la transizione, se sta dietro un'altra immagine (<code>behind</code>), se è capovolto (<code>xflip</code>) o sfocato.</li>
    <li><strong>{{block_show_multi}}:</strong> più personaggi insieme, con una transizione comune.</li>
    <li><strong>{{block_hide}}</strong> e <strong>{{block_hide_multi}}:</strong> tolgono personaggi dallo schermo (<code>hide</code>). L'editor propone quelli in scena secondo i blocchi precedenti.</li>
    <li><strong>{{block_solid}}:</strong> uno strato di colore pieno (per esempio una dissolvenza al nero o una tinta), con la sua opacità.</li>
  </ul>
  <h3>{{block_group_flow}}</h3>
  <ul>
    <li><strong>{{block_menu}}:</strong> un menu di opzioni (<code>menu</code>). Ogni opzione può saltare a un label (<code>jump</code>), chiamarlo (<code>call</code>), eseguire codice o contenere blocchi propri. Puoi mostrare un personaggio accanto alle opzioni e metterle a sinistra come un fumetto di pensiero.</li>
    <li><strong>{{block_condition}}:</strong> blocchi eseguiti solo se una condizione è vera (<code>if</code>), con <code>elif</code> ed <code>else</code> facoltativi. Esempio: <code>amicizia &gt;= 3 and not confessato</code>.</li>
    <li><strong>{{block_jump}}:</strong> salta a un altro label e non torna.</li>
    <li><strong>{{block_call}}:</strong> va a un altro label e, quando questo termina con <code>return</code>, torna qui. Utile per parti ripetute in più punti.</li>
    <li><strong>{{block_label}}:</strong> crea un nuovo label, subito dopo o in fondo al file.</li>
    <li><strong>{{block_pause}}:</strong> aspetta qualche secondo o, se lasciato vuoto, finché il giocatore fa clic.</li>
  </ul>
  <h3>{{block_group_audio}}</h3>
  <ul>
    <li><strong>{{block_music}}:</strong> riprodurre (<code>play</code>), accodare (<code>queue</code>) o fermare (<code>stop</code>) la musica, in loop o no. Puoi ascoltare i file di <code>game/audio</code> prima di scegliere.</li>
  </ul>
  <h3>{{block_group_advanced}}</h3>
  <ul>
    <li><strong>{{block_comment}}:</strong> una nota per te che non appare nel gioco.</li>
    <li><strong>{{block_custom}}:</strong> qualsiasi codice Ren'Py che non ha un blocco dedicato.</li>
  </ul>
  <h3>Blocchi dentro blocchi</h3>
  <p>Le opzioni di una <em>{{block_menu}}</em> e i rami di una <em>{{block_condition}}</em> possono contenere altri blocchi. Il loro modulo ha una fila di pulsanti per aggiungerli e un elenco per modificarli, riordinarli o eliminarli.</p>
</section>

<section id="preview">
  <h2>{{scene_preview}} e {{code_preview}}</h2>
  <h3>{{scene_preview}}</h3>
  <p>Mostra la scena al blocco selezionato: sfondo, personaggi nella loro posizione, riquadro del dialogo con nome e testo, oppure le opzioni di una scelta. Usa risoluzione, colori, font e dimensioni del tuo <code>gui.rpy</code>, quindi somiglia molto al gioco. Non riproduce transizioni né animazioni.</p>
  <p>Trascina il bordo inferiore per renderla più alta o più bassa.</p>
  <h3>{{code_preview}}</h3>
  <p>Mostra il codice Ren'Py prodotto dai tuoi blocchi. Puoi <strong>modificarlo direttamente</strong>: i blocchi seguono ciò che scrivi. <kbd>Ctrl</kbd>+<kbd>Z</kbd> annulla e <kbd>Ctrl</kbd>+<kbd>Y</kbd> ripete. <em>{{copy_code}}</em> lo copia negli appunti ed <em>{{export}}</em> lo salva in un file a parte.</p>
  <div class="man-tip"><strong>{{spellcheck}}:</strong> se lo attivi nelle {{settings}}, gli errori di battitura nei testi della storia vengono sottolineati. Clic destro su una parola per vedere suggerimenti o aggiungerla al dizionario.</div>
</section>

<section id="map">
  <h2>{{map_title}}</h2>
  <p>La <strong>{{map_button}}</strong> mostra tutte le scene (label) come schede collegate, per vedere a colpo d'occhio come procede la storia e dove porta ogni scelta.</p>
  <ul>
    <li>Ogni scheda mostra il nome del label, una miniatura del suo sfondo, un riassunto (la prima riga, o il commento scritto dopo <code>label nome:</code>), quanti personaggi e scelte contiene e la sua lunghezza.</li>
    <li>Le linee indicano <strong>{{map_legend_jump}}</strong> (continua), <strong>{{map_legend_call}}</strong> (tratteggiata) e <strong>{{map_legend_choice}}</strong>, con il testo dell'opzione e l'eventuale condizione.</li>
    <li>Etichette: <strong>{{map_badge_start}}</strong> (il label <code>start</code>), <strong>{{map_badge_ending}}</strong> (termina il gioco), <strong>{{map_badge_missing}}</strong> (c'è un salto a un label non ancora scritto) e <strong>{{map_badge_unreachable}}</strong> (nulla porta a quella scena). Le scene con contenuto della patch hanno il segno <em>{{map_patch}}</em>.</li>
    <li>I label con parametri (routine di aiuto) non sono mostrati, per non affollare la mappa.</li>
  </ul>
  <h3>Muoversi</h3>
  <p>Trascina per spostarti e usa la rotella del mouse (o <em>{{map_zoom_in}}, {{map_zoom_out}}</em> e <em>{{map_fit}}</em>) per lo zoom.</p>
  <h3>Pannello laterale</h3>
  <ul>
    <li><strong>{{map_tab_scene}}:</strong> fai clic su una scheda per vedere il suo file, a quali scene porta e da quali si arriva, i suoi personaggi e le sue scelte con l'effetto di ogni opzione. <em>{{map_open}}</em> la carica nell'editor delle scene.</li>
    <li><strong>{{map_tab_vars}}:</strong> le variabili della storia, il loro valore iniziale, dove cambiano e dove vengono controllate. Un clic su una variabile evidenzia quelle scene sulla mappa. Se una variabile non ha valore iniziale, l'editor consiglia di aggiungere un <code>default</code>.</li>
  </ul>
</section>

<section id="main-menu">
  <h2>{{main_menu_button}}</h2>
  <p>Progetta il menu principale del gioco senza scrivere codice. Attiva <strong>{{mm_enabled}}</strong> e regola:</p>
  <ul>
    <li><strong>Sfondo:</strong> quello originale del progetto, un colore, un'immagine, una GIF animata (l'editor ne estrae i fotogrammi, perché Ren'Py non riproduce le GIF) o un video (consigliato WebM).</li>
    <li><strong>Strato superiore:</strong> il pannello laterale scuro del menu originale e un oscuramento dello sfondo.</li>
    <li><strong>Titolo</strong> e <strong>versione:</strong> testo, dimensione, font, colore, contorno e posizione.</li>
    <li><strong>Pulsanti:</strong> quali mostrare ({{mm_btn_start}}, {{mm_btn_load}}, {{mm_btn_preferences}}, {{mm_btn_about}}, {{mm_btn_help}}, {{mm_btn_quit}}), disposizione verticale o orizzontale, allineamento, spaziatura, colori e sfondo. Ogni pulsante può essere testo, un'immagine o testo su un'immagine di sfondo, e avere una <em>posizione propria</em>.</li>
    <li>La <strong>musica</strong> del menu, dalla cartella <code>game/audio</code>.</li>
  </ul>
  <p>Nell'anteprima puoi <strong>trascinare</strong> il titolo e i pulsanti per posizionarli. <em>{{mm_save}}</em> lo scrive nel progetto, <em>{{mm_test}}</em> avvia il gioco, <em>{{mm_reset}}</em> torna ai valori iniziali e <em>{{discard_changes}}</em> scarta ciò che non hai salvato.</p>
  <h3>Font</h3>
  <p>I font vengono copiati dentro il gioco, quindi sono offerti solo quelli con una <strong>licenza libera</strong> che ne permette la distribuzione. La maggior parte dei font di sistema (Arial, Calibri…) non lo permette. Usa <em>{{mm_fonts_get_free}}</em> per averne altri.</p>
</section>

<section id="gui">
  <h2>{{gui_editor_title}}</h2>
  <p>Cambia l'aspetto dell'interfaccia del gioco (ciò che definisce <code>gui.rpy</code>) vedendo subito il risultato. L'anteprima ha tre schede: <strong>{{gui_tab_dialogue}}</strong>, <strong>{{gui_tab_choice}}</strong> e <strong>{{gui_tab_menu}}</strong>; le impostazioni a sinistra seguono la scheda.</p>
  <ul>
    <li><strong>{{gui_section_text}}:</strong> font e dimensioni di dialogo, nomi e menu; colori; colore d'accento; <em>{{gui_cps}}</em> (lettere al secondo; 0 = tutto subito).</li>
    <li><strong>{{gui_section_textbox}}</strong> e <strong>{{gui_section_name}}:</strong> altezza, posizione e larghezza del testo, allineamento e riquadro del nome.</li>
    <li><strong>{{gui_section_choice}}</strong> e <strong>{{gui_section_menu}}:</strong> dimensioni, colori (normale, al passaggio del mouse, selezionato) e sfondi.</li>
  </ul>
  <p>Per ogni immagine (riquadro del dialogo, del nome, pulsanti, sfondo dei menu) scegli tra <strong>{{gui_image_keep}}</strong> (quella che il progetto ha già), <strong>{{gui_image_own}}</strong> o <strong>{{gui_image_generated}}</strong> (l'editor la disegna con colore, opacità, angoli arrotondati e margine a tua scelta). Prima di sostituire un'immagine per la prima volta, salva l'originale in <code>gui/editor_backup</code>.</p>
  <p>Nell'anteprima puoi <strong>trascinare</strong> il riquadro del dialogo, il nome e i pulsanti per spostarli e ridimensionarli.</p>
  <h3>Google Fonts</h3>
  <p><em>{{gfonts_open}}</em> apre un catalogo di font con licenza SIL Open Font License, che puoi usare e distribuire con il tuo gioco. Aggiungerne uno lo scarica nella cartella <code>fonts</code> del progetto insieme alla licenza. Puoi anche aggiungere un font da un file.</p>
  <p><em>{{save}}</em> scrive solo i valori modificati; <em>{{discard_changes}}</em> scarta ciò che non hai salvato.</p>
</section>

<section id="game-settings">
  <h2>{{game_settings}}</h2>
  <h3>{{game_tab_general}}</h3>
  <ul>
    <li><strong>{{game_name}}</strong> e <strong>{{game_version}}</strong> (<code>config.name</code> e <code>config.version</code>).</li>
    <li><strong>{{game_build_name}}</strong> (<code>build.name</code>): senza spazi né accenti; si usa per i file creati dalla compilazione. Segue il nome del gioco finché non lo cambi a mano.</li>
    <li><strong>{{game_icon}}:</strong> scegli un'immagine (meglio quadrata, 512×512 o più) e l'editor crea l'icona della finestra e quelle per Windows (<code>icon.ico</code>) e Mac (<code>icon.icns</code>).</li>
  </ul>
  <p>La cartella dei salvataggi non cambia con il nome, così i giocatori non perdono le partite quando aggiorni il gioco.</p>
  <h3>{{patch}}</h3>
  <p>Vedi <a href="#patch">Patch</a>.</p>
</section>

<section id="build">
  <h2>{{build_game}}</h2>
  <p><strong>{{build_game}}</strong> crea i file che altri possono scaricare e giocare senza avere Ren'Py. Scegli i sistemi:</p>
  <ul>
    <li><strong>{{build_pkg_win}}</strong> (.zip), <strong>{{build_pkg_linux}}</strong> (.tar.bz2) e <strong>{{build_pkg_mac}}</strong> (applicazione compressa in .zip).</li>
    <li><strong>{{build_pkg_pc}}:</strong> un solo .zip per entrambi.</li>
    <li><strong>{{build_pkg_market}}:</strong> un .zip con i tre sistemi, pronto da caricare su un negozio.</li>
  </ul>
  <p>Scegli la cartella di destinazione e premi <em>{{build_start}}</em>. Vedrai l'avanzamento; puoi nascondere la finestra nel frattempo (ti avviserà alla fine) o fermarla. Alla fine, <em>{{build_open_folder}}</em> ti porta ai file.</p>
  <p>Se la tua novel ha una patch, qui scegli anche quale versione compilare (vedi <a href="#patch">Patch</a>).</p>
  <h3>Provare il gioco</h3>
  <p><strong>{{launch_project}}</strong>, nella barra laterale, apre la tua novel con Ren'Py così com'è salvata. Se ci sono errori nel codice, Ren'Py li mostra all'avvio.</p>
</section>

<section id="patch">
  <h2>Patch</h2>
  <p>Alcune novel escono su negozi come Steam senza una parte del contenuto, e l'autore offre quel contenuto sul proprio sito come <strong>patch</strong> che i giocatori aggiungono al gioco. L'editor prepara tutto per te.</p>
  <h3>1. Attivare la patch</h3>
  <p>In <strong>{{game_settings}} → {{patch}}</strong>, attiva <em>{{patch_enable}}</em>, dalle un nome e scrivi le istruzioni per i giocatori (sono incluse nella patch come file di testo). A destra vedi cosa contiene la patch e gli eventuali problemi.</p>
  <h3>2. Segnare il contenuto della patch</h3>
  <ul>
    <li><strong>Blocco «{{block_patch}}»</strong> (gruppo <em>{{block_group_patch}}</em> della tavolozza). Ha due parti:
      <ul>
        <li><strong>{{patch_with}}:</strong> i blocchi che vede solo chi ha la patch. Sono salvati a parte, in <code>game/patch/</code>.</li>
        <li><strong>{{patch_without}}:</strong> ciò che vede chi gioca senza (per esempio su Steam). Può restare vuoto: allora la storia prosegue e basta.</li>
      </ul>
      Per salvare contenuto della patch, la scena deve avere un <em>{{target_label}}</em>.</li>
    <li><strong>Immagini:</strong> con <em>{{patch_choose_images}}</em> segni quelle che vanno solo nella patch. L'editor le sposta in <code>images/patch/</code> insieme alla loro dichiarazione. Togliendo il segno tornano nel gioco.</li>
  </ul>
  <p>Nell'anteprima della scena compare il selettore <strong>{{patch_without}} / {{patch_with}}</strong> per vedere le due versioni, e sulla mappa le scene con contenuto della patch hanno il loro segno.</p>
  <h3>3. Compilare</h3>
  <p>In <strong>{{build_game}}</strong> scegli:</p>
  <ul>
    <li><strong>{{build_patch_split}}:</strong> per Steam. Il gioco esce senza il contenuto della patch (nemmeno bloccato) e la patch in un .zip a parte, con il contenuto impacchettato e senza codice leggibile, più le istruzioni.</li>
    <li><strong>{{build_patch_full}}:</strong> tutto in un unico gioco, per il tuo sito o itch.io.</li>
    <li><strong>{{build_patch_base}}:</strong> per caricare un aggiornamento quando la patch non è cambiata.</li>
  </ul>
  <p>Prima di compilare, l'editor controlla che nulla nel gioco dipenda dalla patch: per esempio un'immagine della patch usata anche in una scena normale, o un salto a una scena che esiste solo nella patch.</p>
  <h3>Per i giocatori</h3>
  <p>Installare la patch significa estrarre il .zip nella cartella del gioco (dove si trova l'eseguibile). Il gioco la rileva da solo. Su Mac la cartella del gioco è dentro l'applicazione; se pubblichi per Mac, spiegalo nelle istruzioni.</p>
  <div class="man-note"><strong>Regole dei negozi:</strong> prima di pubblicare su Steam o un altro negozio, controlla le sue regole sui contenuti aggiunti fuori dal negozio.</div>
</section>

<section id="settings">
  <h2>{{settings}} dell'editor</h2>
  <ul>
    <li><strong>{{theme}}:</strong> <em>{{theme_dark}}, {{theme_light}}, {{theme_oled}}</em> o <em>{{theme_custom}}</em>. Con quello personalizzato, <em>{{custom_theme_edit}}</em> apre un editor dove scegli i colori dell'interfaccia e del codice; le modifiche si vedono subito. <em>{{custom_theme_reset}}</em> torna ai colori iniziali e <em>{{cancel}}</em> scarta le modifiche.</li>
    <li><strong>{{language}}:</strong> spagnolo, inglese, tedesco, francese, italiano, portoghese, russo, cinese semplificato, cinese tradizionale e giapponese.</li>
    <li><strong>{{spellcheck}}:</strong> le lingue in cui vengono controllati i testi della storia.</li>
    <li><strong>Ren'Py:</strong> quale installazione si usa, e il pulsante per cambiarla o installarne un'altra.</li>
    <li><strong>{{projects_dir}}:</strong> dove si creano i nuovi progetti.</li>
    <li><strong>{{claude_connection}}:</strong> vedi la sezione seguente.</li>
  </ul>
</section>

<section id="claude">
  <h2>{{claude_connection}}</h2>
  <p>Se usi <strong>Claude Code</strong> o <strong>Claude Desktop</strong>, puoi collegarlo all'editor e chiedergli cose sulla tua novel con parole tue: «quali scelte ci sono nel giorno 2?», «mostrami come appare l'inizio di questa scena», «aggiungi un'opzione a questa scelta»… Funziona con il tuo account Claude, mentre l'editor è aperto.</p>
  <h3>Attivarla</h3>
  <ol>
    <li>In <strong>{{settings}} → {{claude_connection}}</strong>, seleziona <em>{{claude_enable}}</em>. È disattivata in partenza.</li>
    <li><strong>Claude Code:</strong> premi <em>{{claude_copy_command}}</em> ed eseguilo una volta in un terminale.</li>
    <li><strong>Claude Desktop:</strong> premi <em>{{claude_desktop_add}}</em> (l'editor salva prima una copia della sua configurazione) e riavvia Claude Desktop.</li>
  </ol>
  <p>Lo stato indica se Claude è collegato e quante richieste ha fatto. La connessione accetta solo programmi del tuo computer che hanno la chiave. <em>{{claude_new_key}}</em> invalida la precedente (dovrai rieseguire il comando di Claude Code) e <em>{{claude_port}}</em> ti permette di cambiarla se un altro programma usa la stessa.</p>
  <h3>Cosa può fare Claude</h3>
  <ul>
    <li><strong>Consultare:</strong> il progetto, la mappa della storia, il codice di qualsiasi label o file, personaggi, immagini e audio, variabili, impostazioni dell'interfaccia e un controllo degli errori (salti a label inesistenti, immagini o audio mancanti…).</li>
    <li><strong>Modificare:</strong> scrivere o modificare label e file, aggiungere personaggi, sfondi, illustrazioni e variabili, e cambiare l'interfaccia o il nome e la versione del gioco.</li>
    <li><strong>Vedere e mostrare:</strong> ottenere un'immagine di qualsiasi momento di una scena, aprire un label nell'editor o sulla mappa e avviare il gioco.</li>
  </ul>
  <h3>Modifiche di Claude e annullamento</h3>
  <p>Prima di ogni modifica, l'editor salva una copia dei file coinvolti e la annota in <strong>{{claude_changes}}</strong> (nella stessa sezione delle {{settings}}). Da lì puoi <strong>annullare</strong> qualsiasi modifica; se il file è stato modificato dopo, ti avvisa prima. A ogni modifica di Claude appare un avviso, e se modifica il label che hai aperto, l'editor lo ricarica (o ti chiede quale versione tenere se avevi modifiche non salvate).</p>
</section>

<section id="files">
  <h2>File creati dall'editor</h2>
  <table>
    <tr><th>File o cartella</th><th>A cosa serve</th></tr>
    <tr><td><code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code></td><td>Dichiarazioni di personaggi e immagini</td></tr>
    <tr><td><code>animations.rpy</code>, <code>positions.rpy</code>, <code>audio.rpy</code></td><td>Animazioni, posizioni e audio</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> e il suo <code>.rpy</code></td><td>Il menu principale personalizzato</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>Le immagini originali dell'interfaccia prima delle modifiche</td></tr>
    <tr><td><code>fonts/</code></td><td>I font aggiunti, con la loro licenza</td></tr>
    <tr><td><code>patch_support.rpy</code>, <code>patch/</code>, <code>images/patch/</code></td><td>La patch (se attivata)</td></tr>
    <tr><td><code>.renpy-editor/</code> (accanto a <code>game</code>)</td><td>Impostazioni della patch e copie delle modifiche di Claude. Non incluso nel gioco.</td></tr>
  </table>
</section>

<section id="report">
  <h2>{{report_title}}</h2>
  <p>Se qualcosa non funziona o ti manca qualcosa, premi <strong>{{report_button}}</strong> nella barra laterale. Il tuo messaggio arriva direttamente all'autore dell'editor.</p>
  <ul>
    <li>Scegli <strong>{{report_kind_bug}}</strong> o <strong>{{report_kind_idea}}</strong>, dagli un titolo e raccontalo nei dettagli. Per un problema aiuta molto dire cosa stavi facendo, cosa ti aspettavi e cosa è successo.</li>
    <li><strong>{{report_email}}</strong>: serve solo per poterti rispondere.</li>
    <li><strong>{{report_tech}}</strong> aggiunge la versione dell'editor, il sistema e la lingua. Prima di inviare vedi esattamente cosa viene incluso; la tua novel e i tuoi file non vengono mai inviati.</li>
  </ul>
  <p>Senza connessione puoi usare <em>{{report_copy}}</em> per inviarlo in un altro modo.</p>
</section>

<section id="troubleshooting">
  <h2>Problemi frequenti</h2>
  <dl>
    <dt>«{{renpy_required_title}}» o il gioco non si avvia</dt>
    <dd>Controlla in {{settings}} → Ren'Py che il percorso punti al tuo <code>renpy.exe</code>, oppure usa <em>{{renpy_change_or_install}}</em>.</dd>
    <dt>Un personaggio o uno sfondo non appare nei selettori</dt>
    <dd>Deve essere dichiarato nella finestra <a href="#declarations">{{declarations}}</a> (o nei file di dichiarazione dell'editor).</dd>
    <dt>L'anteprima mostra un riquadro con il nome di un'immagine</dt>
    <dd>Quell'immagine non è dichiarata o il suo file non esiste. Anche la mappa e il controllo di Claude aiutano a trovare questi casi.</dd>
    <dt>Non trovo un font installato</dt>
    <dd>Sono mostrati solo i font con licenza libera, perché vengono copiati nel gioco. Cercane uno simile su Google Fonts.</dd>
    <dt>Ho perso delle modifiche a un label</dt>
    <dd>{{save_to_file}} sostituisce il contenuto del label di destinazione. Se la modifica l'ha fatta Claude, puoi annullarla in <em>{{claude_changes}}</em>.</dd>
  </dl>
</section>
`
};
