// Ren'Py EDITOR — ユーザーマニュアル（日本語）。{{key}} = 画面上の表示
(window.MANUALS = window.MANUALS || {}).ja = {
  title: 'Ren\'Py EDITOR マニュアル',
  search: 'マニュアルを検索',
  contents: '目次',
  noResults: 'この文字列を含むセクションはありません。',
  html: `
<section id="intro">
  <h2>はじめに</h2>
  <p>Ren'Py EDITOR は、<a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a> でビジュアルノベルを作るためのビジュアルエディターです。すべてのコードを手で書く代わりに、<strong>ブロック</strong>（セリフ、背景の切り替え、キャラクターの登場と退場、選択肢など）を並べて各シーンを作ると、エディターが Ren'Py のコードを書いてくれます。コードはいつでも表示でき、直接編集することもできます。</p>
  <p>エディターは Ren'Py プロジェクトのファイルをそのまま扱います。ここで保存したものは普通のプロジェクトなので、Ren'Py のランチャーやテキストエディターでも開けます。</p>
  <div class="man-note"><strong>コードの用語。</strong>Ren'Py のコードに由来する名前（<code>label</code>、<code>jump</code>、<code>call</code>、<code>Solid</code> など）は、コードと一致するようにすべての言語で同じ表記にしています。</div>
</section>

<section id="start">
  <h2>最初のステップ</h2>
  <h3>必要なもの</h3>
  <p><strong>ゲームのテスト</strong>、<strong>新しいプロジェクトの作成</strong>、<strong>ビルド</strong>には、パソコンに Ren'Py（SDK）が必要です。エディターが見つけられない場合は、次の 3 つから選べます。</p>
  <ul>
    <li><strong>{{renpy_install_auto}}：</strong>renpy.org から最新版（約 160 MB）をダウンロードし、ファイルが壊れていないか確認してから、選んだフォルダーにインストールします。</li>
    <li><strong>{{renpy_go_website}}</strong>：自分でダウンロードします。</li>
    <li><strong>{{renpy_select_existing}}：</strong>インストール済みの <code>renpy.exe</code> を選びます。</li>
  </ul>
  <p>あとからいつでも <a href="#settings">{{settings}}</a> → Ren'Py → <em>{{renpy_change_or_install}}</em> で変更できます。</p>
  <h3>メイン画面</h3>
  <ul>
    <li><strong>サイドバー（左）：</strong>エディターの各セクション（<em>{{map_button}}、{{nav_scenes}}、{{declarations}}、{{main_menu_button}}、{{gui_editor_title}}</em>）、プロジェクトの操作（<em>{{open_project}}、{{new_project}}、{{game_settings}}、{{build_game}}</em>）、下部に<em>{{launch_project}}</em>、この<em>{{manual}}</em>、エディターの<em>{{settings}}</em>があります。その下に開いているプロジェクトのフォルダーが表示されます。</li>
    <li><strong>ヘッダー：</strong>作業中の <code>.rpy</code> ファイル、<em>{{target_label}}</em>、表示するパネルを選ぶ<em>{{panels_show}}</em>メニュー、<em>{{clear_all}}</em>、<em>{{save_to_file}}</em>。</li>
    <li><strong>作業エリア：</strong>ファイル一覧、ブロックパレット、シーンのブロック一覧、シーンのプレビュー、コードのプレビュー。</li>
  </ul>
  <div class="man-tip"><strong>ヒント：</strong>いつでも <kbd>F1</kbd> を押すとこのマニュアルが開きます。</div>
</section>

<section id="projects">
  <h2>プロジェクト</h2>
  <h3>プロジェクトを開く</h3>
  <p><strong>{{open_project}}</strong>を押し、ゲームのフォルダー（<code>game</code> フォルダーを含むもの）か、<code>game</code> フォルダーそのものを選びます。エディターは最後のプロジェクトを覚えていて、次回は自動で開きます。</p>
  <p>開いたとき、足りないものがあればエディターが作成します。<code>audio</code>、<code>images/characters</code>、<code>images/backgrounds</code>、<code>images/scenes</code>、<code>images/expressions</code> の各フォルダーと、宣言を保存するファイル（<code>characters.rpy</code>、<code>backgrounds.rpy</code>、<code>scenes.rpy</code>、<code>expressions.rpy</code>、<code>animations.rpy</code>、<code>positions.rpy</code>、<code>audio.rpy</code>）です。ほかのファイルには触れません。</p>
  <p>別の名前のフォルダーで宣言された画像がある場合、英語名のフォルダーに移動して <code>.rpy</code> のパスを更新するか確認されます。断ることもできます。</p>
  <h3>新しいプロジェクトを作る</h3>
  <p><strong>{{new_project}}</strong>を押して名前を入力し、<strong>解像度</strong>（1920×1080 がバランスのよい選択です）とゲームの<strong>インターフェースの色</strong>を選びます。プロジェクトは Ren'Py によって<em>{{projects_dir}}</em>に作成され（未設定ならエディターが尋ねます）、自動で開きます。</p>
  <h3>エディター外での変更</h3>
  <p>ほかのプログラムで <code>.rpy</code> を編集した場合（または Claude が変更した場合。<a href="#claude">{{claude_connection}}</a>を参照）、エディターはそれを検知してプロジェクトのデータを読み込み直します。</p>
</section>

<section id="declarations">
  <h2>{{declarations}}：キャラクター、画像など</h2>
  <p><strong>{{declarations}}</strong>ウィンドウには、物語で使うもの（キャラクター、その画像、背景など）がまとまっています。ここで追加したものが、各ブロックの選択リストに表示されます。次のタブがあります。</p>
  <ul>
    <li><strong>{{tab_characters}}：</strong>各キャラクターには「{{char_id}}」（コードで使う名前）、「{{char_name}}」、名前の色、表情のタグがあります。</li>
    <li><strong>{{tab_sprites}}：</strong>キャラクターごとの画像で、種類（衣装など）ごとに整理されています。名前は <code>キャラクター_種類_番号</code>（例：<code>Ryu_hunter_1</code>）です。1 枚ずつ追加するか、<em>{{add_batch}}</em>でまとめて追加できます。</li>
    <li><strong>{{tab_expressions}}：</strong>セリフに添えるサイドイメージ（side image）。</li>
    <li><strong>{{tab_backgrounds}}</strong>と<strong>{{tab_scenes}}：</strong>各場所の背景と、特定の場面のイラスト（CG）。</li>
    <li><strong>{{tab_animations}}</strong>と<strong>{{tab_positions}}：</strong>キャラクターを表示するときに使える <code>transform</code> と位置。</li>
  </ul>
  <p>削除するときは、画像ファイルも削除するか残すかを確認されます。</p>
</section>

<section id="scenes">
  <h2>{{nav_scenes}}：ブロックエディター</h2>
  <p>ここがメインのセクションです。シーンは Ren'Py の <code>label</code> で、その中身はブロックの並びです。</p>
  <h3>ファイルと対象の label</h3>
  <ul>
    <li><strong>{{panel_files}}</strong>パネルで作業中の <code>.rpy</code> ファイルを選びます。<strong>+</strong> で新しいファイルを作れます。</li>
    <li><strong>{{target_label}}</strong>で編集する label を選ぶと、そのブロックが読み込まれます。<em>{{end_of_file}}</em>を選ぶと、保存した内容は新しいものとしてファイルの末尾に追加されます。</li>
  </ul>
  <h3>ブロックの追加と並べ替え</h3>
  <p><strong>{{palette_title}}</strong>パレットでは、ブロックが色ごとにまとめられています：<em>{{block_group_text}}、{{block_group_scene}}、{{block_group_flow}}、{{block_group_audio}}、{{block_group_advanced}}</em>（パッチを有効にしていれば<em>{{block_group_patch}}</em>も）。押すとフォームが開き、新しいブロックは<strong>選択中のブロックの下</strong>に入ります。</p>
  <p>ブロックをクリックすると選択され、操作（<em>{{btn_edit}}、{{btn_duplicate}}、{{btn_duplicate_end}}、{{btn_move_up}}、{{btn_move_down}}、{{btn_delete}}</em>）が表示され、プレビューにその時点のシーンが映ります。ダブルクリックで編集します。ドラッグで並べ替えることもできます。</p>
  <table>
    <tr><th>キー</th><th>操作</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>前または次のブロックを選択</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>ブロックを上下に移動</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>ブロックを編集</td></tr>
    <tr><td><kbd>Delete</kbd></td><td>ブロックを削除（確認あり）</td></tr>
  </table>
  <h3>保存</h3>
  <p><strong>{{save_to_file}}</strong>は、ブロックを作業中のファイルに書き込みます。対象の label があれば<strong>その中身をすべて置き換え</strong>（確認あり）、なければ末尾に追加します。<strong>{{clear_all}}</strong>はファイルに触れずにブロック一覧を空にします。</p>
  <p>未保存の変更があるまま label やファイルを切り替えると、失う前にエディターが知らせます。</p>
  <h3>パネル</h3>
  <p><strong>{{panels_show}}</strong>で表示するパネルを選びます：<em>{{panel_files}}、{{panel_palette}}、{{panel_preview}}</em>、<em>{{panel_code}}</em>。端をドラッグするとサイズを変えられ、端をダブルクリックすると最初のサイズに戻ります。レイアウトは記憶されます。</p>
</section>

<section id="blocks">
  <h2>ブロックの種類</h2>
  <h3>{{block_group_text}}</h3>
  <ul>
    <li><strong>{{block_dialogue}}：</strong>キャラクターのセリフ。その場面のサイドの<em>表情</em>を選んだり、<em>心の声</em>（&lt;&lt; &gt;&gt; に囲まれた斜体）にしたりできます。</li>
    <li><strong>{{block_narration}}：</strong>名前のない地の文。</li>
  </ul>
  <h3>{{block_group_scene}}</h3>
  <ul>
    <li><strong>{{block_scene}}：</strong>背景やイラストを表示し（<code>scene</code>）、キャラクターをすべて消します。トランジション（<code>with</code>）の追加や、ぼかしもできます。</li>
    <li><strong>{{block_show}}：</strong>キャラクターを表示します（<code>show</code>）。画像、位置やアニメーション（<code>at</code>）、トランジション、別の画像の後ろに置くか（<code>behind</code>）、反転（<code>xflip</code>）やぼかしを選べます。</li>
    <li><strong>{{block_show_multi}}：</strong>複数のキャラクターを共通のトランジションで同時に表示します。</li>
    <li><strong>{{block_hide}}</strong>と<strong>{{block_hide_multi}}：</strong>キャラクターを画面から消します（<code>hide</code>）。前のブロックから、今画面にいるキャラクターが候補に出ます。</li>
    <li><strong>{{block_solid}}：</strong>単色のレイヤー（黒へのフェードや色かぶせなど）で、不透明度を設定できます。</li>
  </ul>
  <h3>{{block_group_flow}}</h3>
  <ul>
    <li><strong>{{block_menu}}：</strong>選択肢のメニュー（<code>menu</code>）。各選択肢は label へのジャンプ（<code>jump</code>）、呼び出し（<code>call</code>）、コードの実行、独自のブロックを持つことができます。選択肢の横にキャラクターを表示したり、選択肢を心の声の吹き出しのように左側に置いたりできます。</li>
    <li><strong>{{block_condition}}：</strong>条件を満たすときだけ実行するブロック（<code>if</code>）。<code>elif</code> と <code>else</code> は任意です。例：<code>yuujou &gt;= 3 and not kokuhaku</code>。</li>
    <li><strong>{{block_jump}}：</strong>別の label へ移動し、戻ってきません。</li>
    <li><strong>{{block_call}}：</strong>別の label へ移動し、そこが <code>return</code> で終わるとここに戻ります。複数の場所で繰り返す部分に便利です。</li>
    <li><strong>{{block_label}}：</strong>新しい label を、すぐ後ろかファイルの末尾に作ります。</li>
    <li><strong>{{block_pause}}：</strong>数秒待つか、空欄ならプレイヤーがクリックするまで待ちます。</li>
  </ul>
  <h3>{{block_group_audio}}</h3>
  <ul>
    <li><strong>{{block_music}}：</strong>音楽の再生（<code>play</code>）、予約（<code>queue</code>）、停止（<code>stop</code>）。ループの有無も選べます。選ぶ前に <code>game/audio</code> のファイルを試聴できます。</li>
  </ul>
  <h3>{{block_group_advanced}}</h3>
  <ul>
    <li><strong>{{block_comment}}：</strong>ゲームには表示されない自分用のメモ。</li>
    <li><strong>{{block_custom}}：</strong>専用のブロックがない Ren'Py のコード。</li>
  </ul>
  <h3>ブロックの中のブロック</h3>
  <p>「{{block_menu}}」の選択肢と「{{block_condition}}」の分岐には、ほかのブロックを入れられます。フォームには追加用のボタンの列と、編集・並べ替え・削除ができる一覧があります。</p>
</section>

<section id="preview">
  <h2>{{scene_preview}}と{{code_preview}}</h2>
  <h3>{{scene_preview}}</h3>
  <p>選択中のブロックの時点でのシーンを表示します。背景、所定の位置のキャラクター、名前と文章の入ったテキストボックス、または選択肢です。<code>gui.rpy</code> の解像度・色・フォント・サイズを使うので、ゲームとよく似た見た目になります。トランジションやアニメーションは再生しません。</p>
  <p>下端をドラッグすると高さを変えられます。</p>
  <h3>{{code_preview}}</h3>
  <p>ブロックから生成される Ren'Py のコードを表示します。<strong>直接編集</strong>でき、ブロックも入力に合わせて変わります。<kbd>Ctrl</kbd>+<kbd>Z</kbd> で元に戻し、<kbd>Ctrl</kbd>+<kbd>Y</kbd> でやり直します。<em>{{copy_code}}</em>はクリップボードにコピーし、<em>{{export}}</em>は別ファイルに保存します。</p>
  <div class="man-tip"><strong>{{spellcheck}}：</strong>{{settings}}で有効にすると、物語の文章の誤字に下線が引かれます。単語を右クリックすると候補の表示や辞書への追加ができます。</div>
</section>

<section id="map">
  <h2>{{map_title}}</h2>
  <p><strong>{{map_button}}</strong>は、すべてのシーン（label）をつながったカードとして表示し、物語の流れや各選択肢の行き先がひと目でわかるようにします。</p>
  <ul>
    <li>各カードには label の名前、背景のサムネイル、概要（最初のセリフ、または <code>label 名前:</code> の後ろに書いたコメント）、キャラクターと選択肢の数、長さが表示されます。</li>
    <li>線は<strong>{{map_legend_jump}}</strong>（実線）、<strong>{{map_legend_call}}</strong>（破線）、<strong>{{map_legend_choice}}</strong>を表し、選択肢の文章と条件（あれば）が付きます。</li>
    <li>バッジ：<strong>{{map_badge_start}}</strong>（<code>start</code> の label）、<strong>{{map_badge_ending}}</strong>（ゲームが終わる）、<strong>{{map_badge_missing}}</strong>（まだ書いていない label へのジャンプがある）、<strong>{{map_badge_unreachable}}</strong>（どこからもたどり着けない）。パッチのコンテンツがあるシーンには「{{map_patch}}」の印が付きます。</li>
    <li>引数のある label（補助ルーチン）は、マップが混み合わないよう表示しません。</li>
  </ul>
  <h3>マップの操作</h3>
  <p>ドラッグで移動し、マウスホイール（または<em>{{map_zoom_in}}、{{map_zoom_out}}</em>、<em>{{map_fit}}</em>）で拡大縮小します。</p>
  <h3>サイドパネル</h3>
  <ul>
    <li><strong>{{map_tab_scene}}：</strong>カードをクリックすると、ファイル、行き先のシーンと来る元のシーン、登場キャラクター、各選択肢の効果が表示されます。<em>{{map_open}}</em>でシーンエディターに読み込みます。</li>
    <li><strong>{{map_tab_vars}}：</strong>物語の変数、初期値、変わる場所、確認される場所。変数をクリックすると、該当するシーンがマップ上で強調されます。初期値がない変数には <code>default</code> を追加するよう勧められます。</li>
  </ul>
</section>

<section id="main-menu">
  <h2>{{main_menu_button}}</h2>
  <p>コードを書かずにゲームのメインメニューを作れます。<strong>{{mm_enabled}}</strong>をオンにして、次を調整します。</p>
  <ul>
    <li><strong>背景：</strong>プロジェクト元々の背景、単色、画像、アニメーション GIF（Ren'Py は GIF を再生できないため、エディターがフレームを取り出します）、動画（WebM 推奨）。</li>
    <li><strong>上のレイヤー：</strong>元のメニューの暗いサイドパネルと、背景を暗くする効果。</li>
    <li><strong>タイトル</strong>と<strong>バージョン：</strong>文字、サイズ、フォント、色、縁取り、位置。</li>
    <li><strong>ボタン：</strong>表示するボタン（{{mm_btn_start}}、{{mm_btn_load}}、{{mm_btn_preferences}}、{{mm_btn_about}}、{{mm_btn_help}}、{{mm_btn_quit}}）、縦並びか横並び、揃え、間隔、色、背景。各ボタンは文字、画像、背景画像の上の文字にでき、<em>独自の位置</em>を持たせることもできます。</li>
    <li>メニューの<strong>音楽</strong>（<code>game/audio</code> フォルダーから）。</li>
  </ul>
  <p>プレビューでタイトルやボタンを<strong>ドラッグ</strong>して配置できます。<em>{{mm_save}}</em>でプロジェクトに書き込み、<em>{{mm_test}}</em>でゲームを起動し、<em>{{mm_reset}}</em>で初期値に戻し、<em>{{discard_changes}}</em>で未保存の内容を破棄します。</p>
  <h3>フォント</h3>
  <p>フォントはゲームの中にコピーされるため、配布が認められた<strong>フリーライセンス</strong>のものだけが表示されます。システムのフォントの多く（Arial、Calibri など）は配布できません。<em>{{mm_fonts_get_free}}</em>でほかのフォントを入手できます。</p>
</section>

<section id="gui">
  <h2>{{gui_editor_title}}</h2>
  <p>ゲームのインターフェース（<code>gui.rpy</code> で定義される部分）の見た目を変え、結果をすぐに確認できます。プレビューには<strong>{{gui_tab_dialogue}}</strong>、<strong>{{gui_tab_choice}}</strong>、<strong>{{gui_tab_menu}}</strong>の 3 つのタブがあり、左側の設定はタブに合わせて切り替わります。</p>
  <ul>
    <li><strong>{{gui_section_text}}：</strong>セリフ・名前・メニューのフォントとサイズ、色、アクセントカラー、<em>{{gui_cps}}</em>（1 秒あたりの文字数。0 = 一度に表示）。</li>
    <li><strong>{{gui_section_textbox}}</strong>と<strong>{{gui_section_name}}：</strong>文章の高さ・位置・幅、揃え、名前ボックス。</li>
    <li><strong>{{gui_section_choice}}</strong>と<strong>{{gui_section_menu}}：</strong>サイズ、色（通常・マウスオーバー・選択時）、背景。</li>
  </ul>
  <p>各画像（テキストボックス、名前ボックス、ボタン、メニューの背景）は「{{gui_image_keep}}」（プロジェクトにある画像）、「{{gui_image_own}}」、「{{gui_image_generated}}」（選んだ色・不透明度・角の丸み・余白でエディターが描画）から選べます。初めて画像を置き換える前に、元の画像を <code>gui/editor_backup</code> に保存します。</p>
  <p>プレビューでテキストボックス、名前、ボタンを<strong>ドラッグ</strong>して、移動やサイズ変更ができます。</p>
  <h3>Google Fonts</h3>
  <p><em>{{gfonts_open}}</em>は SIL Open Font License のフォントのカタログを開きます。これらはゲームと一緒に使用・配布できます。追加すると、ライセンスとともにプロジェクトの <code>fonts</code> フォルダーにダウンロードされます。ファイルからフォントを追加することもできます。</p>
  <p><em>{{save}}</em>は変更した値だけを書き込み、<em>{{discard_changes}}</em>は未保存の内容を破棄します。</p>
</section>

<section id="game-settings">
  <h2>{{game_settings}}</h2>
  <h3>{{game_tab_general}}</h3>
  <ul>
    <li><strong>{{game_name}}</strong>と<strong>{{game_version}}</strong>（<code>config.name</code> と <code>config.version</code>）。</li>
    <li><strong>{{game_build_name}}</strong>（<code>build.name</code>）：空白やアクセント記号なし。ビルドで作られるファイルの名前に使われます。手で変えるまでは、ゲーム名に合わせて変わります。</li>
    <li><strong>{{game_icon}}：</strong>画像（できれば正方形で 512×512 以上）を選ぶと、ウィンドウのアイコンと Windows（<code>icon.ico</code>）・Mac（<code>icon.icns</code>）のアイコンが作られます。</li>
  </ul>
  <p>名前を変えてもセーブデータのフォルダーは変わらないので、アップデート後もプレイヤーのセーブは失われません。</p>
  <h3>{{patch}}</h3>
  <p><a href="#patch">パッチ</a>を参照してください。</p>
</section>

<section id="build">
  <h2>{{build_game}}</h2>
  <p><strong>{{build_game}}</strong>は、Ren'Py がなくてもダウンロードして遊べるファイルを作ります。システムを選びます。</p>
  <ul>
    <li><strong>{{build_pkg_win}}</strong>（.zip）、<strong>{{build_pkg_linux}}</strong>（.tar.bz2）、<strong>{{build_pkg_mac}}</strong>（.zip に圧縮したアプリ）。</li>
    <li><strong>{{build_pkg_pc}}：</strong>両方に使える 1 つの .zip。</li>
    <li><strong>{{build_pkg_market}}：</strong>3 つのシステムを含む .zip で、ストアへのアップロード用。</li>
  </ul>
  <p>出力先のフォルダーを選んで<em>{{build_start}}</em>を押します。進行状況が表示されます。その間ダイアログを隠しても（終わると通知されます）、中止してもかまいません。完了したら<em>{{build_open_folder}}</em>でファイルを開けます。</p>
  <p>ノベルにパッチがある場合は、ここでビルドするバージョンも選びます（<a href="#patch">パッチ</a>を参照）。</p>
  <h3>ゲームのテスト</h3>
  <p>サイドバーの<strong>{{launch_project}}</strong>は、保存されている状態のノベルを Ren'Py で開きます。コードにエラーがあれば、起動時に Ren'Py が表示します。</p>
</section>

<section id="patch">
  <h2>パッチ</h2>
  <p>Steam などのストアでは一部のコンテンツを除いて販売し、そのコンテンツを作者のサイトで<strong>パッチ</strong>として配布し、プレイヤーがゲームに追加する、という形をとるノベルがあります。エディターがその準備をすべて行います。</p>
  <h3>1. パッチを有効にする</h3>
  <p><strong>{{game_settings}} → {{patch}}</strong>で「{{patch_enable}}」をオンにし、名前を付け、プレイヤー向けの説明を書きます（テキストファイルとしてパッチに含まれます）。右側にはパッチの内容と問題点が表示されます。</p>
  <h3>2. パッチのコンテンツを指定する</h3>
  <ul>
    <li><strong>「{{block_patch}}」ブロック</strong>（パレットの「{{block_group_patch}}」グループ）。2 つの部分があります。
      <ul>
        <li><strong>{{patch_with}}：</strong>パッチを導入したプレイヤーだけが見るブロック。<code>game/patch/</code> に別に保存されます。</li>
        <li><strong>{{patch_without}}：</strong>パッチのないプレイヤー（Steam など）が見る内容。空のままでもかまいません。その場合、物語はそのまま続きます。</li>
      </ul>
      パッチのコンテンツを保存するには、シーンに「{{target_label}}」が必要です。</li>
    <li><strong>画像：</strong><em>{{patch_choose_images}}</em>で、パッチにだけ入れる画像を指定します。エディターは宣言とともに <code>images/patch/</code> へ移動します。チェックを外すとゲームに戻ります。</li>
  </ul>
  <p>シーンのプレビューには両方のバージョンを見るための<strong>{{patch_without}} / {{patch_with}}</strong>の切り替えが表示され、マップではパッチのコンテンツがあるシーンに印が付きます。</p>
  <h3>3. ビルド</h3>
  <p><strong>{{build_game}}</strong>で次から選びます。</p>
  <ul>
    <li><strong>{{build_patch_split}}：</strong>Steam 向け。ゲームにはパッチのコンテンツが（ロックされた形でも）含まれず、パッチは別の .zip になります。中身はパッケージ化され、読めるコードは含まれず、説明が付きます。</li>
    <li><strong>{{build_patch_full}}：</strong>すべてを 1 つのゲームに。自分のサイトや itch.io 向け。</li>
    <li><strong>{{build_patch_base}}：</strong>パッチに変更がないときのアップデート用。</li>
  </ul>
  <p>ビルドの前に、ゲーム側がパッチに依存していないかを確認します。たとえば、通常のシーンでも使われているパッチの画像や、パッチにしかないシーンへのジャンプです。</p>
  <h3>プレイヤー向け</h3>
  <p>パッチの導入は、.zip をゲームのフォルダー（実行ファイルのある場所）に展開するだけです。ゲームが自動で認識します。Mac ではゲームのフォルダーがアプリの中にあるので、Mac 向けに公開する場合は説明に書いておきましょう。</p>
  <div class="man-note"><strong>ストアの規約：</strong>Steam などのストアで公開する前に、ストア外で追加されるコンテンツに関する規約を確認してください。</div>
</section>

<section id="settings">
  <h2>エディターの{{settings}}</h2>
  <ul>
    <li><strong>{{theme}}：</strong><em>{{theme_dark}}、{{theme_light}}、{{theme_oled}}</em>、<em>{{theme_custom}}</em>。カスタムでは<em>{{custom_theme_edit}}</em>で、インターフェースとコードの色を選ぶエディターが開き、変更はすぐに反映されます。<em>{{custom_theme_reset}}</em>で最初の色に戻し、<em>{{cancel}}</em>で変更を取り消します。</li>
    <li><strong>{{language}}：</strong>スペイン語、英語、ドイツ語、フランス語、イタリア語、ポルトガル語、ロシア語、簡体字中国語、繁体字中国語、日本語。</li>
    <li><strong>{{spellcheck}}：</strong>物語の文章をチェックする言語。</li>
    <li><strong>Ren'Py：</strong>使用中のインストールと、変更や別のインストールのためのボタン。</li>
    <li><strong>{{projects_dir}}：</strong>新しいプロジェクトの作成先。</li>
    <li><strong>{{claude_connection}}：</strong>次のセクションを参照。</li>
  </ul>
</section>

<section id="claude">
  <h2>{{claude_connection}}</h2>
  <p><strong>Claude Code</strong> や <strong>Claude Desktop</strong> を使っているなら、エディターに接続して、ノベルについて自分の言葉で頼めます。「2 日目にはどんな選択肢がある？」「このシーンの冒頭がどう見えるか見せて」「この選択肢に新しい項目を追加して」など。エディターを開いている間、自分の Claude アカウントで動作します。</p>
  <h3>有効にする</h3>
  <ol>
    <li><strong>{{settings}} → {{claude_connection}}</strong>で「{{claude_enable}}」にチェックを入れます。最初はオフです。</li>
    <li><strong>Claude Code：</strong><em>{{claude_copy_command}}</em>を押し、ターミナルで一度実行します。</li>
    <li><strong>Claude Desktop：</strong><em>{{claude_desktop_add}}</em>を押し（エディターは先にその設定のコピーを保存します）、Claude Desktop を再起動します。</li>
  </ol>
  <p>状態欄には、Claude が接続しているかと、リクエスト数が表示されます。接続を受け付けるのは、自分のパソコン上でキーを持つプログラムだけです。<em>{{claude_new_key}}</em>は古いキーを無効にします（Claude Code のコマンドを再実行する必要があります）。ほかのプログラムが同じポートを使っている場合は「{{claude_port}}」で変更できます。</p>
  <h3>Claude ができること</h3>
  <ul>
    <li><strong>調べる：</strong>プロジェクト、物語のマップ、任意の label やファイルのコード、キャラクター、画像と音声、変数、インターフェースの設定、問題のチェック（存在しない label へのジャンプ、足りない画像や音声など）。</li>
    <li><strong>変更する：</strong>label やファイルの作成・編集、キャラクター・背景・イラスト・変数の追加、インターフェースやゲームの名前とバージョンの変更。</li>
    <li><strong>見る・見せる：</strong>シーンの任意の場面の画像の取得、エディターやマップで label を開く、ゲームの起動。</li>
  </ul>
  <h3>Claude の変更と取り消し</h3>
  <p>変更のたびに、エディターは対象ファイルのコピーを保存し、<strong>{{claude_changes}}</strong>（同じ設定のセクション）に記録します。そこから任意の変更を<strong>取り消せます</strong>。その後ファイルが編集されていれば、先に知らせます。Claude が何かを変更するたびに通知が表示され、開いている label が変更された場合は読み込み直します（未保存の変更があれば、どちらのバージョンにするか尋ねます）。</p>
</section>

<section id="files">
  <h2>エディターが作るファイル</h2>
  <table>
    <tr><th>ファイルまたはフォルダー</th><th>用途</th></tr>
    <tr><td><code>characters.rpy</code>、<code>backgrounds.rpy</code>、<code>scenes.rpy</code>、<code>expressions.rpy</code></td><td>キャラクターと画像の宣言</td></tr>
    <tr><td><code>animations.rpy</code>、<code>positions.rpy</code>、<code>audio.rpy</code></td><td>アニメーション、位置、音声</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> とその <code>.rpy</code></td><td>カスタムのメインメニュー</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>変更前のインターフェースの元画像</td></tr>
    <tr><td><code>fonts/</code></td><td>追加したフォントとそのライセンス</td></tr>
    <tr><td><code>patch_support.rpy</code>、<code>patch/</code>、<code>images/patch/</code></td><td>パッチ（有効時）</td></tr>
    <tr><td><code>.renpy-editor/</code>（<code>game</code> と同じ階層）</td><td>パッチの設定と Claude の変更のコピー。ゲームには含まれません。</td></tr>
  </table>
</section>

<section id="report">
  <h2>{{report_title}}</h2>
  <p>動かないものや足りないものがあれば、サイドバーの<strong>{{report_button}}</strong>を押してください。メッセージはエディターの作者に直接届きます。</p>
  <ul>
    <li>「{{report_kind_bug}}」か「{{report_kind_idea}}」を選び、タイトルを付けて詳しく書きます。問題の場合は、何をしていて、どうなるはずが、実際にはどうなったかを書くととても助かります。</li>
    <li><strong>{{report_email}}</strong>：返信のためだけに使います。</li>
    <li><strong>{{report_tech}}</strong>は、エディターのバージョン、システム、言語を添付します。送信前に含まれる内容を確認でき、ノベルやファイルが送られることはありません。</li>
    <li><strong>{{report_via}}</strong>「{{report_via_email}}」は作者に直接届き、アカウントは不要です。GitHub のほうがよければ「{{report_via_github}}」を選ぶと、入力済みの公開 issue がブラウザーで開き、自分のアカウントで公開できます。</li>
  </ul>
  <p>接続できないときは、<em>{{report_copy}}</em>でほかの方法で送れます。</p>
</section>

<section id="troubleshooting">
  <h2>よくある問題</h2>
  <dl>
    <dt>「{{renpy_required_title}}」と表示される、またはゲームが起動しない</dt>
    <dd>{{settings}} → Ren'Py で、パスが <code>renpy.exe</code> を指しているか確認するか、<em>{{renpy_change_or_install}}</em>を使ってください。</dd>
    <dt>キャラクターや背景が選択リストに出てこない</dt>
    <dd><a href="#declarations">{{declarations}}</a>ウィンドウ（またはエディターの宣言ファイル）で宣言されている必要があります。</dd>
    <dt>プレビューに画像名の入った枠が表示される</dt>
    <dd>その画像が宣言されていないか、ファイルがありません。マップや Claude のチェックでも、このような箇所を見つけられます。</dd>
    <dt>インストール済みのフォントが見つからない</dt>
    <dd>フォントはゲームにコピーされるため、フリーライセンスのものだけが表示されます。Google Fonts で似たものを探してください。</dd>
    <dt>label の変更が消えた</dt>
    <dd>{{save_to_file}}は対象の label の中身を置き換えます。Claude による変更なら、<em>{{claude_changes}}</em>で取り消せます。</dd>
  </dl>
</section>
`
};
