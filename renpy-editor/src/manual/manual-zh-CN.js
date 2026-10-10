// Ren'Py EDITOR — 使用手册（简体中文）。{{key}} = 界面上的文字
(window.MANUALS = window.MANUALS || {})['zh-CN'] = {
  title: 'Ren\'Py EDITOR 使用手册',
  search: '搜索手册',
  contents: '目录',
  noResults: '没有章节包含这段文字。',
  html: `
<section id="intro">
  <h2>欢迎</h2>
  <p>Ren'Py EDITOR 是一款用 <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a> 制作视觉小说的可视化编辑器。你不必手写全部代码，而是用<strong>块</strong>（对话、更换背景、角色登场和退场、选项……）来搭建每个场景，编辑器会替你写出 Ren'Py 代码。只要你愿意，代码随时可见，也可以直接修改。</p>
  <p>编辑器直接处理你的 Ren'Py 项目文件：在这里保存的就是一个普通项目，也可以用 Ren'Py 启动器或任何文本编辑器打开。</p>
  <div class="man-note"><strong>代码词汇。</strong>来自 Ren'Py 代码的名称（<code>label</code>、<code>jump</code>、<code>call</code>、<code>Solid</code>……）在所有语言中保持不变，以便与代码中看到的一致。</div>
</section>

<section id="start">
  <h2>入门</h2>
  <h3>需要准备什么</h3>
  <p>要<strong>测试游戏</strong>、<strong>新建项目</strong>和<strong>构建</strong>，电脑上需要有 Ren'Py（SDK）。如果编辑器找不到它，会提供三个选项：</p>
  <ul>
    <li><strong>{{renpy_install_auto}}：</strong>从 renpy.org 下载最新版本（约 160 MB），检查文件是否完好，并安装到你选择的文件夹。</li>
    <li><strong>{{renpy_go_website}}</strong>，自己下载。</li>
    <li><strong>{{renpy_select_existing}}：</strong>选择你安装的 <code>renpy.exe</code> 文件。</li>
  </ul>
  <p>之后可以随时在 <a href="#settings">{{settings}}</a> → Ren'Py → <em>{{renpy_change_or_install}}</em> 中更改。</p>
  <h3>主界面</h3>
  <ul>
    <li><strong>侧边栏（左侧）：</strong>编辑器的各个部分（<em>{{map_button}}、{{nav_scenes}}、{{declarations}}、{{main_menu_button}}、{{gui_editor_title}}</em>）、项目操作（<em>{{open_project}}、{{new_project}}、{{game_settings}}、{{build_game}}</em>），底部是<em>{{launch_project}}</em>、本<em>{{manual}}</em>和编辑器的<em>{{settings}}</em>。下方显示当前打开的项目文件夹。</li>
    <li><strong>顶部栏：</strong>当前的 <code>.rpy</code> 文件、<em>{{target_label}}</em>、用于选择面板的<em>{{panels_show}}</em>菜单、<em>{{clear_all}}</em>和<em>{{save_to_file}}</em>。</li>
    <li><strong>工作区：</strong>文件列表、块面板、场景的块列表、场景预览和代码预览。</li>
  </ul>
  <div class="man-tip"><strong>提示：</strong>随时按 <kbd>F1</kbd> 打开本手册。</div>
</section>

<section id="projects">
  <h2>项目</h2>
  <h3>打开项目</h3>
  <p>点击<strong>{{open_project}}</strong>，选择游戏的文件夹（包含 <code>game</code> 文件夹的那个）或直接选择 <code>game</code> 文件夹。编辑器会记住最后一个项目，下次自动打开。</p>
  <p>打开时，编辑器会创建缺少的内容：<code>audio</code>、<code>images/characters</code>、<code>images/backgrounds</code>、<code>images/scenes</code> 和 <code>images/expressions</code> 文件夹，以及保存声明的文件（<code>characters.rpy</code>、<code>backgrounds.rpy</code>、<code>scenes.rpy</code>、<code>expressions.rpy</code>、<code>animations.rpy</code>、<code>positions.rpy</code> 和 <code>audio.rpy</code>）。其他文件不会被改动。</p>
  <p>如果有图像声明在其他名称的文件夹中，编辑器会询问是否将它们移到英文名称的文件夹并更新 <code>.rpy</code> 中的路径。你可以拒绝。</p>
  <h3>新建项目</h3>
  <p>点击<strong>{{new_project}}</strong>，输入名称，选择<strong>分辨率</strong>（1920×1080 是比较折中的选择）和游戏的<strong>界面颜色</strong>。项目会由 Ren'Py 创建在你的<em>{{projects_dir}}</em>中（如果尚未设置，编辑器会询问），并自动打开。</p>
  <h3>在编辑器外所做的修改</h3>
  <p>如果你用其他程序修改了 <code>.rpy</code> 文件（或由 Claude 修改，参见 <a href="#claude">{{claude_connection}}</a>），编辑器会察觉并重新加载项目数据。</p>
</section>

<section id="declarations">
  <h2>{{declarations}}：角色、图像等</h2>
  <p><strong>{{declarations}}</strong>窗口汇集了故事用到的一切：角色、角色的图像、背景……在这里添加的内容会出现在各个块的选择器中。它包含以下选项卡：</p>
  <ul>
    <li><strong>{{tab_characters}}：</strong>每个角色有一个「{{char_id}}」（代码中使用的名称）、一个「{{char_name}}」、名字的颜色以及表情的标签。</li>
    <li><strong>{{tab_sprites}}：</strong>每个角色的图像，按类型分组（例如一套服装）。命名方式为 <code>角色_类型_编号</code>（例如 <code>Ryu_hunter_1</code>）。可以逐张添加，也可以用<em>{{add_batch}}</em>一次添加很多张。</li>
    <li><strong>{{tab_expressions}}：</strong>伴随对话出现的侧边头像（side image）。</li>
    <li><strong>{{tab_backgrounds}}</strong>和<strong>{{tab_scenes}}：</strong>各个地点的背景，以及特定时刻的插图（CG）。</li>
    <li><strong>{{tab_animations}}</strong>和<strong>{{tab_positions}}：</strong>显示角色时可以使用的 <code>transform</code> 和位置。</li>
  </ul>
  <p>删除某项时，编辑器会询问是否同时删除图像文件，还是保留它。</p>
</section>

<section id="scenes">
  <h2>{{nav_scenes}}：块编辑器</h2>
  <p>这是主要部分。一个场景就是一个 Ren'Py <code>label</code>，其内容是一系列块。</p>
  <h3>文件和目标 label</h3>
  <ul>
    <li>在<strong>{{panel_files}}</strong>面板中选择当前的 <code>.rpy</code> 文件。<strong>+</strong> 可新建文件。</li>
    <li>在<strong>{{target_label}}</strong>中选择要编辑的 label：编辑器会加载它的块。如果选择<em>{{end_of_file}}</em>，保存的内容会作为新内容追加到文件末尾。</li>
  </ul>
  <h3>添加和排列块</h3>
  <p><strong>{{palette_title}}</strong>面板按颜色给块分组：<em>{{block_group_text}}、{{block_group_scene}}、{{block_group_flow}}、{{block_group_audio}}、{{block_group_advanced}}</em>（如果已开启补丁，还有<em>{{block_group_patch}}</em>）。点击会打开它的表单；新块会放在<strong>所选块的下方</strong>。</p>
  <p>点击一个块即可选中：会出现它的操作（<em>{{btn_edit}}、{{btn_duplicate}}、{{btn_duplicate_end}}、{{btn_move_up}}、{{btn_move_down}}、{{btn_delete}}</em>），预览会显示该时刻的场景。双击可编辑。也可以拖动块来调整顺序。</p>
  <table>
    <tr><th>按键</th><th>操作</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>选择上一个或下一个块</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>上移或下移块</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>编辑块</td></tr>
    <tr><td><kbd>Delete</kbd></td><td>删除块（会先确认）</td></tr>
  </table>
  <h3>保存</h3>
  <p><strong>{{save_to_file}}</strong>会把块写入当前文件：如果有目标 label，会<strong>替换它的全部内容</strong>（会先确认）；否则追加到末尾。<strong>{{clear_all}}</strong>会清空块列表，但不会改动文件。</p>
  <p>如果有未保存的修改，而你切换了 label 或文件，编辑器会在丢弃之前提醒你。</p>
  <h3>面板</h3>
  <p>通过<strong>{{panels_show}}</strong>选择要显示的面板：<em>{{panel_files}}、{{panel_palette}}、{{panel_preview}}</em>和<em>{{panel_code}}</em>。拖动边缘可调整面板大小；双击边缘可恢复初始大小。编辑器会记住你的布局。</p>
</section>

<section id="blocks">
  <h2>块的类型</h2>
  <h3>{{block_group_text}}</h3>
  <ul>
    <li><strong>{{block_dialogue}}：</strong>角色说的话。可以为这一刻选择一个侧边<em>表情</em>，也可以标记为<em>内心想法</em>（以斜体显示在 &lt;&lt; &gt;&gt; 之间）。</li>
    <li><strong>{{block_narration}}：</strong>旁白文字，没有名字。</li>
  </ul>
  <h3>{{block_group_scene}}</h3>
  <ul>
    <li><strong>{{block_scene}}：</strong>显示背景或插图（<code>scene</code>），并移除所有角色。可以添加转场（<code>with</code>）并模糊图像。</li>
    <li><strong>{{block_show}}：</strong>让角色出现（<code>show</code>）。可以选择图像、位置或动画（<code>at</code>）、转场、是否在另一张图像后面（<code>behind</code>）、是否翻转（<code>xflip</code>）或模糊。</li>
    <li><strong>{{block_show_multi}}：</strong>同时显示多个角色，使用同一个转场。</li>
    <li><strong>{{block_hide}}</strong>和<strong>{{block_hide_multi}}：</strong>把角色从画面中移除（<code>hide</code>）。编辑器会根据之前的块推荐当前在画面上的角色。</li>
    <li><strong>{{block_solid}}：</strong>一层纯色（例如淡出到黑色或叠加色调），可设置不透明度。</li>
  </ul>
  <h3>{{block_group_flow}}</h3>
  <ul>
    <li><strong>{{block_menu}}：</strong>选项菜单（<code>menu</code>）。每个选项可以跳转到某个 label（<code>jump</code>）、调用它（<code>call</code>）、执行代码或包含自己的块。可以在选项旁显示一个角色，并把选项放在左侧，像内心独白气泡一样。</li>
    <li><strong>{{block_condition}}：</strong>仅在条件满足时执行的块（<code>if</code>），可选 <code>elif</code> 和 <code>else</code>。例如：<code>youqing &gt;= 3 and not gaobai</code>。</li>
    <li><strong>{{block_jump}}：</strong>跳转到另一个 label，不再返回。</li>
    <li><strong>{{block_call}}：</strong>前往另一个 label，当它以 <code>return</code> 结束时回到这里。适合在多处重复使用的内容。</li>
    <li><strong>{{block_label}}：</strong>新建一个 label，放在当前位置之后或文件末尾。</li>
    <li><strong>{{block_pause}}：</strong>等待几秒；如果留空，则等待玩家点击。</li>
  </ul>
  <h3>{{block_group_audio}}</h3>
  <ul>
    <li><strong>{{block_music}}：</strong>播放（<code>play</code>）、排队（<code>queue</code>）或停止（<code>stop</code>）音乐，可选择是否循环。选择前可以试听 <code>game/audio</code> 中的文件。</li>
  </ul>
  <h3>{{block_group_advanced}}</h3>
  <ul>
    <li><strong>{{block_comment}}：</strong>给自己的备注，不会出现在游戏中。</li>
    <li><strong>{{block_custom}}：</strong>没有专属块的任意 Ren'Py 代码。</li>
  </ul>
  <h3>块中的块</h3>
  <p>「{{block_menu}}」的选项和「{{block_condition}}」的分支都可以包含其他块。它们的表单里有一排用于添加的按钮，以及一个可以编辑、排序或删除的列表。</p>
</section>

<section id="preview">
  <h2>{{scene_preview}}和{{code_preview}}</h2>
  <h3>{{scene_preview}}</h3>
  <p>显示所选块时的场景：背景、各就各位的角色、带名字和文字的对话框，或选项菜单。它使用你的 <code>gui.rpy</code> 中的分辨率、颜色、字体和尺寸，因此与游戏非常接近。不会播放转场和动画。</p>
  <p>拖动下边缘可以调整它的高度。</p>
  <h3>{{code_preview}}</h3>
  <p>显示由你的块生成的 Ren'Py 代码。你可以<strong>直接编辑</strong>：块会跟随你输入的内容更新。<kbd>Ctrl</kbd>+<kbd>Z</kbd> 撤销，<kbd>Ctrl</kbd>+<kbd>Y</kbd> 重做。<em>{{copy_code}}</em>会复制到剪贴板，<em>{{export}}</em>会保存为单独的文件。</p>
  <div class="man-tip"><strong>{{spellcheck}}：</strong>在{{settings}}中开启后，故事文本中的拼写错误会被标出下划线。右键单击单词可查看建议或将其加入词典。</div>
</section>

<section id="map">
  <h2>{{map_title}}</h2>
  <p><strong>{{map_button}}</strong>把所有场景（label）显示为相互连接的卡片，让你一眼看出故事如何推进、每个选项通向哪里。</p>
  <ul>
    <li>每张卡片显示 label 的名称、背景缩略图、摘要（第一句台词，或写在 <code>label 名称:</code> 之后的注释）、角色和选项的数量以及篇幅。</li>
    <li>连线表示<strong>{{map_legend_jump}}</strong>（实线）、<strong>{{map_legend_call}}</strong>（虚线）和<strong>{{map_legend_choice}}</strong>，并附有选项文字和条件（如果有）。</li>
    <li>标记：<strong>{{map_badge_start}}</strong>（<code>start</code> 这个 label）、<strong>{{map_badge_ending}}</strong>（游戏结束）、<strong>{{map_badge_missing}}</strong>（有跳转指向尚未编写的 label）和<strong>{{map_badge_unreachable}}</strong>（没有任何地方通向该场景）。含补丁内容的场景带有「{{map_patch}}」标记。</li>
    <li>带参数的 label（辅助例程）不会显示，以免地图过于拥挤。</li>
  </ul>
  <h3>浏览地图</h3>
  <p>拖动可移动视图，使用鼠标滚轮（或<em>{{map_zoom_in}}、{{map_zoom_out}}</em>和<em>{{map_fit}}</em>）可缩放。</p>
  <h3>侧边面板</h3>
  <ul>
    <li><strong>{{map_tab_scene}}：</strong>点击卡片可查看它所在的文件、通向哪些场景、从哪些场景到达，以及它的角色和选项及每个选项的效果。<em>{{map_open}}</em>会在场景编辑器中加载它。</li>
    <li><strong>{{map_tab_vars}}：</strong>故事中的变量、初始值、在哪里被修改、在哪里被检查。点击某个变量会在地图上高亮这些场景。如果变量没有初始值，编辑器会建议添加 <code>default</code>。</li>
  </ul>
</section>

<section id="main-menu">
  <h2>{{main_menu_button}}</h2>
  <p>无需写代码即可设计游戏的主菜单。开启<strong>{{mm_enabled}}</strong>并调整：</p>
  <ul>
    <li><strong>背景：</strong>项目原有的背景、纯色、图片、动态 GIF（Ren'Py 不能播放 GIF，所以编辑器会提取其帧）或视频（推荐 WebM）。</li>
    <li><strong>上层：</strong>原菜单的深色侧边面板，以及背景的变暗效果。</li>
    <li><strong>标题</strong>和<strong>版本号：</strong>文字、大小、字体、颜色、描边和位置。</li>
    <li><strong>按钮：</strong>显示哪些按钮（{{mm_btn_start}}、{{mm_btn_load}}、{{mm_btn_preferences}}、{{mm_btn_about}}、{{mm_btn_help}}、{{mm_btn_quit}}），纵向或横向排列、对齐、间距、颜色和背景。每个按钮可以是文字、图片或带背景图片的文字，并可以有<em>独立位置</em>。</li>
    <li>菜单的<strong>音乐</strong>，来自 <code>game/audio</code> 文件夹。</li>
  </ul>
  <p>在预览中可以<strong>拖动</strong>标题和按钮来摆放。<em>{{mm_save}}</em>写入项目，<em>{{mm_test}}</em>启动游戏，<em>{{mm_reset}}</em>恢复初始值，<em>{{discard_changes}}</em>放弃未保存的内容。</p>
  <h3>字体</h3>
  <p>字体会被复制到游戏中，所以只提供<strong>许可证允许分发</strong>的字体。大多数系统字体（Arial、Calibri……）不允许分发。使用<em>{{mm_fonts_get_free}}</em>获取更多字体。</p>
</section>

<section id="gui">
  <h2>{{gui_editor_title}}</h2>
  <p>修改游戏界面的外观（即 <code>gui.rpy</code> 定义的内容），并立即看到效果。预览有三个选项卡：<strong>{{gui_tab_dialogue}}</strong>、<strong>{{gui_tab_choice}}</strong>和<strong>{{gui_tab_menu}}</strong>；左侧的设置会随选项卡变化。</p>
  <ul>
    <li><strong>{{gui_section_text}}：</strong>对话、名字和菜单的字体与字号；颜色；强调色；<em>{{gui_cps}}</em>（每秒显示的字数；0 = 一次全部显示）。</li>
    <li><strong>{{gui_section_textbox}}</strong>和<strong>{{gui_section_name}}：</strong>文字的高度、位置和宽度，对齐方式以及名字框。</li>
    <li><strong>{{gui_section_choice}}</strong>和<strong>{{gui_section_menu}}：</strong>尺寸、颜色（普通、悬停、选中）和背景。</li>
  </ul>
  <p>每张图片（对话框、名字框、按钮、菜单背景）都可以选择「{{gui_image_keep}}」（项目已有的图片）、「{{gui_image_own}}」或「{{gui_image_generated}}」（编辑器按你选择的颜色、不透明度、圆角和边距绘制）。第一次替换某张图片前，编辑器会把原图保存在 <code>gui/editor_backup</code>。</p>
  <p>在预览中可以<strong>拖动</strong>对话框、名字和按钮来移动它们并调整大小。</p>
  <h3>Google Fonts</h3>
  <p><em>{{gfonts_open}}</em>会打开一个采用 SIL Open Font License 的字体目录，这些字体可以随你的游戏使用和分发。添加时，字体及其许可证会下载到项目的 <code>fonts</code> 文件夹。也可以从文件添加字体。</p>
  <p><em>{{save}}</em>只写入修改过的值；<em>{{discard_changes}}</em>放弃未保存的内容。</p>
</section>

<section id="game-settings">
  <h2>{{game_settings}}</h2>
  <h3>{{game_tab_general}}</h3>
  <ul>
    <li><strong>{{game_name}}</strong>和<strong>{{game_version}}</strong>（<code>config.name</code> 和 <code>config.version</code>）。</li>
    <li><strong>{{game_build_name}}</strong>（<code>build.name</code>）：不能有空格或重音符号；用于构建生成的文件。在你手动修改前，它会跟随游戏名称变化。</li>
    <li><strong>{{game_icon}}：</strong>选择一张图片（最好是正方形，512×512 或更大），编辑器会生成窗口图标以及 Windows（<code>icon.ico</code>）和 Mac（<code>icon.icns</code>）图标。</li>
  </ul>
  <p>存档文件夹不会随名称改变，这样玩家在游戏更新后不会丢失存档。</p>
  <h3>{{patch}}</h3>
  <p>参见<a href="#patch">补丁</a>。</p>
</section>

<section id="build">
  <h2>{{build_game}}</h2>
  <p><strong>{{build_game}}</strong>会生成他人可以下载并在没有 Ren'Py 的情况下游玩的文件。选择系统：</p>
  <ul>
    <li><strong>{{build_pkg_win}}</strong>（.zip）、<strong>{{build_pkg_linux}}</strong>（.tar.bz2）和<strong>{{build_pkg_mac}}</strong>（压缩为 .zip 的应用）。</li>
    <li><strong>{{build_pkg_pc}}：</strong>两个系统共用一个 .zip。</li>
    <li><strong>{{build_pkg_market}}：</strong>包含三个系统的 .zip，可直接上传到商店。</li>
  </ul>
  <p>选择目标文件夹并点击<em>{{build_start}}</em>。你会看到进度；期间可以隐藏对话框（完成时会通知你）或停止构建。完成后，<em>{{build_open_folder}}</em>会带你找到文件。</p>
  <p>如果你的小说有补丁，也在这里选择要构建的版本（参见<a href="#patch">补丁</a>）。</p>
  <h3>测试游戏</h3>
  <p>侧边栏的<strong>{{launch_project}}</strong>会用 Ren'Py 按已保存的状态打开你的小说。如果代码有错误，Ren'Py 会在启动时显示。</p>
</section>

<section id="patch">
  <h2>补丁</h2>
  <p>有些小说在 Steam 等商店发布时会去掉部分内容，作者再在自己的网站上把这些内容作为<strong>补丁</strong>提供，玩家自行加入游戏。编辑器会为你准备好一切。</p>
  <h3>1. 开启补丁</h3>
  <p>在<strong>{{game_settings}} → {{patch}}</strong>中开启「{{patch_enable}}」，为补丁命名，并写下给玩家的说明（会以文本文件的形式放入补丁）。右侧可以看到补丁包含的内容以及可能的问题。</p>
  <h3>2. 标记补丁内容</h3>
  <ul>
    <li><strong>「{{block_patch}}」块</strong>（面板中的「{{block_group_patch}}」组）。它有两部分：
      <ul>
        <li><strong>{{patch_with}}：</strong>只有装了补丁的玩家才能看到的块。它们单独保存在 <code>game/patch/</code> 中。</li>
        <li><strong>{{patch_without}}：</strong>没有补丁的玩家（例如 Steam 玩家）看到的内容。可以留空：故事会直接继续。</li>
      </ul>
      要保存补丁内容，场景必须有一个「{{target_label}}」。</li>
    <li><strong>图像：</strong>通过<em>{{patch_choose_images}}</em>标记只放进补丁的图像。编辑器会把它们连同声明一起移到 <code>images/patch/</code>。取消勾选即可放回游戏中。</li>
  </ul>
  <p>场景预览中会出现<strong>{{patch_without}} / {{patch_with}}</strong>切换，用来查看两个版本；地图上含补丁内容的场景也会带有标记。</p>
  <h3>3. 构建</h3>
  <p>在<strong>{{build_game}}</strong>中选择：</p>
  <ul>
    <li><strong>{{build_patch_split}}：</strong>用于 Steam。游戏不包含补丁内容（即使是锁定状态也没有），补丁则是单独的 .zip，内容已打包、没有可读代码，并附有说明。</li>
    <li><strong>{{build_patch_full}}：</strong>所有内容都在同一个游戏里，适用于你的网站或 itch.io。</li>
    <li><strong>{{build_patch_base}}：</strong>补丁没有变化时，用来上传更新。</li>
  </ul>
  <p>构建前，编辑器会检查游戏中没有任何内容依赖补丁：例如某张补丁图像也用在普通场景里，或跳转到只存在于补丁中的场景。</p>
  <h3>给玩家</h3>
  <p>安装补丁就是把 .zip 解压到游戏文件夹（可执行文件所在的位置）。游戏会自动识别。在 Mac 上，游戏文件夹位于应用内部；如果你发布 Mac 版，请在说明中解释这一点。</p>
  <div class="man-note"><strong>商店规则：</strong>在 Steam 或其他商店发布前，请查看其关于在商店之外添加内容的规定。</div>
</section>

<section id="settings">
  <h2>编辑器{{settings}}</h2>
  <ul>
    <li><strong>{{theme}}：</strong><em>{{theme_dark}}、{{theme_light}}、{{theme_oled}}</em>或<em>{{theme_custom}}</em>。选择自定义时，<em>{{custom_theme_edit}}</em>会打开一个编辑器，让你选择界面和代码的颜色，修改会立即生效。<em>{{custom_theme_reset}}</em>恢复初始颜色，<em>{{cancel}}</em>放弃修改。</li>
    <li><strong>{{language}}：</strong>西班牙语、英语、德语、法语、意大利语、葡萄牙语、俄语、简体中文、繁体中文和日语。</li>
    <li><strong>{{spellcheck}}：</strong>用于检查故事文本的语言。</li>
    <li><strong>Ren'Py：</strong>当前使用的安装，以及更换或另装一个的按钮。</li>
    <li><strong>{{projects_dir}}：</strong>新项目的创建位置。</li>
    <li><strong>{{claude_connection}}：</strong>参见下一节。</li>
  </ul>
</section>

<section id="claude">
  <h2>{{claude_connection}}</h2>
  <p>如果你使用 <strong>Claude Code</strong> 或 <strong>Claude Desktop</strong>，可以把它连接到编辑器，用自己的话询问关于小说的问题：「第二天有哪些选项？」「给我看看这个场景开头的样子」「在这个选项里加一个新选择」……它使用你自己的 Claude 账号，在编辑器打开时工作。</p>
  <h3>开启</h3>
  <ol>
    <li>在<strong>{{settings}} → {{claude_connection}}</strong>中勾选「{{claude_enable}}」。默认是关闭的。</li>
    <li><strong>Claude Code：</strong>点击<em>{{claude_copy_command}}</em>，在终端中运行一次。</li>
    <li><strong>Claude Desktop：</strong>点击<em>{{claude_desktop_add}}</em>（编辑器会先备份它的配置），然后重启 Claude Desktop。</li>
  </ol>
  <p>状态会显示 Claude 是否已连接以及发出了多少次请求。连接只接受你电脑上持有密钥的程序。<em>{{claude_new_key}}</em>会使旧密钥失效（需要重新运行 Claude Code 的命令）；如果有其他程序占用同一端口，可以在「{{claude_port}}」中更改。</p>
  <h3>Claude 能做什么</h3>
  <ul>
    <li><strong>查询：</strong>项目、故事地图、任意 label 或文件的代码、角色、图像和音频、变量、界面设置，以及问题检查（跳转到不存在的 label、缺少的图像或音频……）。</li>
    <li><strong>修改：</strong>编写或编辑 label 和文件，添加角色、背景、插图和变量，修改界面或游戏的名称和版本。</li>
    <li><strong>查看与展示：</strong>获取场景中任意时刻的画面，在编辑器或地图中打开 label，以及启动游戏。</li>
  </ul>
  <h3>Claude 的修改与撤销</h3>
  <p>每次修改前，编辑器都会备份受影响的文件，并记录在<strong>{{claude_changes}}</strong>中（在同一个设置区域）。你可以在那里<strong>撤销</strong>任意修改；如果文件之后又被修改过，会先提醒你。Claude 每次修改都会出现通知；如果它修改的是你正在打开的 label，编辑器会重新加载（如果你有未保存的修改，则会询问要保留哪个版本）。</p>
</section>

<section id="files">
  <h2>编辑器创建的文件</h2>
  <table>
    <tr><th>文件或文件夹</th><th>用途</th></tr>
    <tr><td><code>characters.rpy</code>、<code>backgrounds.rpy</code>、<code>scenes.rpy</code>、<code>expressions.rpy</code></td><td>角色和图像的声明</td></tr>
    <tr><td><code>animations.rpy</code>、<code>positions.rpy</code>、<code>audio.rpy</code></td><td>动画、位置和音频</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> 及其 <code>.rpy</code></td><td>自定义主菜单</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>修改前界面的原始图片</td></tr>
    <tr><td><code>fonts/</code></td><td>添加的字体及其许可证</td></tr>
    <tr><td><code>patch_support.rpy</code>、<code>patch/</code>、<code>images/patch/</code></td><td>补丁（开启时）</td></tr>
    <tr><td><code>.renpy-editor/</code>（与 <code>game</code> 同级）</td><td>补丁设置和 Claude 修改的备份。不会包含在游戏中。</td></tr>
  </table>
</section>

<section id="report">
  <h2>{{report_title}}</h2>
  <p>如果某些功能无法使用，或你觉得缺少什么，请点击侧边栏中的<strong>{{report_button}}</strong>。你的消息会直接发送给编辑器的作者。</p>
  <ul>
    <li>选择「{{report_kind_bug}}」或「{{report_kind_idea}}」，填写标题并详细描述。如果是问题，说明你当时在做什么、期望发生什么、实际发生了什么，会非常有帮助。</li>
    <li><strong>{{report_email}}</strong>：仅用于回复你。</li>
    <li><strong>{{report_tech}}</strong>会附上编辑器版本、系统和语言。发送前你可以看到具体包含的内容；你的小说和文件永远不会被发送。</li>
  </ul>
  <p>如果没有网络连接，可以使用<em>{{report_copy}}</em>，通过其他方式发送。</p>
</section>

<section id="troubleshooting">
  <h2>常见问题</h2>
  <dl>
    <dt>「{{renpy_required_title}}」或游戏无法启动</dt>
    <dd>在{{settings}} → Ren'Py 中检查路径是否指向你的 <code>renpy.exe</code>，或使用<em>{{renpy_change_or_install}}</em>。</dd>
    <dt>选择器中没有某个角色或背景</dt>
    <dd>它必须在<a href="#declarations">{{declarations}}</a>窗口中声明（或写在编辑器的声明文件中）。</dd>
    <dt>预览中出现写着图像名称的方框</dt>
    <dd>该图像未声明或文件不存在。地图和 Claude 的检查也能帮你找到这类情况。</dd>
    <dt>找不到已安装的字体</dt>
    <dd>只显示许可证允许自由使用的字体，因为字体会被复制到游戏中。可以在 Google Fonts 中找一款相似的。</dd>
    <dt>某个 label 的修改丢失了</dt>
    <dd>{{save_to_file}}会替换目标 label 的内容。如果修改是 Claude 做的，可以在<em>{{claude_changes}}</em>中撤销。</dd>
  </dl>
</section>
`
};
