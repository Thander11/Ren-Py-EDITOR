// Ren'Py EDITOR — Manuel d'utilisation (français). {{key}} = texte de l'interface
(window.MANUALS = window.MANUALS || {}).fr = {
  title: 'Manuel de Ren\'Py EDITOR',
  search: 'Rechercher dans le manuel',
  contents: 'Sommaire',
  noResults: 'Aucune section ne contient ce texte.',
  html: `
<section id="intro">
  <h2>Bienvenue</h2>
  <p>Ren'Py EDITOR est un éditeur visuel pour créer des visual novels avec <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a>. Au lieu d'écrire tout le code à la main, tu construis chaque scène avec des <strong>blocs</strong> (dialogues, changements de décor, personnages qui entrent et sortent, choix…) et l'éditeur écrit le code Ren'Py pour toi. Le code reste toujours visible si tu le souhaites, et tu peux le modifier directement.</p>
  <p>L'éditeur travaille sur les fichiers de ton projet Ren'Py : ce que tu enregistres ici est un projet normal, que tu peux aussi ouvrir avec le lanceur de Ren'Py ou n'importe quel éditeur de texte.</p>
  <div class="man-note"><strong>Mots du code.</strong> Les noms qui viennent du code de Ren'Py (<code>label</code>, <code>jump</code>, <code>call</code>, <code>Solid</code>…) restent identiques dans toutes les langues, pour correspondre à ce que tu vois dans le code.</div>
</section>

<section id="start">
  <h2>Premiers pas</h2>
  <h3>Ce qu'il te faut</h3>
  <p>Pour <strong>tester le jeu</strong>, <strong>créer des projets</strong> et <strong>compiler</strong>, il faut Ren'Py (le SDK) sur ton ordinateur. Si l'éditeur ne le trouve pas, il propose trois options :</p>
  <ul>
    <li><strong>{{renpy_install_auto}} :</strong> télécharge la dernière version depuis renpy.org (environ 160 Mo), vérifie que le fichier n'est pas endommagé et l'installe dans le dossier de ton choix.</li>
    <li><strong>{{renpy_go_website}}</strong> pour le télécharger toi-même.</li>
    <li><strong>{{renpy_select_existing}} :</strong> tu choisis le fichier <code>renpy.exe</code> de ton installation.</li>
  </ul>
  <p>Tu peux le changer à tout moment dans <a href="#settings">{{settings}}</a> → Ren'Py → <em>{{renpy_change_or_install}}</em>.</p>
  <h3>L'écran principal</h3>
  <ul>
    <li><strong>Barre latérale (à gauche) :</strong> les sections de l'éditeur (<em>{{map_button}}, {{nav_scenes}}, {{declarations}}, {{main_menu_button}}, {{gui_editor_title}}</em>), les actions du projet (<em>{{open_project}}, {{new_project}}, {{game_settings}}, {{build_game}}</em>) et, en bas, <em>{{launch_project}}</em>, ce <em>{{manual}}</em> et les <em>{{settings}}</em> de l'éditeur. Le dossier du projet ouvert s'affiche en dessous.</li>
    <li><strong>En-tête :</strong> le fichier <code>.rpy</code> actif, le <em>{{target_label}}</em>, le menu <em>{{panels_show}}</em> pour choisir les panneaux, <em>{{clear_all}}</em> et <em>{{save_to_file}}</em>.</li>
    <li><strong>Zone de travail :</strong> la liste des fichiers, la palette de blocs, la liste des blocs de la scène, l'aperçu de la scène et l'aperçu du code.</li>
  </ul>
  <div class="man-tip"><strong>Astuce :</strong> appuie sur <kbd>F1</kbd> à tout moment pour ouvrir ce manuel.</div>
</section>

<section id="projects">
  <h2>Projets</h2>
  <h3>Ouvrir un projet</h3>
  <p>Clique sur <strong>{{open_project}}</strong> et choisis le dossier de ton jeu (celui qui contient le dossier <code>game</code>) ou directement le dossier <code>game</code>. L'éditeur se souvient du dernier projet et l'ouvre automatiquement la fois suivante.</p>
  <p>À l'ouverture, l'éditeur crée ce dont il a besoin s'il manque : les dossiers <code>audio</code>, <code>images/characters</code>, <code>images/backgrounds</code>, <code>images/scenes</code> et <code>images/expressions</code>, et les fichiers où il garde les déclarations (<code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code>, <code>animations.rpy</code>, <code>positions.rpy</code> et <code>audio.rpy</code>). Il ne touche pas à tes autres fichiers.</p>
  <p>Si des images sont déclarées dans des dossiers avec d'autres noms, l'éditeur demande s'il doit les déplacer dans les dossiers en anglais et mettre à jour les chemins dans les <code>.rpy</code>. Tu peux refuser.</p>
  <h3>Créer un nouveau projet</h3>
  <p>Clique sur <strong>{{new_project}}</strong>, tape un nom, choisis la <strong>résolution</strong> (1920×1080 est un bon compromis) et les <strong>couleurs de l'interface</strong> du jeu. Le projet est créé avec Ren'Py dans ton <em>{{projects_dir}}</em> (s'il n'est pas défini, l'éditeur le demande) et s'ouvre automatiquement.</p>
  <h3>Modifications faites hors de l'éditeur</h3>
  <p>Si tu modifies un <code>.rpy</code> avec un autre programme (ou si Claude le modifie, voir <a href="#claude">{{claude_connection}}</a>), l'éditeur s'en rend compte et recharge les données du projet.</p>
</section>

<section id="declarations">
  <h2>{{declarations}} : personnages, images et plus</h2>
  <p>La fenêtre <strong>{{declarations}}</strong> réunit tout ce que l'histoire utilise : personnages, leurs images, décors… Ce que tu ajoutes ici apparaît ensuite dans les sélecteurs des blocs. Elle a ces onglets :</p>
  <ul>
    <li><strong>{{tab_characters}} :</strong> chaque personnage a un <em>{{char_id}}</em> (celui du code), un <em>{{char_name}}</em>, la couleur du nom et l'étiquette de ses expressions.</li>
    <li><strong>{{tab_sprites}} :</strong> les images de chaque personnage, classées par type (par exemple une tenue). Elles se nomment <code>personnage_type_identifiant</code> (ex. <code>Ryu_hunter_1</code>). Tu peux ajouter des images une par une ou utiliser <em>{{add_batch}}</em> pour en ajouter beaucoup d'un coup.</li>
    <li><strong>{{tab_expressions}} :</strong> les visages latéraux (side images) qui accompagnent le dialogue.</li>
    <li><strong>{{tab_backgrounds}}</strong> et <strong>{{tab_scenes}} :</strong> les décors de chaque lieu et les illustrations (CG) de moments précis.</li>
    <li><strong>{{tab_animations}}</strong> et <strong>{{tab_positions}} :</strong> les <code>transform</code> et positions utilisables pour afficher les personnages.</li>
  </ul>
  <p>Quand tu supprimes quelque chose, l'éditeur demande s'il faut aussi supprimer le fichier image ou le garder.</p>
</section>

<section id="scenes">
  <h2>{{nav_scenes}} : l'éditeur de blocs</h2>
  <p>C'est la section principale. Une scène est un <code>label</code> Ren'Py, et son contenu est une liste de blocs.</p>
  <h3>Fichiers et label cible</h3>
  <ul>
    <li>Dans le panneau <strong>{{panel_files}}</strong>, tu choisis le fichier <code>.rpy</code> actif. <strong>+</strong> crée un nouveau fichier.</li>
    <li>Dans <strong>{{target_label}}</strong>, tu choisis le label à modifier : l'éditeur charge ses blocs. Si tu choisis <em>{{end_of_file}}</em>, ce que tu enregistres est ajouté à la fin du fichier comme quelque chose de nouveau.</li>
  </ul>
  <h3>Ajouter et organiser les blocs</h3>
  <p>La palette <strong>{{palette_title}}</strong> regroupe les blocs par couleur : <em>{{block_group_text}}, {{block_group_scene}}, {{block_group_flow}}, {{block_group_audio}}, {{block_group_advanced}}</em> (et <em>{{block_group_patch}}</em> si tu l'as activé). Un clic ouvre son formulaire ; le nouveau bloc se place <strong>sous le bloc sélectionné</strong>.</p>
  <p>Clique sur un bloc pour le sélectionner : ses actions apparaissent (<em>{{btn_edit}}, {{btn_duplicate}}, {{btn_duplicate_end}}, {{btn_move_up}}, {{btn_move_down}}, {{btn_delete}}</em>) et l'aperçu montre la scène à ce moment. Double-clic pour le modifier. Tu peux aussi faire glisser les blocs pour les réordonner.</p>
  <table>
    <tr><th>Touche</th><th>Action</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Sélectionner le bloc précédent ou suivant</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>Monter ou descendre le bloc</td></tr>
    <tr><td><kbd>Entrée</kbd></td><td>Modifier le bloc</td></tr>
    <tr><td><kbd>Suppr</kbd></td><td>Supprimer le bloc (avec confirmation)</td></tr>
  </table>
  <h3>Enregistrer</h3>
  <p><strong>{{save_to_file}}</strong> écrit les blocs dans le fichier actif : s'il y a un label cible, il <strong>remplace tout son contenu</strong> (après confirmation) ; sinon, il les ajoute à la fin. <strong>{{clear_all}}</strong> vide la liste des blocs sans toucher au fichier.</p>
  <p>Si tu as des modifications non enregistrées et que tu changes de label ou de fichier, l'éditeur te prévient avant de les perdre.</p>
  <h3>Panneaux</h3>
  <p>Avec <strong>{{panels_show}}</strong>, tu choisis les panneaux visibles : <em>{{panel_files}}, {{panel_palette}}, {{panel_preview}}</em> et <em>{{panel_code}}</em>. Tu peux les redimensionner en faisant glisser leurs bords ; un double-clic sur un bord rétablit sa taille initiale. L'éditeur se souvient de ta disposition.</p>
</section>

<section id="blocks">
  <h2>Types de blocs</h2>
  <h3>{{block_group_text}}</h3>
  <ul>
    <li><strong>{{block_dialogue}} :</strong> ce que dit un personnage. Tu peux choisir une <em>expression</em> latérale pour ce moment et le marquer comme <em>pensée</em> (affiché en italique entre &lt;&lt; &gt;&gt;).</li>
    <li><strong>{{block_narration}} :</strong> texte du narrateur, sans nom.</li>
  </ul>
  <h3>{{block_group_scene}}</h3>
  <ul>
    <li><strong>{{block_scene}} :</strong> affiche un décor ou une illustration (<code>scene</code>) et retire tous les personnages. Tu peux ajouter une transition (<code>with</code>) et flouter l'image.</li>
    <li><strong>{{block_show}} :</strong> fait apparaître un personnage (<code>show</code>). Tu choisis l'image, la position ou l'animation (<code>at</code>), la transition, s'il passe derrière une autre image (<code>behind</code>), s'il est retourné (<code>xflip</code>) ou flouté.</li>
    <li><strong>{{block_show_multi}} :</strong> plusieurs personnages à la fois, avec une transition commune.</li>
    <li><strong>{{block_hide}}</strong> et <strong>{{block_hide_multi}} :</strong> retirent des personnages de l'écran (<code>hide</code>). L'éditeur propose ceux qui sont à l'écran d'après les blocs précédents.</li>
    <li><strong>{{block_solid}} :</strong> un calque de couleur unie (par exemple un fondu au noir ou une teinte), avec son opacité.</li>
  </ul>
  <h3>{{block_group_flow}}</h3>
  <ul>
    <li><strong>{{block_menu}} :</strong> un menu d'options (<code>menu</code>). Chaque option peut sauter vers un label (<code>jump</code>), l'appeler (<code>call</code>), exécuter du code ou contenir ses propres blocs. Tu peux afficher un personnage à côté des options et les placer à gauche comme une bulle de pensée.</li>
    <li><strong>{{block_condition}} :</strong> des blocs qui ne s'exécutent que si une condition est remplie (<code>if</code>), avec <code>elif</code> et <code>else</code> facultatifs. Exemple : <code>amitie &gt;= 3 and not avoue</code>.</li>
    <li><strong>{{block_jump}} :</strong> saute vers un autre label sans revenir.</li>
    <li><strong>{{block_call}} :</strong> va vers un autre label et, quand celui-ci se termine par <code>return</code>, revient ici. Pratique pour les passages répétés à plusieurs endroits.</li>
    <li><strong>{{block_label}} :</strong> crée un nouveau label, juste après ou à la fin du fichier.</li>
    <li><strong>{{block_pause}} :</strong> attend quelques secondes ou, si le champ est vide, jusqu'à ce que le joueur clique.</li>
  </ul>
  <h3>{{block_group_audio}}</h3>
  <ul>
    <li><strong>{{block_music}} :</strong> lancer (<code>play</code>), mettre en file (<code>queue</code>) ou arrêter (<code>stop</code>) la musique, en boucle ou non. Tu peux écouter les fichiers de <code>game/audio</code> avant de choisir.</li>
  </ul>
  <h3>{{block_group_advanced}}</h3>
  <ul>
    <li><strong>{{block_comment}} :</strong> une note pour toi, qui n'apparaît pas dans le jeu.</li>
    <li><strong>{{block_custom}} :</strong> n'importe quel code Ren'Py qui n'a pas de bloc dédié.</li>
  </ul>
  <h3>Blocs dans des blocs</h3>
  <p>Les options d'un bloc <em>{{block_menu}}</em> et les branches d'une <em>{{block_condition}}</em> peuvent contenir d'autres blocs. Leur formulaire a une rangée de boutons pour les ajouter et une liste pour les modifier, les réordonner ou les supprimer.</p>
</section>

<section id="preview">
  <h2>{{scene_preview}} et {{code_preview}}</h2>
  <h3>{{scene_preview}}</h3>
  <p>Montre la scène au bloc sélectionné : décor, personnages à leur position, boîte de dialogue avec nom et texte, ou options d'un choix. Il utilise la résolution, les couleurs, les polices et les tailles de ton <code>gui.rpy</code> : il ressemble donc beaucoup au jeu. Les transitions et animations ne sont pas jouées.</p>
  <p>Fais glisser son bord inférieur pour l'agrandir ou le réduire.</p>
  <h3>{{code_preview}}</h3>
  <p>Montre le code Ren'Py produit par tes blocs. Tu peux le <strong>modifier directement</strong> : les blocs suivent ce que tu écris. <kbd>Ctrl</kbd>+<kbd>Z</kbd> annule et <kbd>Ctrl</kbd>+<kbd>Y</kbd> rétablit. <em>{{copy_code}}</em> le copie dans le presse-papiers et <em>{{export}}</em> l'enregistre dans un fichier à part.</p>
  <div class="man-tip"><strong>{{spellcheck}} :</strong> si tu l'actives dans les {{settings}}, les fautes de frappe des textes de l'histoire sont soulignées. Clic droit sur un mot pour voir des suggestions ou l'ajouter au dictionnaire.</div>
</section>

<section id="map">
  <h2>{{map_title}}</h2>
  <p>La <strong>{{map_button}}</strong> montre toutes les scènes (labels) sous forme de cartes reliées, pour voir d'un coup d'œil comment avance l'histoire et où mène chaque choix.</p>
  <ul>
    <li>Chaque carte montre le nom du label, une miniature de son décor, un résumé (sa première ligne, ou le commentaire écrit après <code>label nom:</code>), son nombre de personnages et de choix, et sa longueur.</li>
    <li>Les lignes indiquent <strong>{{map_legend_jump}}</strong> (continue), <strong>{{map_legend_call}}</strong> (pointillée) et <strong>{{map_legend_choice}}</strong>, avec le texte de l'option et sa condition éventuelle.</li>
    <li>Badges : <strong>{{map_badge_start}}</strong> (le label <code>start</code>), <strong>{{map_badge_ending}}</strong> (termine le jeu), <strong>{{map_badge_missing}}</strong> (un saut vise un label pas encore écrit) et <strong>{{map_badge_unreachable}}</strong> (rien ne mène à cette scène). Les scènes avec du contenu de patch portent la marque <em>{{map_patch}}</em>.</li>
    <li>Les labels avec paramètres (routines d'aide) ne sont pas affichés, pour ne pas encombrer la carte.</li>
  </ul>
  <h3>Se déplacer</h3>
  <p>Fais glisser pour te déplacer et utilise la molette (ou <em>{{map_zoom_in}}, {{map_zoom_out}}</em> et <em>{{map_fit}}</em>) pour zoomer.</p>
  <h3>Panneau latéral</h3>
  <ul>
    <li><strong>{{map_tab_scene}} :</strong> clique sur une carte pour voir son fichier, les scènes vers lesquelles elle mène et celles qui y mènent, ses personnages et ses choix avec l'effet de chaque option. <em>{{map_open}}</em> la charge dans l'éditeur de scènes.</li>
    <li><strong>{{map_tab_vars}} :</strong> les variables de l'histoire, leur valeur initiale, où elles changent et où elles sont testées. Un clic sur une variable surligne ces scènes sur la carte. Si une variable n'a pas de valeur initiale, l'éditeur recommande d'ajouter un <code>default</code>.</li>
  </ul>
</section>

<section id="main-menu">
  <h2>{{main_menu_button}}</h2>
  <p>Conçois le menu principal du jeu sans écrire de code. Active <strong>{{mm_enabled}}</strong> et règle :</p>
  <ul>
    <li><strong>Fond :</strong> celui d'origine du projet, une couleur, une image, un GIF animé (l'éditeur en extrait les images, car Ren'Py ne lit pas les GIF) ou une vidéo (WebM recommandé).</li>
    <li><strong>Calque supérieur :</strong> le panneau latéral sombre du menu d'origine et un assombrissement du fond.</li>
    <li><strong>Titre</strong> et <strong>version :</strong> texte, taille, police, couleur, contour et position.</li>
    <li><strong>Boutons :</strong> lesquels s'affichent ({{mm_btn_start}}, {{mm_btn_load}}, {{mm_btn_preferences}}, {{mm_btn_about}}, {{mm_btn_help}}, {{mm_btn_quit}}), disposition verticale ou horizontale, alignement, espacement, couleurs et fond. Chaque bouton peut être du texte, une image ou du texte sur une image de fond, et avoir sa <em>propre position</em>.</li>
    <li>La <strong>musique</strong> du menu, depuis le dossier <code>game/audio</code>.</li>
  </ul>
  <p>Dans l'aperçu, tu peux <strong>faire glisser</strong> le titre et les boutons pour les placer. <em>{{mm_save}}</em> l'écrit dans le projet, <em>{{mm_test}}</em> lance le jeu, <em>{{mm_reset}}</em> revient aux valeurs initiales et <em>{{discard_changes}}</em> abandonne ce qui n'est pas enregistré.</p>
  <h3>Polices</h3>
  <p>Les polices sont copiées dans le jeu : seules celles dont la <strong>licence libre</strong> permet la distribution sont proposées. La plupart des polices du système (Arial, Calibri…) ne le permettent pas. Utilise <em>{{mm_fonts_get_free}}</em> pour en obtenir d'autres.</p>
</section>

<section id="gui">
  <h2>{{gui_editor_title}}</h2>
  <p>Modifie l'apparence de l'interface du jeu (ce que définit <code>gui.rpy</code>) et vois le résultat aussitôt. L'aperçu a trois onglets : <strong>{{gui_tab_dialogue}}</strong>, <strong>{{gui_tab_choice}}</strong> et <strong>{{gui_tab_menu}}</strong> ; les réglages de gauche suivent l'onglet.</p>
  <ul>
    <li><strong>{{gui_section_text}} :</strong> polices et tailles du dialogue, des noms et des menus ; couleurs ; couleur d'accent ; <em>{{gui_cps}}</em> (lettres par seconde ; 0 = tout d'un coup).</li>
    <li><strong>{{gui_section_textbox}}</strong> et <strong>{{gui_section_name}} :</strong> hauteur, position et largeur du texte, alignement et boîte du nom.</li>
    <li><strong>{{gui_section_choice}}</strong> et <strong>{{gui_section_menu}} :</strong> tailles, couleurs (normal, survol, sélectionné) et fonds.</li>
  </ul>
  <p>Pour chaque image (boîte de dialogue, boîte du nom, boutons, fond des menus), tu choisis entre <strong>{{gui_image_keep}}</strong> (celle du projet), <strong>{{gui_image_own}}</strong> ou <strong>{{gui_image_generated}}</strong> (l'éditeur la dessine avec la couleur, l'opacité, les coins arrondis et la marge de ton choix). Avant de remplacer une image pour la première fois, il garde l'originale dans <code>gui/editor_backup</code>.</p>
  <p>Dans l'aperçu, tu peux <strong>faire glisser</strong> la boîte de dialogue, le nom et les boutons pour les déplacer et les redimensionner.</p>
  <h3>Google Fonts</h3>
  <p><em>{{gfonts_open}}</em> ouvre un catalogue de polices sous licence SIL Open Font License, utilisables et distribuables avec ton jeu. En ajouter une la télécharge dans le dossier <code>fonts</code> du projet avec sa licence. Tu peux aussi ajouter une police depuis un fichier.</p>
  <p><em>{{save}}</em> n'écrit que les valeurs modifiées ; <em>{{discard_changes}}</em> abandonne ce qui n'est pas enregistré.</p>
</section>

<section id="game-settings">
  <h2>{{game_settings}}</h2>
  <h3>{{game_tab_general}}</h3>
  <ul>
    <li><strong>{{game_name}}</strong> et <strong>{{game_version}}</strong> (<code>config.name</code> et <code>config.version</code>).</li>
    <li><strong>{{game_build_name}}</strong> (<code>build.name</code>) : sans espaces ni accents ; sert pour les fichiers créés à la compilation. Il suit le nom du jeu jusqu'à ce que tu le modifies à la main.</li>
    <li><strong>{{game_icon}} :</strong> choisis une image (de préférence carrée, 512×512 ou plus) et l'éditeur crée l'icône de la fenêtre et celles de Windows (<code>icon.ico</code>) et Mac (<code>icon.icns</code>).</li>
  </ul>
  <p>Le dossier des sauvegardes ne change pas avec le nom, pour que les joueurs ne perdent pas leurs parties lors d'une mise à jour.</p>
  <h3>{{patch}}</h3>
  <p>Voir <a href="#patch">Patchs</a>.</p>
</section>

<section id="build">
  <h2>{{build_game}}</h2>
  <p><strong>{{build_game}}</strong> crée les fichiers que d'autres peuvent télécharger et jouer sans avoir Ren'Py. Choisis les systèmes :</p>
  <ul>
    <li><strong>{{build_pkg_win}}</strong> (.zip), <strong>{{build_pkg_linux}}</strong> (.tar.bz2) et <strong>{{build_pkg_mac}}</strong> (application compressée en .zip).</li>
    <li><strong>{{build_pkg_pc}} :</strong> un seul .zip pour les deux.</li>
    <li><strong>{{build_pkg_market}} :</strong> un .zip avec les trois systèmes, prêt à être envoyé sur une boutique.</li>
  </ul>
  <p>Choisis le dossier de destination et clique sur <em>{{build_start}}</em>. Tu vois la progression ; tu peux masquer la fenêtre pendant ce temps (tu seras prévenu à la fin) ou l'arrêter. À la fin, <em>{{build_open_folder}}</em> t'amène aux fichiers.</p>
  <p>Si ton roman a un patch, c'est aussi ici que tu choisis la version (voir <a href="#patch">Patchs</a>).</p>
  <h3>Tester le jeu</h3>
  <p><strong>{{launch_project}}</strong>, dans la barre latérale, ouvre ton roman avec Ren'Py tel qu'il est enregistré. S'il y a des erreurs dans le code, Ren'Py les affiche au démarrage.</p>
</section>

<section id="patch">
  <h2>Patchs</h2>
  <p>Certains romans sortent sur des boutiques comme Steam sans une partie de leur contenu, et l'auteur propose ce contenu sur son site sous forme de <strong>patch</strong> que les joueurs ajoutent au jeu. L'éditeur prépare tout pour toi.</p>
  <h3>1. Activer le patch</h3>
  <p>Dans <strong>{{game_settings}} → {{patch}}</strong>, active <em>{{patch_enable}}</em>, donne-lui un nom et écris les instructions pour les joueurs (elles sont incluses dans le patch sous forme de fichier texte). À droite, tu vois ce que contient le patch et les problèmes éventuels.</p>
  <h3>2. Marquer le contenu du patch</h3>
  <ul>
    <li><strong>Bloc « {{block_patch}} »</strong> (groupe <em>{{block_group_patch}}</em> de la palette). Il a deux parties :
      <ul>
        <li><strong>{{patch_with}} :</strong> les blocs que seuls les joueurs avec le patch voient. Ils sont gardés à part, dans <code>game/patch/</code>.</li>
        <li><strong>{{patch_without}} :</strong> ce que voient les joueurs sans le patch (par exemple sur Steam). Peut rester vide : l'histoire continue simplement.</li>
      </ul>
      Pour enregistrer du contenu du patch, la scène doit avoir un <em>{{target_label}}</em>.</li>
    <li><strong>Images :</strong> avec <em>{{patch_choose_images}}</em>, tu marques celles qui ne vont que dans le patch. L'éditeur les déplace dans <code>images/patch/</code> avec leur déclaration. Les décocher les remet dans le jeu.</li>
  </ul>
  <p>L'aperçu de la scène affiche le sélecteur <strong>{{patch_without}} / {{patch_with}}</strong> pour voir les deux versions, et sur la carte les scènes avec du contenu de patch portent leur marque.</p>
  <h3>3. Compiler</h3>
  <p>Dans <strong>{{build_game}}</strong>, tu choisis :</p>
  <ul>
    <li><strong>{{build_patch_split}} :</strong> pour Steam. Le jeu sort sans le contenu du patch (même pas verrouillé) et le patch dans un .zip séparé, avec son contenu empaqueté et sans code lisible, plus les instructions.</li>
    <li><strong>{{build_patch_full}} :</strong> tout dans un même jeu, pour ton site ou itch.io.</li>
    <li><strong>{{build_patch_base}} :</strong> pour publier une mise à jour quand le patch n'a pas changé.</li>
  </ul>
  <p>Avant de compiler, l'éditeur vérifie que rien dans le jeu ne dépend du patch : par exemple une image du patch utilisée dans une scène normale, ou un saut vers une scène qui n'existe que dans le patch.</p>
  <h3>Pour les joueurs</h3>
  <p>Installer le patch, c'est décompresser le .zip dans le dossier du jeu (là où se trouve l'exécutable). Le jeu le détecte tout seul. Sur Mac, le dossier du jeu est dans l'application ; si tu publies pour Mac, explique-le dans les instructions.</p>
  <div class="man-note"><strong>Règles des boutiques :</strong> avant de publier sur Steam ou une autre boutique, vérifie ses règles sur le contenu ajouté en dehors de la boutique.</div>
</section>

<section id="settings">
  <h2>{{settings}} de l'éditeur</h2>
  <ul>
    <li><strong>{{theme}} :</strong> <em>{{theme_dark}}, {{theme_light}}, {{theme_oled}}</em> ou <em>{{theme_custom}}</em>. Avec le thème personnalisé, <em>{{custom_theme_edit}}</em> ouvre un éditeur où tu choisis les couleurs de l'interface et du code ; les changements s'affichent aussitôt. <em>{{custom_theme_reset}}</em> revient aux couleurs initiales et <em>{{cancel}}</em> annule les changements.</li>
    <li><strong>{{language}} :</strong> espagnol, anglais, allemand, français, italien, portugais, russe, chinois simplifié, chinois traditionnel et japonais.</li>
    <li><strong>{{spellcheck}} :</strong> les langues dans lesquelles les textes de l'histoire sont vérifiés.</li>
    <li><strong>Ren'Py :</strong> l'installation utilisée, et le bouton pour la changer ou en installer une autre.</li>
    <li><strong>{{projects_dir}} :</strong> où sont créés les nouveaux projets.</li>
    <li><strong>{{claude_connection}} :</strong> voir la section suivante.</li>
  </ul>
</section>

<section id="claude">
  <h2>{{claude_connection}}</h2>
  <p>Si tu utilises <strong>Claude Code</strong> ou <strong>Claude Desktop</strong>, tu peux le connecter à l'éditeur et lui poser des questions sur ton roman avec tes propres mots : « quels choix y a-t-il au jour 2 ? », « montre-moi le début de cette scène », « ajoute une option à ce choix »… Cela fonctionne avec ton propre compte Claude, tant que l'éditeur est ouvert.</p>
  <h3>L'activer</h3>
  <ol>
    <li>Dans <strong>{{settings}} → {{claude_connection}}</strong>, coche <em>{{claude_enable}}</em>. Elle est désactivée par défaut.</li>
    <li><strong>Claude Code :</strong> clique sur <em>{{claude_copy_command}}</em> et exécute-la une fois dans un terminal.</li>
    <li><strong>Claude Desktop :</strong> clique sur <em>{{claude_desktop_add}}</em> (l'éditeur garde d'abord une copie de sa configuration) et redémarre Claude Desktop.</li>
  </ol>
  <p>L'état indique si Claude est connecté et combien de requêtes il a faites. La connexion n'accepte que les programmes de ton propre ordinateur qui ont la clé. <em>{{claude_new_key}}</em> invalide l'ancienne (il faudra relancer la commande de Claude Code) et <em>{{claude_port}}</em> te permet de changer de port si un autre programme utilise le même.</p>
  <h3>Ce que Claude peut faire</h3>
  <ul>
    <li><strong>Consulter :</strong> le projet, la carte de l'histoire, le code de n'importe quel label ou fichier, les personnages, images et sons, les variables, les réglages de l'interface et une vérification des problèmes (sauts vers des labels inexistants, images ou sons manquants…).</li>
    <li><strong>Modifier :</strong> écrire ou modifier des labels et fichiers, ajouter des personnages, décors, illustrations et variables, et changer l'interface ou le nom et la version du jeu.</li>
    <li><strong>Voir et montrer :</strong> obtenir une image de n'importe quel moment d'une scène, ouvrir un label dans l'éditeur ou sur la carte, et lancer le jeu.</li>
  </ul>
  <h3>Modifications de Claude et annulation</h3>
  <p>Avant chaque modification, l'éditeur garde une copie des fichiers concernés et la note dans <strong>{{claude_changes}}</strong> (dans la même section des {{settings}}). De là, tu peux <strong>annuler</strong> n'importe quelle modification ; si le fichier a été modifié ensuite, il te prévient d'abord. Une notification apparaît à chaque modification de Claude, et s'il modifie le label ouvert, l'éditeur le recharge (ou te demande quelle version garder si tu avais des modifications non enregistrées).</p>
</section>

<section id="files">
  <h2>Fichiers créés par l'éditeur</h2>
  <table>
    <tr><th>Fichier ou dossier</th><th>À quoi il sert</th></tr>
    <tr><td><code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code></td><td>Déclarations des personnages et des images</td></tr>
    <tr><td><code>animations.rpy</code>, <code>positions.rpy</code>, <code>audio.rpy</code></td><td>Animations, positions et audio</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> et son <code>.rpy</code></td><td>Le menu principal personnalisé</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>Les images d'origine de l'interface avant tes changements</td></tr>
    <tr><td><code>fonts/</code></td><td>Les polices ajoutées, avec leur licence</td></tr>
    <tr><td><code>patch_support.rpy</code>, <code>patch/</code>, <code>images/patch/</code></td><td>Le patch (si activé)</td></tr>
    <tr><td><code>.renpy-editor/</code> (à côté de <code>game</code>)</td><td>Réglages du patch et copies des modifications de Claude. Non inclus dans le jeu.</td></tr>
  </table>
</section>

<section id="report">
  <h2>{{report_title}}</h2>
  <p>Si quelque chose ne marche pas ou te manque, clique sur <strong>{{report_button}}</strong> dans la barre latérale. Ton message arrive directement à l'auteur de l'éditeur.</p>
  <ul>
    <li>Choisis <strong>{{report_kind_bug}}</strong> ou <strong>{{report_kind_idea}}</strong>, donne un titre et explique en détail. Pour un problème, il est très utile de dire ce que tu faisais, ce que tu attendais et ce qui s'est passé.</li>
    <li><strong>{{report_email}}</strong> : seulement pour pouvoir te répondre.</li>
    <li><strong>{{report_tech}}</strong> ajoute la version de l'éditeur, le système et la langue. Avant l'envoi, tu vois exactement ce qui est inclus ; ton roman et tes fichiers ne sont jamais envoyés.</li>
    <li><strong>{{report_via}}</strong> <em>{{report_via_email}}</em>, il arrive directement à l'auteur, sans compte. Si tu préfères GitHub, choisis <em>{{report_via_github}}</em> : une issue publique déjà remplie s'ouvre dans le navigateur, et tu la publies avec ton compte.</li>
  </ul>
  <p>Sans connexion, tu peux utiliser <em>{{report_copy}}</em> pour l'envoyer autrement.</p>
</section>

<section id="troubleshooting">
  <h2>Problèmes fréquents</h2>
  <dl>
    <dt>« {{renpy_required_title}} » ou le jeu ne se lance pas</dt>
    <dd>Vérifie dans {{settings}} → Ren'Py que le chemin pointe vers ton <code>renpy.exe</code>, ou utilise <em>{{renpy_change_or_install}}</em>.</dd>
    <dt>Un personnage ou un décor n'apparaît pas dans les sélecteurs</dt>
    <dd>Il doit être déclaré dans la fenêtre <a href="#declarations">{{declarations}}</a> (ou dans les fichiers de déclarations de l'éditeur).</dd>
    <dt>L'aperçu affiche un cadre avec le nom d'une image</dt>
    <dd>Cette image n'est pas déclarée ou son fichier n'existe pas. La carte et la vérification de Claude aident aussi à trouver ces cas.</dd>
    <dt>Je ne trouve pas une police installée</dt>
    <dd>Seules les polices sous licence libre apparaissent, car elles sont copiées dans le jeu. Cherches-en une semblable dans Google Fonts.</dd>
    <dt>J'ai perdu des modifications d'un label</dt>
    <dd>{{save_to_file}} remplace le contenu du label cible. Si c'est Claude qui l'a modifié, tu peux annuler dans <em>{{claude_changes}}</em>.</dd>
  </dl>
</section>
`
};
