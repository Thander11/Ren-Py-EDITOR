// Ren'Py EDITOR — Manual de uso (português do Brasil). {{key}} = texto da interface
(window.MANUALS = window.MANUALS || {})['pt-BR'] = {
  title: 'Manual do Ren\'Py EDITOR',
  search: 'Buscar no manual',
  contents: 'Sumário',
  noResults: 'Nenhuma seção contém esse texto.',
  html: `
<section id="intro">
  <h2>Boas-vindas</h2>
  <p>O Ren'Py EDITOR é um editor visual para criar visual novels com o <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a>. Em vez de escrever todo o código à mão, você monta cada cena com <strong>blocos</strong> (diálogos, trocas de fundo, personagens que entram e saem, escolhas…) e o editor escreve o código do Ren'Py para você. O código fica sempre à vista se você quiser, e dá para editá-lo diretamente.</p>
  <p>O editor trabalha com os arquivos do seu projeto do Ren'Py: o que você salva aqui é um projeto normal, que também pode ser aberto no launcher do Ren'Py ou em qualquer editor de texto.</p>
  <div class="man-note"><strong>Palavras do código.</strong> Os nomes que vêm do código do Ren'Py (<code>label</code>, <code>jump</code>, <code>call</code>, <code>Solid</code>…) continuam iguais em todos os idiomas, para coincidirem com o que você vê no código.</div>
</section>

<section id="start">
  <h2>Primeiros passos</h2>
  <h3>O que você precisa</h3>
  <p>Para <strong>testar o jogo</strong>, <strong>criar projetos novos</strong> e <strong>compilar</strong>, é preciso ter o Ren'Py (o SDK) no computador. Se o editor não o encontrar, ele oferece três opções:</p>
  <ul>
    <li><strong>{{renpy_install_auto}}:</strong> baixa a versão mais recente em renpy.org (cerca de 160 MB), verifica se o arquivo não está danificado e instala na pasta que você escolher.</li>
    <li><strong>{{renpy_go_website}}</strong> para baixar você mesmo.</li>
    <li><strong>{{renpy_select_existing}}:</strong> você escolhe o arquivo <code>renpy.exe</code> da sua instalação.</li>
  </ul>
  <p>Dá para mudar isso quando quiser em <a href="#settings">{{settings}}</a> → Ren'Py → <em>{{renpy_change_or_install}}</em>.</p>
  <h3>A tela principal</h3>
  <ul>
    <li><strong>Barra lateral (esquerda):</strong> as seções do editor (<em>{{map_button}}, {{nav_scenes}}, {{declarations}}, {{main_menu_button}}, {{gui_editor_title}}</em>), as ações do projeto (<em>{{open_project}}, {{new_project}}, {{game_settings}}, {{build_game}}</em>) e, embaixo, <em>{{launch_project}}</em>, este <em>{{manual}}</em> e as <em>{{settings}}</em> do editor. Logo abaixo aparece a pasta do projeto aberto.</li>
    <li><strong>Cabeçalho:</strong> o arquivo <code>.rpy</code> ativo, o <em>{{target_label}}</em>, o menu <em>{{panels_show}}</em> para escolher os painéis, <em>{{clear_all}}</em> e <em>{{save_to_file}}</em>.</li>
    <li><strong>Área de trabalho:</strong> a lista de arquivos, a paleta de blocos, a lista de blocos da cena, a pré-visualização da cena e a do código.</li>
  </ul>
  <div class="man-tip"><strong>Dica:</strong> aperte <kbd>F1</kbd> a qualquer momento para abrir este manual.</div>
</section>

<section id="projects">
  <h2>Projetos</h2>
  <h3>Abrir um projeto</h3>
  <p>Clique em <strong>{{open_project}}</strong> e escolha a pasta do seu jogo (a que contém a pasta <code>game</code>) ou diretamente a pasta <code>game</code>. O editor lembra o último projeto e o abre sozinho da próxima vez.</p>
  <p>Ao abrir, o editor cria o que precisa se não existir: as pastas <code>audio</code>, <code>images/characters</code>, <code>images/backgrounds</code>, <code>images/scenes</code> e <code>images/expressions</code>, e os arquivos onde guarda as declarações (<code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code>, <code>animations.rpy</code>, <code>positions.rpy</code> e <code>audio.rpy</code>). Ele não mexe nos seus outros arquivos.</p>
  <p>Se houver imagens declaradas em pastas com outros nomes, o editor pergunta se deve movê-las para as pastas em inglês e atualizar os caminhos nos <code>.rpy</code>. Você pode recusar.</p>
  <h3>Criar um projeto novo</h3>
  <p>Clique em <strong>{{new_project}}</strong>, digite um nome, escolha a <strong>resolução</strong> (1920×1080 é um bom meio-termo) e as <strong>cores da interface</strong> do jogo. O projeto é criado com o Ren'Py na sua <em>{{projects_dir}}</em> (se ela não estiver definida, o editor pede) e é aberto automaticamente.</p>
  <h3>Mudanças feitas fora do editor</h3>
  <p>Se você editar um <code>.rpy</code> em outro programa (ou o Claude alterá-lo, veja <a href="#claude">{{claude_connection}}</a>), o editor percebe e recarrega os dados do projeto.</p>
</section>

<section id="declarations">
  <h2>{{declarations}}: personagens, imagens e mais</h2>
  <p>A janela <strong>{{declarations}}</strong> reúne tudo o que a história usa: personagens, suas imagens, fundos… O que você adiciona aqui aparece depois nos seletores dos blocos. Ela tem estas abas:</p>
  <ul>
    <li><strong>{{tab_characters}}:</strong> cada personagem tem um <em>{{char_id}}</em> (o usado no código), um <em>{{char_name}}</em>, a cor do nome e a etiqueta das suas expressões.</li>
    <li><strong>{{tab_sprites}}:</strong> as imagens de cada personagem, organizadas por tipo (por exemplo, uma roupa). O nome segue o padrão <code>personagem_tipo_identificação</code> (ex.: <code>Ryu_hunter_1</code>). Você pode adicionar imagens avulsas ou usar <em>{{add_batch}}</em> para adicionar muitas de uma vez.</li>
    <li><strong>{{tab_expressions}}:</strong> os rostos laterais (side images) que acompanham o diálogo.</li>
    <li><strong>{{tab_backgrounds}}</strong> e <strong>{{tab_scenes}}:</strong> os fundos de cada lugar e as ilustrações (CG) de momentos específicos.</li>
    <li><strong>{{tab_animations}}</strong> e <strong>{{tab_positions}}:</strong> os <code>transform</code> e as posições que podem ser usados ao mostrar personagens.</li>
  </ul>
  <p>Ao excluir algo, o editor pergunta se deve apagar também o arquivo de imagem ou mantê-lo.</p>
</section>

<section id="scenes">
  <h2>{{nav_scenes}}: o editor de blocos</h2>
  <p>É a seção principal. Uma cena é um <code>label</code> do Ren'Py, e seu conteúdo é uma lista de blocos.</p>
  <h3>Arquivos e label de destino</h3>
  <ul>
    <li>No painel <strong>{{panel_files}}</strong> você escolhe o arquivo <code>.rpy</code> ativo. <strong>+</strong> cria um arquivo novo.</li>
    <li>Em <strong>{{target_label}}</strong> você escolhe qual label editar: o editor carrega seus blocos. Se escolher <em>{{end_of_file}}</em>, o que você salvar será adicionado ao fim do arquivo como algo novo.</li>
  </ul>
  <h3>Adicionar e organizar blocos</h3>
  <p>A paleta <strong>{{palette_title}}</strong> agrupa os blocos por cor: <em>{{block_group_text}}, {{block_group_scene}}, {{block_group_flow}}, {{block_group_audio}}, {{block_group_advanced}}</em> (e <em>{{block_group_patch}}</em> se você o ativou). Clicar em um abre seu formulário; o bloco novo entra <strong>abaixo do bloco selecionado</strong>.</p>
  <p>Clique em um bloco para selecioná-lo: aparecem suas ações (<em>{{btn_edit}}, {{btn_duplicate}}, {{btn_duplicate_end}}, {{btn_move_up}}, {{btn_move_down}}, {{btn_delete}}</em>) e a pré-visualização mostra a cena naquele momento. Clique duas vezes para editá-lo. Você também pode arrastar os blocos para reordená-los.</p>
  <table>
    <tr><th>Tecla</th><th>Ação</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Selecionar o bloco anterior ou o seguinte</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>Subir ou descer o bloco</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>Editar o bloco</td></tr>
    <tr><td><kbd>Delete</kbd></td><td>Excluir o bloco (pede confirmação)</td></tr>
  </table>
  <h3>Salvar</h3>
  <p><strong>{{save_to_file}}</strong> grava os blocos no arquivo ativo: se houver um label de destino, <strong>substitui todo o seu conteúdo</strong> (após confirmar); senão, adiciona ao fim. <strong>{{clear_all}}</strong> esvazia a lista de blocos sem mexer no arquivo.</p>
  <p>Se você tiver alterações não salvas e trocar de label ou de arquivo, o editor avisa antes de descartá-las.</p>
  <h3>Painéis</h3>
  <p>Com <strong>{{panels_show}}</strong> você escolhe quais painéis ver: <em>{{panel_files}}, {{panel_palette}}, {{panel_preview}}</em> e <em>{{panel_code}}</em>. Dá para mudar o tamanho arrastando as bordas; um clique duplo na borda volta ao tamanho inicial. O editor lembra a sua disposição.</p>
</section>

<section id="blocks">
  <h2>Tipos de bloco</h2>
  <h3>{{block_group_text}}</h3>
  <ul>
    <li><strong>{{block_dialogue}}:</strong> o que um personagem diz. Você pode escolher uma <em>expressão</em> lateral para esse momento e marcá-lo como <em>pensamento</em> (aparece em itálico entre &lt;&lt; &gt;&gt;).</li>
    <li><strong>{{block_narration}}:</strong> texto do narrador, sem nome.</li>
  </ul>
  <h3>{{block_group_scene}}</h3>
  <ul>
    <li><strong>{{block_scene}}:</strong> mostra um fundo ou uma ilustração (<code>scene</code>) e tira todos os personagens. Dá para adicionar uma transição (<code>with</code>) e desfocar a imagem.</li>
    <li><strong>{{block_show}}:</strong> faz um personagem aparecer (<code>show</code>). Você escolhe a imagem, a posição ou animação (<code>at</code>), a transição, se fica atrás de outra imagem (<code>behind</code>), se é espelhado (<code>xflip</code>) ou desfocado.</li>
    <li><strong>{{block_show_multi}}:</strong> vários personagens ao mesmo tempo, com uma transição em conjunto.</li>
    <li><strong>{{block_hide}}</strong> e <strong>{{block_hide_multi}}:</strong> tiram personagens da tela (<code>hide</code>). O editor sugere os que estão na tela de acordo com os blocos anteriores.</li>
    <li><strong>{{block_solid}}:</strong> uma camada de cor sólida (por exemplo, um fade para preto ou um tom), com sua opacidade.</li>
  </ul>
  <h3>{{block_group_flow}}</h3>
  <ul>
    <li><strong>{{block_menu}}:</strong> um menu de opções (<code>menu</code>). Cada opção pode saltar para um label (<code>jump</code>), chamá-lo (<code>call</code>), executar código ou conter seus próprios blocos. Você pode mostrar um personagem ao lado das opções e colocá-las à esquerda como um balão de pensamento.</li>
    <li><strong>{{block_condition}}:</strong> blocos que só rodam se uma condição for verdadeira (<code>if</code>), com <code>elif</code> e <code>else</code> opcionais. Exemplo: <code>amizade &gt;= 3 and not confessou</code>.</li>
    <li><strong>{{block_jump}}:</strong> salta para outro label e não volta.</li>
    <li><strong>{{block_call}}:</strong> vai para outro label e, quando ele termina com <code>return</code>, volta para cá. Útil para partes que se repetem em vários lugares.</li>
    <li><strong>{{block_label}}:</strong> cria um label novo, logo depois ou no fim do arquivo.</li>
    <li><strong>{{block_pause}}:</strong> espera alguns segundos ou, se ficar vazio, até o jogador clicar.</li>
  </ul>
  <h3>{{block_group_audio}}</h3>
  <ul>
    <li><strong>{{block_music}}:</strong> tocar (<code>play</code>), enfileirar (<code>queue</code>) ou parar (<code>stop</code>) a música, em loop ou não. Dá para ouvir os arquivos de <code>game/audio</code> antes de escolher.</li>
  </ul>
  <h3>{{block_group_advanced}}</h3>
  <ul>
    <li><strong>{{block_comment}}:</strong> uma anotação para você que não aparece no jogo.</li>
    <li><strong>{{block_custom}}:</strong> qualquer código do Ren'Py que não tenha um bloco próprio.</li>
  </ul>
  <h3>Blocos dentro de blocos</h3>
  <p>As opções de uma <em>{{block_menu}}</em> e os ramos de uma <em>{{block_condition}}</em> podem conter outros blocos. O formulário deles tem uma fileira de botões para adicioná-los e uma lista para editar, reordenar ou excluir.</p>
</section>

<section id="preview">
  <h2>{{scene_preview}} e {{code_preview}}</h2>
  <h3>{{scene_preview}}</h3>
  <p>Mostra como a cena fica no bloco selecionado: fundo, personagens nas suas posições, caixa de diálogo com nome e texto, ou as opções de uma escolha. Usa a resolução, as cores, as fontes e os tamanhos do seu <code>gui.rpy</code>, então fica muito parecida com o jogo. Não reproduz transições nem animações.</p>
  <p>Arraste a borda de baixo para deixá-la mais alta ou mais baixa.</p>
  <h3>{{code_preview}}</h3>
  <p>Mostra o código do Ren'Py que seus blocos geram. Você pode <strong>editá-lo diretamente</strong>: os blocos acompanham o que você digita. <kbd>Ctrl</kbd>+<kbd>Z</kbd> desfaz e <kbd>Ctrl</kbd>+<kbd>Y</kbd> refaz. <em>{{copy_code}}</em> copia para a área de transferência e <em>{{export}}</em> salva em um arquivo separado.</p>
  <div class="man-tip"><strong>{{spellcheck}}:</strong> se você o ativar nas {{settings}}, os erros de digitação nos textos da história ficam sublinhados. Clique com o botão direito numa palavra para ver sugestões ou adicioná-la ao dicionário.</div>
</section>

<section id="map">
  <h2>{{map_title}}</h2>
  <p>O <strong>{{map_button}}</strong> mostra todas as cenas (labels) como cartões conectados, para ver de relance como a história avança e aonde cada escolha leva.</p>
  <ul>
    <li>Cada cartão mostra o nome do label, uma miniatura do fundo, um resumo (a primeira fala, ou o comentário escrito depois de <code>label nome:</code>), quantos personagens e escolhas tem e o seu tamanho.</li>
    <li>As linhas indicam <strong>{{map_legend_jump}}</strong> (contínua), <strong>{{map_legend_call}}</strong> (tracejada) e <strong>{{map_legend_choice}}</strong>, com o texto da opção e a condição, se houver.</li>
    <li>Selos: <strong>{{map_badge_start}}</strong> (o label <code>start</code>), <strong>{{map_badge_ending}}</strong> (termina o jogo), <strong>{{map_badge_missing}}</strong> (há saltos para um label que ainda não foi escrito) e <strong>{{map_badge_unreachable}}</strong> (nada leva a essa cena). Cenas com conteúdo do patch têm a marca <em>{{map_patch}}</em>.</li>
    <li>Labels com parâmetros (rotinas auxiliares) não aparecem, para não encher o mapa.</li>
  </ul>
  <h3>Navegar</h3>
  <p>Arraste para se mover e use a roda do mouse (ou <em>{{map_zoom_in}}, {{map_zoom_out}}</em> e <em>{{map_fit}}</em>) para o zoom.</p>
  <h3>Painel lateral</h3>
  <ul>
    <li><strong>{{map_tab_scene}}:</strong> clique num cartão para ver o arquivo, para quais cenas ele leva e de quais se chega a ele, seus personagens e suas escolhas com o efeito de cada opção. <em>{{map_open}}</em> a carrega no editor de cenas.</li>
    <li><strong>{{map_tab_vars}}:</strong> as variáveis da história, o valor inicial, onde mudam e onde são consultadas. Clicar numa variável destaca essas cenas no mapa. Se uma variável não tiver valor inicial, o editor recomenda adicionar um <code>default</code>.</li>
  </ul>
</section>

<section id="main-menu">
  <h2>{{main_menu_button}}</h2>
  <p>Monte o menu principal do jogo sem escrever código. Ative <strong>{{mm_enabled}}</strong> e ajuste:</p>
  <ul>
    <li><strong>Fundo:</strong> o original do projeto, uma cor, uma imagem, um GIF animado (o editor extrai os quadros, porque o Ren'Py não reproduz GIF) ou um vídeo (recomendado WebM).</li>
    <li><strong>Camada superior:</strong> o painel lateral escuro do menu original e um escurecimento do fundo.</li>
    <li><strong>Título</strong> e <strong>versão:</strong> texto, tamanho, fonte, cor, contorno e posição.</li>
    <li><strong>Botões:</strong> quais aparecem ({{mm_btn_start}}, {{mm_btn_load}}, {{mm_btn_preferences}}, {{mm_btn_about}}, {{mm_btn_help}}, {{mm_btn_quit}}), disposição vertical ou horizontal, alinhamento, espaçamento, cores e fundo. Cada botão pode ser texto, imagem ou texto sobre uma imagem de fundo, e pode ter uma <em>posição própria</em>.</li>
    <li>A <strong>música</strong> do menu, da pasta <code>game/audio</code>.</li>
  </ul>
  <p>Na pré-visualização você pode <strong>arrastar</strong> o título e os botões para posicioná-los. <em>{{mm_save}}</em> grava no projeto, <em>{{mm_test}}</em> abre o jogo, <em>{{mm_reset}}</em> volta aos valores iniciais e <em>{{discard_changes}}</em> descarta o que não foi salvo.</p>
  <h3>Fontes</h3>
  <p>As fontes são copiadas para dentro do jogo, por isso só aparecem as que têm uma <strong>licença livre</strong> que permite distribuí-las. A maioria das fontes do sistema (Arial, Calibri…) não permite. Use <em>{{mm_fonts_get_free}}</em> para conseguir mais.</p>
</section>

<section id="gui">
  <h2>{{gui_editor_title}}</h2>
  <p>Mude a aparência da interface do jogo (o que o <code>gui.rpy</code> define) vendo o resultado na hora. A pré-visualização tem três abas: <strong>{{gui_tab_dialogue}}</strong>, <strong>{{gui_tab_choice}}</strong> e <strong>{{gui_tab_menu}}</strong>; os ajustes à esquerda acompanham a aba.</p>
  <ul>
    <li><strong>{{gui_section_text}}:</strong> fontes e tamanhos do diálogo, dos nomes e dos menus; cores; cor de destaque; <em>{{gui_cps}}</em> (letras por segundo; 0 = tudo de uma vez).</li>
    <li><strong>{{gui_section_textbox}}</strong> e <strong>{{gui_section_name}}:</strong> altura, posição e largura do texto, alinhamento e a caixa do nome.</li>
    <li><strong>{{gui_section_choice}}</strong> e <strong>{{gui_section_menu}}:</strong> tamanhos, cores (normal, ao passar o mouse e selecionado) e fundos.</li>
  </ul>
  <p>Para cada imagem (caixa de diálogo, caixa do nome, botões, fundo dos menus) você escolhe entre <strong>{{gui_image_keep}}</strong> (a que o projeto já tem), <strong>{{gui_image_own}}</strong> ou <strong>{{gui_image_generated}}</strong> (o editor a desenha com a cor, opacidade, cantos arredondados e margem que você escolher). Antes de trocar uma imagem pela primeira vez, ele guarda a original em <code>gui/editor_backup</code>.</p>
  <p>Na pré-visualização você pode <strong>arrastar</strong> a caixa de diálogo, o nome e os botões para movê-los e mudar seu tamanho.</p>
  <h3>Google Fonts</h3>
  <p><em>{{gfonts_open}}</em> abre um catálogo de fontes com licença SIL Open Font License, que você pode usar e distribuir com o seu jogo. Ao adicionar uma, ela é baixada para a pasta <code>fonts</code> do projeto junto com a licença. Também dá para adicionar uma fonte a partir de um arquivo.</p>
  <p><em>{{save}}</em> grava só os valores alterados; <em>{{discard_changes}}</em> descarta o que não foi salvo.</p>
</section>

<section id="game-settings">
  <h2>{{game_settings}}</h2>
  <h3>{{game_tab_general}}</h3>
  <ul>
    <li><strong>{{game_name}}</strong> e <strong>{{game_version}}</strong> (<code>config.name</code> e <code>config.version</code>).</li>
    <li><strong>{{game_build_name}}</strong> (<code>build.name</code>): sem espaços nem acentos; é usado nos arquivos que a compilação cria. Acompanha o nome do jogo até você mudá-lo à mão.</li>
    <li><strong>{{game_icon}}:</strong> escolha uma imagem (de preferência quadrada, 512×512 ou maior) e o editor cria o ícone da janela e os ícones do Windows (<code>icon.ico</code>) e do Mac (<code>icon.icns</code>).</li>
  </ul>
  <p>A pasta dos jogos salvos não muda quando o nome muda, para os jogadores não perderem o progresso ao atualizar o jogo.</p>
  <h3>{{patch}}</h3>
  <p>Veja <a href="#patch">Patches</a>.</p>
</section>

<section id="build">
  <h2>{{build_game}}</h2>
  <p><strong>{{build_game}}</strong> cria os arquivos que outras pessoas podem baixar e jogar sem ter o Ren'Py. Escolha os sistemas:</p>
  <ul>
    <li><strong>{{build_pkg_win}}</strong> (.zip), <strong>{{build_pkg_linux}}</strong> (.tar.bz2) e <strong>{{build_pkg_mac}}</strong> (aplicativo compactado em .zip).</li>
    <li><strong>{{build_pkg_pc}}:</strong> um único .zip para os dois.</li>
    <li><strong>{{build_pkg_market}}:</strong> um .zip com os três sistemas, pronto para enviar a uma loja.</li>
  </ul>
  <p>Escolha a pasta de destino e clique em <em>{{build_start}}</em>. Você verá o progresso; pode esconder a janela enquanto isso (ela avisa quando terminar) ou parar. No fim, <em>{{build_open_folder}}</em> leva aos arquivos.</p>
  <p>Se a sua novel tem um patch, aqui você também escolhe qual versão compilar (veja <a href="#patch">Patches</a>).</p>
  <h3>Testar o jogo</h3>
  <p><strong>{{launch_project}}</strong>, na barra lateral, abre a sua novel no Ren'Py do jeito que está salva. Se houver erros no código, o Ren'Py os mostra ao iniciar.</p>
</section>

<section id="patch">
  <h2>Patches</h2>
  <p>Algumas novels são publicadas em lojas como a Steam sem parte do conteúdo, e o autor oferece esse conteúdo no próprio site como um <strong>patch</strong> que os jogadores adicionam ao jogo. O editor prepara tudo para você.</p>
  <h3>1. Ativar o patch</h3>
  <p>Em <strong>{{game_settings}} → {{patch}}</strong>, ative <em>{{patch_enable}}</em>, dê um nome e escreva as instruções para os jogadores (elas vão dentro do patch como arquivo de texto). À direita você vê o que o patch inclui e possíveis problemas.</p>
  <h3>2. Marcar o conteúdo do patch</h3>
  <ul>
    <li><strong>Bloco "{{block_patch}}"</strong> (grupo <em>{{block_group_patch}}</em> da paleta). Ele tem duas partes:
      <ul>
        <li><strong>{{patch_with}}:</strong> os blocos que só quem tem o patch vê. Ficam guardados à parte, em <code>game/patch/</code>.</li>
        <li><strong>{{patch_without}}:</strong> o que vê quem joga sem ele (por exemplo, na Steam). Pode ficar vazio: aí a história simplesmente continua.</li>
      </ul>
      Para salvar conteúdo do patch, a cena precisa ter um <em>{{target_label}}</em>.</li>
    <li><strong>Imagens:</strong> com <em>{{patch_choose_images}}</em> você marca as que vão só no patch. O editor as move para <code>images/patch/</code> junto com a declaração. Desmarcar as devolve ao jogo.</li>
  </ul>
  <p>Na pré-visualização da cena aparece o seletor <strong>{{patch_without}} / {{patch_with}}</strong> para ver as duas versões, e no mapa as cenas com conteúdo do patch têm a sua marca.</p>
  <h3>3. Compilar</h3>
  <p>Em <strong>{{build_game}}</strong> você escolhe:</p>
  <ul>
    <li><strong>{{build_patch_split}}:</strong> para a Steam. O jogo sai sem o conteúdo do patch (nem mesmo bloqueado) e o patch num .zip separado, com o conteúdo empacotado e sem código legível, mais as instruções.</li>
    <li><strong>{{build_patch_full}}:</strong> tudo num só jogo, para o seu site ou itch.io.</li>
    <li><strong>{{build_patch_base}}:</strong> para enviar uma atualização quando o patch não mudou.</li>
  </ul>
  <p>Antes de compilar, o editor confere se nada no jogo depende do patch: por exemplo, uma imagem do patch usada também numa cena normal, ou um salto para uma cena que só existe no patch.</p>
  <h3>Para os jogadores</h3>
  <p>Instalar o patch é descompactar o .zip dentro da pasta do jogo (onde fica o executável). O jogo o detecta sozinho. No Mac, a pasta do jogo fica dentro do aplicativo; se você publicar para Mac, explique isso nas instruções.</p>
  <div class="man-note"><strong>Regras das lojas:</strong> antes de publicar na Steam ou em outra loja, confira as regras dela sobre conteúdo adicionado fora da loja.</div>
</section>

<section id="settings">
  <h2>{{settings}} do editor</h2>
  <ul>
    <li><strong>{{theme}}:</strong> <em>{{theme_dark}}, {{theme_light}}, {{theme_oled}}</em> ou <em>{{theme_custom}}</em>. No personalizado, <em>{{custom_theme_edit}}</em> abre um editor onde você escolhe as cores da interface e do código; as mudanças aparecem na hora. <em>{{custom_theme_reset}}</em> volta às cores iniciais e <em>{{cancel}}</em> descarta as mudanças.</li>
    <li><strong>{{language}}:</strong> espanhol, inglês, alemão, francês, italiano, português, russo, chinês simplificado, chinês tradicional e japonês.</li>
    <li><strong>{{spellcheck}}:</strong> os idiomas em que os textos da história são revisados.</li>
    <li><strong>Ren'Py:</strong> qual instalação é usada, e o botão para trocá-la ou instalar outra.</li>
    <li><strong>{{projects_dir}}:</strong> onde os projetos novos são criados.</li>
    <li><strong>{{claude_connection}}:</strong> veja a próxima seção.</li>
  </ul>
</section>

<section id="claude">
  <h2>{{claude_connection}}</h2>
  <p>Se você usa o <strong>Claude Code</strong> ou o <strong>Claude Desktop</strong>, pode conectá-lo ao editor e pedir coisas sobre a sua novel com suas próprias palavras: "quais escolhas existem no dia 2?", "mostre como fica o começo desta cena", "adicione uma opção nesta escolha"… Funciona com a sua própria conta do Claude, enquanto o editor estiver aberto.</p>
  <h3>Ativar</h3>
  <ol>
    <li>Em <strong>{{settings}} → {{claude_connection}}</strong>, marque <em>{{claude_enable}}</em>. Ela vem desativada.</li>
    <li><strong>Claude Code:</strong> clique em <em>{{claude_copy_command}}</em> e execute-o uma vez num terminal.</li>
    <li><strong>Claude Desktop:</strong> clique em <em>{{claude_desktop_add}}</em> (o editor faz antes uma cópia da configuração dele) e reinicie o Claude Desktop.</li>
  </ol>
  <p>O status mostra se o Claude está conectado e quantas consultas fez. A conexão só aceita programas do seu próprio computador que tenham a chave. <em>{{claude_new_key}}</em> invalida a anterior (será preciso executar de novo o comando do Claude Code) e <em>{{claude_port}}</em> permite trocar a porta se outro programa usar a mesma.</p>
  <h3>O que o Claude pode fazer</h3>
  <ul>
    <li><strong>Consultar:</strong> o projeto, o mapa da história, o código de qualquer label ou arquivo, personagens, imagens e áudio, variáveis, ajustes da interface e uma verificação de problemas (saltos para labels que não existem, imagens ou áudios que faltam…).</li>
    <li><strong>Alterar:</strong> escrever ou editar labels e arquivos, adicionar personagens, fundos, ilustrações e variáveis, e mudar a interface ou o nome e a versão do jogo.</li>
    <li><strong>Ver e mostrar:</strong> obter uma imagem de qualquer momento de uma cena, abrir um label no editor ou no mapa e iniciar o jogo.</li>
  </ul>
  <h3>Alterações do Claude e desfazer</h3>
  <p>Antes de cada alteração, o editor faz uma cópia dos arquivos afetados e a registra em <strong>{{claude_changes}}</strong> (na mesma seção das {{settings}}). De lá você pode <strong>desfazer</strong> qualquer alteração; se o arquivo foi modificado depois, ele avisa antes. Toda vez que o Claude muda algo aparece um aviso, e se ele mudar o label que você tem aberto, o editor o recarrega (ou pergunta qual versão você quer, se você tinha alterações não salvas).</p>
</section>

<section id="files">
  <h2>Arquivos que o editor cria</h2>
  <table>
    <tr><th>Arquivo ou pasta</th><th>Para que serve</th></tr>
    <tr><td><code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code></td><td>Declarações de personagens e imagens</td></tr>
    <tr><td><code>animations.rpy</code>, <code>positions.rpy</code>, <code>audio.rpy</code></td><td>Animações, posições e áudio</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> e o seu <code>.rpy</code></td><td>O menu principal personalizado</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>As imagens originais da interface antes das suas mudanças</td></tr>
    <tr><td><code>fonts/</code></td><td>As fontes que você adiciona, com a licença</td></tr>
    <tr><td><code>patch_support.rpy</code>, <code>patch/</code>, <code>images/patch/</code></td><td>O patch (se ativado)</td></tr>
    <tr><td><code>.renpy-editor/</code> (ao lado de <code>game</code>)</td><td>Ajustes do patch e cópias das alterações do Claude. Não vai no jogo.</td></tr>
  </table>
</section>

<section id="report">
  <h2>{{report_title}}</h2>
  <p>Se algo não funciona ou você sente falta de algo, clique em <strong>{{report_button}}</strong> na barra lateral. Sua mensagem chega direto ao autor do editor.</p>
  <ul>
    <li>Escolha <strong>{{report_kind_bug}}</strong> ou <strong>{{report_kind_idea}}</strong>, dê um título e conte com detalhes. Num problema, ajuda muito dizer o que você estava fazendo, o que esperava e o que aconteceu.</li>
    <li><strong>{{report_email}}</strong>: serve só para podermos responder.</li>
    <li><strong>{{report_tech}}</strong> adiciona a versão do editor, o sistema e o idioma. Antes de enviar você vê exatamente o que vai junto; sua novel e seus arquivos nunca são enviados.</li>
    <li><strong>{{report_via}}</strong> <em>{{report_via_email}}</em>, chega direto ao autor, sem conta. Se preferir o GitHub, escolha <em>{{report_via_github}}</em>: abre no navegador uma issue pública já preenchida, que você publica com sua conta.</li>
  </ul>
  <p>Sem conexão, você pode usar <em>{{report_copy}}</em> para enviar de outra forma.</p>
</section>

<section id="troubleshooting">
  <h2>Problemas comuns</h2>
  <dl>
    <dt>"{{renpy_required_title}}" ou o jogo não inicia</dt>
    <dd>Confira em {{settings}} → Ren'Py se o caminho aponta para o seu <code>renpy.exe</code>, ou use <em>{{renpy_change_or_install}}</em>.</dd>
    <dt>Um personagem ou fundo não aparece nos seletores</dt>
    <dd>Ele precisa estar declarado na janela <a href="#declarations">{{declarations}}</a> (ou nos arquivos de declarações do editor).</dd>
    <dt>A pré-visualização mostra um quadro com o nome de uma imagem</dt>
    <dd>Essa imagem não está declarada ou o arquivo não existe. O mapa e a verificação do Claude também ajudam a encontrar esses casos.</dd>
    <dt>Não encontro uma fonte instalada</dt>
    <dd>Só aparecem fontes com licença livre, porque elas são copiadas para o jogo. Procure uma parecida no Google Fonts.</dd>
    <dt>Perdi alterações de um label</dt>
    <dd>{{save_to_file}} substitui o conteúdo do label de destino. Se a alteração foi do Claude, dá para desfazer em <em>{{claude_changes}}</em>.</dd>
  </dl>
</section>
`
};
