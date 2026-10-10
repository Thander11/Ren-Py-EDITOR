// Ren'Py EDITOR — 使用手冊（繁體中文）。{{key}} = 介面上的文字
(window.MANUALS = window.MANUALS || {})['zh-TW'] = {
  title: 'Ren\'Py EDITOR 使用手冊',
  search: '搜尋手冊',
  contents: '目錄',
  noResults: '沒有章節包含這段文字。',
  html: `
<section id="intro">
  <h2>歡迎</h2>
  <p>Ren'Py EDITOR 是一款用 <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a> 製作視覺小說的視覺化編輯器。你不必手寫所有程式碼，而是用<strong>區塊</strong>（對話、更換背景、角色登場與退場、選項……）來組合每個場景，編輯器會替你寫出 Ren'Py 程式碼。只要你想，程式碼隨時可見，也能直接修改。</p>
  <p>編輯器直接處理你的 Ren'Py 專案檔案：在這裡儲存的就是一般的專案，也可以用 Ren'Py 啟動器或任何文字編輯器開啟。</p>
  <div class="man-note"><strong>程式碼詞彙。</strong>來自 Ren'Py 程式碼的名稱（<code>label</code>、<code>jump</code>、<code>call</code>、<code>Solid</code>……）在所有語言中保持不變，以便與程式碼中看到的一致。</div>
</section>

<section id="start">
  <h2>入門</h2>
  <h3>需要準備什麼</h3>
  <p>要<strong>測試遊戲</strong>、<strong>建立新專案</strong>和<strong>建置</strong>，電腦上需要有 Ren'Py（SDK）。如果編輯器找不到它，會提供三個選項：</p>
  <ul>
    <li><strong>{{renpy_install_auto}}：</strong>從 renpy.org 下載最新版本（約 160 MB），檢查檔案是否完整，並安裝到你選擇的資料夾。</li>
    <li><strong>{{renpy_go_website}}</strong>，自行下載。</li>
    <li><strong>{{renpy_select_existing}}：</strong>選擇你安裝的 <code>renpy.exe</code> 檔案。</li>
  </ul>
  <p>之後隨時可以在 <a href="#settings">{{settings}}</a> → Ren'Py → <em>{{renpy_change_or_install}}</em> 中變更。</p>
  <h3>主畫面</h3>
  <ul>
    <li><strong>側邊欄（左側）：</strong>編輯器的各個部分（<em>{{map_button}}、{{nav_scenes}}、{{declarations}}、{{main_menu_button}}、{{gui_editor_title}}</em>）、專案操作（<em>{{open_project}}、{{new_project}}、{{game_settings}}、{{build_game}}</em>），底部是<em>{{launch_project}}</em>、本<em>{{manual}}</em>和編輯器的<em>{{settings}}</em>。下方顯示目前開啟的專案資料夾。</li>
    <li><strong>頂端列：</strong>目前的 <code>.rpy</code> 檔案、<em>{{target_label}}</em>、用來選擇面板的<em>{{panels_show}}</em>選單、<em>{{clear_all}}</em>和<em>{{save_to_file}}</em>。</li>
    <li><strong>工作區：</strong>檔案清單、區塊面板、場景的區塊清單、場景預覽和程式碼預覽。</li>
  </ul>
  <div class="man-tip"><strong>提示：</strong>隨時按 <kbd>F1</kbd> 開啟本手冊。</div>
</section>

<section id="projects">
  <h2>專案</h2>
  <h3>開啟專案</h3>
  <p>點選<strong>{{open_project}}</strong>，選擇遊戲的資料夾（包含 <code>game</code> 資料夾的那個）或直接選擇 <code>game</code> 資料夾。編輯器會記住最後一個專案，下次自動開啟。</p>
  <p>開啟時，編輯器會建立缺少的內容：<code>audio</code>、<code>images/characters</code>、<code>images/backgrounds</code>、<code>images/scenes</code> 和 <code>images/expressions</code> 資料夾，以及儲存宣告的檔案（<code>characters.rpy</code>、<code>backgrounds.rpy</code>、<code>scenes.rpy</code>、<code>expressions.rpy</code>、<code>animations.rpy</code>、<code>positions.rpy</code> 和 <code>audio.rpy</code>）。其他檔案不會被更動。</p>
  <p>如果有圖片宣告在其他名稱的資料夾中，編輯器會詢問是否將它們移到英文名稱的資料夾並更新 <code>.rpy</code> 中的路徑。你可以拒絕。</p>
  <h3>建立新專案</h3>
  <p>點選<strong>{{new_project}}</strong>，輸入名稱，選擇<strong>解析度</strong>（1920×1080 是不錯的折衷）和遊戲的<strong>介面顏色</strong>。專案會由 Ren'Py 建立在你的<em>{{projects_dir}}</em>中（如果尚未設定，編輯器會詢問），並自動開啟。</p>
  <h3>在編輯器外所做的修改</h3>
  <p>如果你用其他程式修改了 <code>.rpy</code> 檔案（或由 Claude 修改，請參閱 <a href="#claude">{{claude_connection}}</a>），編輯器會察覺並重新載入專案資料。</p>
</section>

<section id="declarations">
  <h2>{{declarations}}：角色、圖片等</h2>
  <p><strong>{{declarations}}</strong>視窗彙整了故事用到的一切：角色、角色的圖片、背景……在這裡新增的內容會出現在各個區塊的選擇器中。它有以下分頁：</p>
  <ul>
    <li><strong>{{tab_characters}}：</strong>每個角色有一個「{{char_id}}」（程式碼中使用的名稱）、一個「{{char_name}}」、名字的顏色以及表情的標籤。</li>
    <li><strong>{{tab_sprites}}：</strong>每個角色的圖片，依類型分組（例如一套服裝）。命名方式為 <code>角色_類型_編號</code>（例如 <code>Ryu_hunter_1</code>）。可以逐張新增，也可以用<em>{{add_batch}}</em>一次新增很多張。</li>
    <li><strong>{{tab_expressions}}：</strong>伴隨對話出現的側邊頭像（side image）。</li>
    <li><strong>{{tab_backgrounds}}</strong>和<strong>{{tab_scenes}}：</strong>各個地點的背景，以及特定時刻的插圖（CG）。</li>
    <li><strong>{{tab_animations}}</strong>和<strong>{{tab_positions}}：</strong>顯示角色時可以使用的 <code>transform</code> 和位置。</li>
  </ul>
  <p>刪除某項時，編輯器會詢問是否一併刪除圖片檔案，還是保留它。</p>
</section>

<section id="scenes">
  <h2>{{nav_scenes}}：區塊編輯器</h2>
  <p>這是主要部分。一個場景就是一個 Ren'Py <code>label</code>，其內容是一系列區塊。</p>
  <h3>檔案和目標 label</h3>
  <ul>
    <li>在<strong>{{panel_files}}</strong>面板中選擇目前的 <code>.rpy</code> 檔案。<strong>+</strong> 可建立新檔案。</li>
    <li>在<strong>{{target_label}}</strong>中選擇要編輯的 label：編輯器會載入它的區塊。如果選擇<em>{{end_of_file}}</em>，儲存的內容會作為新內容加到檔案末尾。</li>
  </ul>
  <h3>新增和排列區塊</h3>
  <p><strong>{{palette_title}}</strong>面板依顏色將區塊分組：<em>{{block_group_text}}、{{block_group_scene}}、{{block_group_flow}}、{{block_group_audio}}、{{block_group_advanced}}</em>（如果已開啟補丁，還有<em>{{block_group_patch}}</em>）。點選會開啟它的表單；新區塊會放在<strong>所選區塊的下方</strong>。</p>
  <p>點選一個區塊即可選取：會出現它的操作（<em>{{btn_edit}}、{{btn_duplicate}}、{{btn_duplicate_end}}、{{btn_move_up}}、{{btn_move_down}}、{{btn_delete}}</em>），預覽會顯示該時刻的場景。按兩下可編輯。也可以拖曳區塊來調整順序。</p>
  <table>
    <tr><th>按鍵</th><th>操作</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>選取上一個或下一個區塊</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>上移或下移區塊</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>編輯區塊</td></tr>
    <tr><td><kbd>Delete</kbd></td><td>刪除區塊（會先確認）</td></tr>
  </table>
  <h3>儲存</h3>
  <p><strong>{{save_to_file}}</strong>會把區塊寫入目前的檔案：如果有目標 label，會<strong>取代它的全部內容</strong>（會先確認）；否則加到末尾。<strong>{{clear_all}}</strong>會清空區塊清單，但不會更動檔案。</p>
  <p>如果有尚未儲存的修改，而你切換了 label 或檔案，編輯器會在捨棄前提醒你。</p>
  <h3>面板</h3>
  <p>透過<strong>{{panels_show}}</strong>選擇要顯示的面板：<em>{{panel_files}}、{{panel_palette}}、{{panel_preview}}</em>和<em>{{panel_code}}</em>。拖曳邊緣可調整面板大小；在邊緣按兩下可恢復初始大小。編輯器會記住你的版面配置。</p>
</section>

<section id="blocks">
  <h2>區塊類型</h2>
  <h3>{{block_group_text}}</h3>
  <ul>
    <li><strong>{{block_dialogue}}：</strong>角色說的話。可以為這一刻選擇一個側邊<em>表情</em>，也可以標記為<em>內心想法</em>（以斜體顯示在 &lt;&lt; &gt;&gt; 之間）。</li>
    <li><strong>{{block_narration}}：</strong>旁白文字，沒有名字。</li>
  </ul>
  <h3>{{block_group_scene}}</h3>
  <ul>
    <li><strong>{{block_scene}}：</strong>顯示背景或插圖（<code>scene</code>），並移除所有角色。可以加入轉場（<code>with</code>）並模糊圖片。</li>
    <li><strong>{{block_show}}：</strong>讓角色出現（<code>show</code>）。可以選擇圖片、位置或動畫（<code>at</code>）、轉場、是否在另一張圖片後面（<code>behind</code>）、是否翻轉（<code>xflip</code>）或模糊。</li>
    <li><strong>{{block_show_multi}}：</strong>同時顯示多個角色，使用同一個轉場。</li>
    <li><strong>{{block_hide}}</strong>和<strong>{{block_hide_multi}}：</strong>把角色從畫面中移除（<code>hide</code>）。編輯器會根據先前的區塊建議目前在畫面上的角色。</li>
    <li><strong>{{block_solid}}：</strong>一層純色（例如淡出到黑色或疊加色調），可設定不透明度。</li>
  </ul>
  <h3>{{block_group_flow}}</h3>
  <ul>
    <li><strong>{{block_menu}}：</strong>選項選單（<code>menu</code>）。每個選項可以跳到某個 label（<code>jump</code>）、呼叫它（<code>call</code>）、執行程式碼或包含自己的區塊。可以在選項旁顯示一個角色，並把選項放在左側，像內心獨白對話框一樣。</li>
    <li><strong>{{block_condition}}：</strong>只在條件成立時執行的區塊（<code>if</code>），可選用 <code>elif</code> 和 <code>else</code>。例如：<code>youqing &gt;= 3 and not gaobai</code>。</li>
    <li><strong>{{block_jump}}：</strong>跳到另一個 label，不再返回。</li>
    <li><strong>{{block_call}}：</strong>前往另一個 label，當它以 <code>return</code> 結束時回到這裡。適合在多處重複使用的內容。</li>
    <li><strong>{{block_label}}：</strong>建立一個新的 label，放在目前位置之後或檔案末尾。</li>
    <li><strong>{{block_pause}}：</strong>等待幾秒；如果留空，則等待玩家點擊。</li>
  </ul>
  <h3>{{block_group_audio}}</h3>
  <ul>
    <li><strong>{{block_music}}：</strong>播放（<code>play</code>）、排入佇列（<code>queue</code>）或停止（<code>stop</code>）音樂，可選擇是否循環。選擇前可以試聽 <code>game/audio</code> 中的檔案。</li>
  </ul>
  <h3>{{block_group_advanced}}</h3>
  <ul>
    <li><strong>{{block_comment}}：</strong>給自己的備註，不會出現在遊戲中。</li>
    <li><strong>{{block_custom}}：</strong>沒有專屬區塊的任意 Ren'Py 程式碼。</li>
  </ul>
  <h3>區塊中的區塊</h3>
  <p>「{{block_menu}}」的選項和「{{block_condition}}」的分支都可以包含其他區塊。它們的表單裡有一排用來新增的按鈕，以及一份可以編輯、排序或刪除的清單。</p>
</section>

<section id="preview">
  <h2>{{scene_preview}}和{{code_preview}}</h2>
  <h3>{{scene_preview}}</h3>
  <p>顯示所選區塊時的場景：背景、各就各位的角色、帶名字和文字的對話框，或選項選單。它使用你的 <code>gui.rpy</code> 中的解析度、顏色、字型和尺寸，因此與遊戲非常接近。不會播放轉場和動畫。</p>
  <p>拖曳下緣可以調整它的高度。</p>
  <h3>{{code_preview}}</h3>
  <p>顯示由你的區塊產生的 Ren'Py 程式碼。你可以<strong>直接編輯</strong>：區塊會跟著你輸入的內容更新。<kbd>Ctrl</kbd>+<kbd>Z</kbd> 復原，<kbd>Ctrl</kbd>+<kbd>Y</kbd> 重做。<em>{{copy_code}}</em>會複製到剪貼簿，<em>{{export}}</em>會另存成檔案。</p>
  <div class="man-tip"><strong>{{spellcheck}}：</strong>在{{settings}}中開啟後，故事文字中的拼寫錯誤會加上底線。在單字上按右鍵可查看建議或將其加入字典。</div>
</section>

<section id="map">
  <h2>{{map_title}}</h2>
  <p><strong>{{map_button}}</strong>把所有場景（label）顯示為相互連接的卡片，讓你一眼看出故事如何推進、每個選項通往哪裡。</p>
  <ul>
    <li>每張卡片顯示 label 的名稱、背景縮圖、摘要（第一句台詞，或寫在 <code>label 名稱:</code> 之後的註解）、角色和選項的數量以及篇幅。</li>
    <li>連線代表<strong>{{map_legend_jump}}</strong>（實線）、<strong>{{map_legend_call}}</strong>（虛線）和<strong>{{map_legend_choice}}</strong>，並附有選項文字和條件（如果有）。</li>
    <li>標記：<strong>{{map_badge_start}}</strong>（<code>start</code> 這個 label）、<strong>{{map_badge_ending}}</strong>（遊戲結束）、<strong>{{map_badge_missing}}</strong>（有跳轉指向尚未撰寫的 label）和<strong>{{map_badge_unreachable}}</strong>（沒有任何地方通往該場景）。含補丁內容的場景帶有「{{map_patch}}」標記。</li>
    <li>帶參數的 label（輔助常式）不會顯示，以免地圖過於擁擠。</li>
  </ul>
  <h3>瀏覽地圖</h3>
  <p>拖曳可移動視圖，使用滑鼠滾輪（或<em>{{map_zoom_in}}、{{map_zoom_out}}</em>和<em>{{map_fit}}</em>）可縮放。</p>
  <h3>側邊面板</h3>
  <ul>
    <li><strong>{{map_tab_scene}}：</strong>點選卡片可查看它所在的檔案、通往哪些場景、從哪些場景到達，以及它的角色和選項與每個選項的效果。<em>{{map_open}}</em>會在場景編輯器中載入它。</li>
    <li><strong>{{map_tab_vars}}：</strong>故事中的變數、初始值、在哪裡被修改、在哪裡被檢查。點選某個變數會在地圖上醒目標示這些場景。如果變數沒有初始值，編輯器會建議加上 <code>default</code>。</li>
  </ul>
</section>

<section id="main-menu">
  <h2>{{main_menu_button}}</h2>
  <p>不用寫程式碼就能設計遊戲的主選單。開啟<strong>{{mm_enabled}}</strong>並調整：</p>
  <ul>
    <li><strong>背景：</strong>專案原有的背景、純色、圖片、動態 GIF（Ren'Py 無法播放 GIF，所以編輯器會擷取它的影格）或影片（建議 WebM）。</li>
    <li><strong>上層：</strong>原選單的深色側邊面板，以及背景的變暗效果。</li>
    <li><strong>標題</strong>和<strong>版本：</strong>文字、大小、字型、顏色、外框和位置。</li>
    <li><strong>按鈕：</strong>顯示哪些按鈕（{{mm_btn_start}}、{{mm_btn_load}}、{{mm_btn_preferences}}、{{mm_btn_about}}、{{mm_btn_help}}、{{mm_btn_quit}}），直向或橫向排列、對齊、間距、顏色和背景。每個按鈕可以是文字、圖片或帶背景圖片的文字，並可以有<em>獨立位置</em>。</li>
    <li>選單的<strong>音樂</strong>，來自 <code>game/audio</code> 資料夾。</li>
  </ul>
  <p>在預覽中可以<strong>拖曳</strong>標題和按鈕來擺放。<em>{{mm_save}}</em>寫入專案，<em>{{mm_test}}</em>啟動遊戲，<em>{{mm_reset}}</em>恢復初始值，<em>{{discard_changes}}</em>捨棄尚未儲存的內容。</p>
  <h3>字型</h3>
  <p>字型會被複製到遊戲中，所以只提供<strong>授權允許散布</strong>的字型。大多數系統字型（Arial、Calibri……）不允許散布。使用<em>{{mm_fonts_get_free}}</em>取得更多字型。</p>
</section>

<section id="gui">
  <h2>{{gui_editor_title}}</h2>
  <p>修改遊戲介面的外觀（即 <code>gui.rpy</code> 定義的內容），並立即看到效果。預覽有三個分頁：<strong>{{gui_tab_dialogue}}</strong>、<strong>{{gui_tab_choice}}</strong>和<strong>{{gui_tab_menu}}</strong>；左側的設定會隨分頁變化。</p>
  <ul>
    <li><strong>{{gui_section_text}}：</strong>對話、名字和選單的字型與字級；顏色；強調色；<em>{{gui_cps}}</em>（每秒顯示的字數；0 = 一次全部顯示）。</li>
    <li><strong>{{gui_section_textbox}}</strong>和<strong>{{gui_section_name}}：</strong>文字的高度、位置和寬度，對齊方式以及名字框。</li>
    <li><strong>{{gui_section_choice}}</strong>和<strong>{{gui_section_menu}}：</strong>尺寸、顏色（一般、滑鼠移過、選取）和背景。</li>
  </ul>
  <p>每張圖片（對話框、名字框、按鈕、選單背景）都可以選擇「{{gui_image_keep}}」（專案已有的圖片）、「{{gui_image_own}}」或「{{gui_image_generated}}」（編輯器依你選擇的顏色、不透明度、圓角和邊距繪製）。第一次取代某張圖片前，編輯器會把原圖保存在 <code>gui/editor_backup</code>。</p>
  <p>在預覽中可以<strong>拖曳</strong>對話框、名字和按鈕來移動它們並調整大小。</p>
  <h3>Google Fonts</h3>
  <p><em>{{gfonts_open}}</em>會開啟一個採用 SIL Open Font License 的字型目錄，這些字型可以隨你的遊戲使用和散布。新增時，字型及其授權會下載到專案的 <code>fonts</code> 資料夾。也可以從檔案新增字型。</p>
  <p><em>{{save}}</em>只寫入修改過的值；<em>{{discard_changes}}</em>捨棄尚未儲存的內容。</p>
</section>

<section id="game-settings">
  <h2>{{game_settings}}</h2>
  <h3>{{game_tab_general}}</h3>
  <ul>
    <li><strong>{{game_name}}</strong>和<strong>{{game_version}}</strong>（<code>config.name</code> 和 <code>config.version</code>）。</li>
    <li><strong>{{game_build_name}}</strong>（<code>build.name</code>）：不能有空格或重音符號；用於建置產生的檔案。在你手動修改前，它會跟著遊戲名稱變化。</li>
    <li><strong>{{game_icon}}：</strong>選擇一張圖片（最好是正方形，512×512 或更大），編輯器會產生視窗圖示以及 Windows（<code>icon.ico</code>）和 Mac（<code>icon.icns</code>）圖示。</li>
  </ul>
  <p>存檔資料夾不會隨名稱改變，這樣玩家在遊戲更新後不會遺失存檔。</p>
  <h3>{{patch}}</h3>
  <p>請參閱<a href="#patch">補丁</a>。</p>
</section>

<section id="build">
  <h2>{{build_game}}</h2>
  <p><strong>{{build_game}}</strong>會產生其他人可以下載、不需要 Ren'Py 就能遊玩的檔案。選擇系統：</p>
  <ul>
    <li><strong>{{build_pkg_win}}</strong>（.zip）、<strong>{{build_pkg_linux}}</strong>（.tar.bz2）和<strong>{{build_pkg_mac}}</strong>（壓縮成 .zip 的應用程式）。</li>
    <li><strong>{{build_pkg_pc}}：</strong>兩個系統共用一個 .zip。</li>
    <li><strong>{{build_pkg_market}}：</strong>包含三個系統的 .zip，可直接上傳到商店。</li>
  </ul>
  <p>選擇目標資料夾並點選<em>{{build_start}}</em>。你會看到進度；期間可以隱藏對話框（完成時會通知你）或停止建置。完成後，<em>{{build_open_folder}}</em>會帶你找到檔案。</p>
  <p>如果你的小說有補丁，也在這裡選擇要建置的版本（請參閱<a href="#patch">補丁</a>）。</p>
  <h3>測試遊戲</h3>
  <p>側邊欄的<strong>{{launch_project}}</strong>會用 Ren'Py 依已儲存的狀態開啟你的小說。如果程式碼有錯誤，Ren'Py 會在啟動時顯示。</p>
</section>

<section id="patch">
  <h2>補丁</h2>
  <p>有些小說在 Steam 等商店發布時會拿掉部分內容，作者再在自己的網站上把這些內容作為<strong>補丁</strong>提供，玩家自行加入遊戲。編輯器會為你準備好一切。</p>
  <h3>1. 開啟補丁</h3>
  <p>在<strong>{{game_settings}} → {{patch}}</strong>中開啟「{{patch_enable}}」，為補丁命名，並寫下給玩家的說明（會以文字檔的形式放入補丁）。右側可以看到補丁包含的內容以及可能的問題。</p>
  <h3>2. 標記補丁內容</h3>
  <ul>
    <li><strong>「{{block_patch}}」區塊</strong>（面板中的「{{block_group_patch}}」群組）。它有兩部分：
      <ul>
        <li><strong>{{patch_with}}：</strong>只有安裝了補丁的玩家才看得到的區塊。它們單獨儲存在 <code>game/patch/</code> 中。</li>
        <li><strong>{{patch_without}}：</strong>沒有補丁的玩家（例如 Steam 玩家）看到的內容。可以留空：故事會直接繼續。</li>
      </ul>
      要儲存補丁內容，場景必須有一個「{{target_label}}」。</li>
    <li><strong>圖片：</strong>透過<em>{{patch_choose_images}}</em>標記只放進補丁的圖片。編輯器會把它們連同宣告一起移到 <code>images/patch/</code>。取消勾選即可放回遊戲中。</li>
  </ul>
  <p>場景預覽中會出現<strong>{{patch_without}} / {{patch_with}}</strong>切換，用來查看兩個版本；地圖上含補丁內容的場景也會帶有標記。</p>
  <h3>3. 建置</h3>
  <p>在<strong>{{build_game}}</strong>中選擇：</p>
  <ul>
    <li><strong>{{build_patch_split}}：</strong>用於 Steam。遊戲不包含補丁內容（即使是鎖定狀態也沒有），補丁則是單獨的 .zip，內容已封裝、沒有可讀的程式碼，並附有說明。</li>
    <li><strong>{{build_patch_full}}：</strong>所有內容都在同一個遊戲裡，適用於你的網站或 itch.io。</li>
    <li><strong>{{build_patch_base}}：</strong>補丁沒有變更時，用來上傳更新。</li>
  </ul>
  <p>建置前，編輯器會檢查遊戲中沒有任何內容依賴補丁：例如某張補丁圖片也用在一般場景裡，或跳到只存在於補丁中的場景。</p>
  <h3>給玩家</h3>
  <p>安裝補丁就是把 .zip 解壓縮到遊戲資料夾（執行檔所在的位置）。遊戲會自動偵測。在 Mac 上，遊戲資料夾位於應用程式內部；如果你發布 Mac 版，請在說明中解釋這一點。</p>
  <div class="man-note"><strong>商店規則：</strong>在 Steam 或其他商店發布前，請查看其關於在商店之外新增內容的規定。</div>
</section>

<section id="settings">
  <h2>編輯器{{settings}}</h2>
  <ul>
    <li><strong>{{theme}}：</strong><em>{{theme_dark}}、{{theme_light}}、{{theme_oled}}</em>或<em>{{theme_custom}}</em>。選擇自訂時，<em>{{custom_theme_edit}}</em>會開啟一個編輯器，讓你選擇介面和程式碼的顏色，修改會立即生效。<em>{{custom_theme_reset}}</em>恢復初始顏色，<em>{{cancel}}</em>捨棄修改。</li>
    <li><strong>{{language}}：</strong>西班牙文、英文、德文、法文、義大利文、葡萄牙文、俄文、簡體中文、繁體中文和日文。</li>
    <li><strong>{{spellcheck}}：</strong>用來檢查故事文字的語言。</li>
    <li><strong>Ren'Py：</strong>目前使用的安裝，以及更換或另外安裝的按鈕。</li>
    <li><strong>{{projects_dir}}：</strong>新專案的建立位置。</li>
    <li><strong>{{claude_connection}}：</strong>請參閱下一節。</li>
  </ul>
</section>

<section id="claude">
  <h2>{{claude_connection}}</h2>
  <p>如果你使用 <strong>Claude Code</strong> 或 <strong>Claude Desktop</strong>，可以把它連接到編輯器，用自己的話詢問關於小說的問題：「第二天有哪些選項？」「給我看這個場景開頭的樣子」「在這個選項裡加一個新選擇」……它使用你自己的 Claude 帳號，在編輯器開啟時運作。</p>
  <h3>開啟</h3>
  <ol>
    <li>在<strong>{{settings}} → {{claude_connection}}</strong>中勾選「{{claude_enable}}」。預設是關閉的。</li>
    <li><strong>Claude Code：</strong>點選<em>{{claude_copy_command}}</em>，在終端機中執行一次。</li>
    <li><strong>Claude Desktop：</strong>點選<em>{{claude_desktop_add}}</em>（編輯器會先備份它的設定），然後重新啟動 Claude Desktop。</li>
  </ol>
  <p>狀態會顯示 Claude 是否已連接以及發出了多少次請求。連線只接受你電腦上持有金鑰的程式。<em>{{claude_new_key}}</em>會讓舊金鑰失效（需要重新執行 Claude Code 的指令）；如果有其他程式佔用同一連接埠，可以在「{{claude_port}}」中變更。</p>
  <h3>Claude 能做什麼</h3>
  <ul>
    <li><strong>查詢：</strong>專案、故事地圖、任何 label 或檔案的程式碼、角色、圖片和音訊、變數、介面設定，以及問題檢查（跳到不存在的 label、缺少的圖片或音訊……）。</li>
    <li><strong>修改：</strong>撰寫或編輯 label 和檔案，新增角色、背景、插圖和變數，修改介面或遊戲的名稱和版本。</li>
    <li><strong>查看與展示：</strong>取得場景中任何時刻的畫面，在編輯器或地圖中開啟 label，以及啟動遊戲。</li>
  </ul>
  <h3>Claude 的修改與復原</h3>
  <p>每次修改前，編輯器都會備份受影響的檔案，並記錄在<strong>{{claude_changes}}</strong>中（在同一個設定區域）。你可以在那裡<strong>復原</strong>任何修改；如果檔案之後又被修改過，會先提醒你。Claude 每次修改都會出現通知；如果它修改的是你正在開啟的 label，編輯器會重新載入（如果你有尚未儲存的修改，則會詢問要保留哪個版本）。</p>
</section>

<section id="files">
  <h2>編輯器建立的檔案</h2>
  <table>
    <tr><th>檔案或資料夾</th><th>用途</th></tr>
    <tr><td><code>characters.rpy</code>、<code>backgrounds.rpy</code>、<code>scenes.rpy</code>、<code>expressions.rpy</code></td><td>角色和圖片的宣告</td></tr>
    <tr><td><code>animations.rpy</code>、<code>positions.rpy</code>、<code>audio.rpy</code></td><td>動畫、位置和音訊</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> 及其 <code>.rpy</code></td><td>自訂主選單</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>修改前介面的原始圖片</td></tr>
    <tr><td><code>fonts/</code></td><td>新增的字型及其授權</td></tr>
    <tr><td><code>patch_support.rpy</code>、<code>patch/</code>、<code>images/patch/</code></td><td>補丁（開啟時）</td></tr>
    <tr><td><code>.renpy-editor/</code>（與 <code>game</code> 同層）</td><td>補丁設定和 Claude 修改的備份。不會包含在遊戲中。</td></tr>
  </table>
</section>

<section id="report">
  <h2>{{report_title}}</h2>
  <p>如果某些功能無法使用，或你覺得缺少什麼，請點選側邊欄中的<strong>{{report_button}}</strong>。你的訊息會直接寄給編輯器的作者。</p>
  <ul>
    <li>選擇「{{report_kind_bug}}」或「{{report_kind_idea}}」，填寫標題並詳細說明。如果是問題，說明你當時在做什麼、預期會發生什麼、實際發生了什麼，會非常有幫助。</li>
    <li><strong>{{report_email}}</strong>：僅用於回覆你。</li>
    <li><strong>{{report_tech}}</strong>會附上編輯器版本、系統和語言。傳送前你可以看到具體包含的內容；你的小說和檔案永遠不會被傳送。</li>
  </ul>
  <p>如果沒有網路連線，可以使用<em>{{report_copy}}</em>，透過其他方式傳送。</p>
</section>

<section id="troubleshooting">
  <h2>常見問題</h2>
  <dl>
    <dt>「{{renpy_required_title}}」或遊戲無法啟動</dt>
    <dd>在{{settings}} → Ren'Py 中檢查路徑是否指向你的 <code>renpy.exe</code>，或使用<em>{{renpy_change_or_install}}</em>。</dd>
    <dt>選擇器中沒有某個角色或背景</dt>
    <dd>它必須在<a href="#declarations">{{declarations}}</a>視窗中宣告（或寫在編輯器的宣告檔案中）。</dd>
    <dt>預覽中出現寫著圖片名稱的方框</dt>
    <dd>該圖片未宣告或檔案不存在。地圖和 Claude 的檢查也能幫你找到這類情況。</dd>
    <dt>找不到已安裝的字型</dt>
    <dd>只顯示授權允許自由使用的字型，因為字型會被複製到遊戲中。可以在 Google Fonts 中找一款相似的。</dd>
    <dt>某個 label 的修改不見了</dt>
    <dd>{{save_to_file}}會取代目標 label 的內容。如果修改是 Claude 做的，可以在<em>{{claude_changes}}</em>中復原。</dd>
  </dl>
</section>
`
};
