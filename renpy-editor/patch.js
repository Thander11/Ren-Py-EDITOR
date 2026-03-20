const fs = require('fs');

let text = fs.readFileSync('src/renderer.js', 'utf8');

// 1. BLOCK_META
text = text.replace(
  "  menu:       { icon: '?', labelKey: 'block_menu',        color: '#e67e22' },",
  "  menu:       { icon: '?', labelKey: 'block_menu',        color: '#e67e22' },\n  condition:  { icon: '??', labelKey: 'block_condition',   color: '#ff7f50' },"
);

// 2. blockDesc
text = text.replace(
  "    case 'menu':      return ${b.choices?.length||0} opciones: ;",
  "    case 'menu':      return ${b.choices?.length||0} opciones: ;\n    case 'condition': return t('block_condition') + ': ' + truncate(b.condition, 30);"
);

// 3. generateBlockCode
text = text.replace(
  "    case 'menu': {",
  "    case 'condition': {\n      let res = ${indent}if :\\n;\n      if (b.ifBlocks && b.ifBlocks.length) {\n        res += b.ifBlocks.map(sub => generateBlockCode(sub, indent + '    ')).join('\\n');\n      } else {\n        res += ${indent}    pass;\n      }\n      if (b.elseBlocks && b.elseBlocks.length) {\n        res += \\nelse:\\n;\n        res += b.elseBlocks.map(sub => generateBlockCode(sub, indent + '    ')).join('\\n');\n      }\n      return res;\n    }\n    case 'menu': {"
);

// 4. buildModalBody
text = text.replace(
  "    case 'menu': return buildMenuBody(b);",
  "    case 'menu': return buildMenuBody(b);\n    case 'condition': return buildConditionBody(b);"
);

// 5. readModalValues 
text = text.replace(
  "    case 'menu': {",
  "    case 'condition': {\n      b.condition = document.getElementById('f-condition')?.value || '';\n      try { b.ifBlocks = JSON.parse(document.getElementById('cb-if')?.value || '[]'); } catch(e) { b.ifBlocks = []; }\n      try { b.elseBlocks = JSON.parse(document.getElementById('cb-else')?.value || '[]'); } catch(e) { b.elseBlocks = []; }\n      break;\n    }\n    case 'menu': {"
);

// Allow nested condition and menu
text = text.replace(
    "['narration','dialogue','show','show_multi','hide','hide_multi','scene','pause','music','jump','call','comment','custom']",
    "['narration','dialogue','show','show_multi','hide','hide_multi','scene','menu','condition','pause','music','jump','call','comment','custom']"
);

// Variable setup
text = text.replace(
    "let choiceBlockContext = null;",
    "let choiceBlockContext = null;\nlet conditionBlockContext = null;"
);


// Modal patches
text = text.replace(
    if (choiceBlockContext) {\n    const { savedMenuBlock, savedEditingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop, choiceIdx } = choiceBlockContext;,
    if (conditionBlockContext) {\n    const { savedConditionBlock, savedEditingIndex, savedConditionScrollTop, savedBranchScrollTop, branch } = conditionBlockContext;\n    conditionBlockContext = null;\n    editingIndex = savedEditingIndex;\n    pendingBlock = {};\n    openModal('condition', savedConditionBlock);\n    restoreConditionPosition(branch, savedConditionScrollTop, savedBranchScrollTop);\n    return;\n  }\n  if (choiceBlockContext) {\n    const { savedMenuBlock, savedEditingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop, choiceIdx } = choiceBlockContext;
);

text = text.replace(
    if (choiceBlockContext) {\n    const { choiceIdx, blockIdx, savedMenuBlock, savedMenuScrollTop, savedChoiceBlocksScrollTop } = choiceBlockContext;,
    if (conditionBlockContext) {\n    const { branch, blockIdx, savedConditionBlock, savedConditionScrollTop, savedBranchScrollTop } = conditionBlockContext;\n    const blocksArr = branch === 'if' ? savedConditionBlock.ifBlocks : savedConditionBlock.elseBlocks;\n    if (blockIdx >= 0) {\n      blocksArr[blockIdx] = b;\n    } else {\n      blocksArr.push(b);\n    }\n    const ctx = conditionBlockContext;\n    conditionBlockContext = null;\n    editingIndex = ctx.savedEditingIndex;\n    document.getElementById('modal-overlay').classList.remove('open');\n    pendingBlock = {};\n    openModal('condition', savedConditionBlock);\n    restoreConditionPosition(branch, savedConditionScrollTop, savedBranchScrollTop);\n    notify(ctx.blockIdx >= 0 ? t('btn_edit') : t('block_added'), 'ok');\n    return;\n  }\n  if (choiceBlockContext) {\n    const { choiceIdx, blockIdx, savedMenuBlock, savedMenuScrollTop, savedChoiceBlocksScrollTop } = choiceBlockContext;
);

// Validate Preview patches (for inner block sprites, around line 1125):
text = text.replace(
    if (choiceBlockContext && blockList === blocks) {\n    const currentMenuBlock = choiceBlockContext.savedMenuBlock;,
    if (conditionBlockContext && blockList === blocks) {\n    const curr = conditionBlockContext.savedConditionBlock;\n    const arr = conditionBlockContext.branch === 'if' ? curr.ifBlocks : curr.elseBlocks;\n    if (arr) {\n      const innerLimit = conditionBlockContext.blockIdx >= 0 ? conditionBlockContext.blockIdx : arr.length;\n      for (let i = 0; i < innerLimit; i++) {\n        const b = arr[i];\n        if (!b) continue;\n        if (b.type === 'show' && b.image) shown.set(b.image, b.image);\n        else if (b.type === 'show_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.set(sp.image, sp.image); });\n        else if (b.type === 'hide' && b.image) shown.delete(b.image);\n        else if (b.type === 'hide_multi' && b.sprites) b.sprites.forEach(sp => { if (sp.image) shown.delete(sp.image); });\n        else if (b.type === 'scene') shown.clear();\n      }\n    }\n  }\n  if (choiceBlockContext && blockList === blocks) {\n    const currentMenuBlock = choiceBlockContext.savedMenuBlock;
);

const addition = \

// ==========================================
// CONDITION BLOCKS LOGIC
// ==========================================

function readCurrentConditionState() {
  const c = document.getElementById('f-condition')?.value || '';
  let ifBlocks = [];
  let elseBlocks = [];
  try { ifBlocks = JSON.parse(document.getElementById('cb-if')?.value || '[]'); } catch(e){}
  try { elseBlocks = JSON.parse(document.getElementById('cb-else')?.value || '[]'); } catch(e){}
  return { type: 'condition', condition: c, ifBlocks, elseBlocks };
}

function buildConditionBody(b) {
  const ifBlocksJson = b.ifBlocks ? escHtml(JSON.stringify(b.ifBlocks)) : '[]';
  const elseBlocksJson = b.elseBlocks ? escHtml(JSON.stringify(b.elseBlocks)) : '[]';
  
  const targetTypes = ['narration','dialogue','show','show_multi','hide','hide_multi','scene','menu','condition','pause','music','jump','call','comment','custom'];
  const getBtns = (branch) => targetTypes.map(t2 => {
    const m = BLOCK_META[t2];
    return \\\<button class="btn btn-secondary" style="font-size:10px;padding:3px 8px;" onclick="addConditionBlock('\\\\'\\\\\','\\\\'\\\\\')">\</button>\\\;
  }).join('');

  const html = \\\
    <div style="font-size:11px;color:var(--text2);margin-bottom:10px;">\</div>
    <div class="form-group">
      <label class="form-label">\</label>
      <input class="form-input" id="f-condition" value="\" placeholder="flag_name == True">
    </div>
    
    <div class="choice-item" style="margin-bottom: 12px;">
      <div class="form-label" style="margin-bottom: 8px;"><b>\</b></div>
      <input type="hidden" id="cb-if" value="\">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">\</div>
      <div id="cbl-if" class="choice-blocks-list"></div>
    </div>

    <div class="choice-item">
      <div class="form-label" style="margin-bottom: 8px;"><b>\</b></div>
      <input type="hidden" id="cb-else" value="\">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">\</div>
      <div id="cbl-else" class="choice-blocks-list"></div>
    </div>
  \\\;
  setTimeout(() => {
    renderConditionBlocks('if');
    renderConditionBlocks('else');
  }, 60);
  return html;
}

function getConditionBlocks(branch) {
  try { return JSON.parse(document.getElementById('cb-' + branch).value || '[]'); } catch(e) { return []; }
}
function setConditionBlocks(branch, arr) {
  document.getElementById('cb-' + branch).value = JSON.stringify(arr);
  renderConditionBlocks(branch);
}

function renderConditionBlocks(branch) {
  const container = document.getElementById('cbl-' + branch);
  if (!container) return;
  const bArr = getConditionBlocks(branch);
  if (!bArr.length) { container.innerHTML = ''; return; }
  container.innerHTML = bArr.map((b, j) => {
    const meta = BLOCK_META[b.type] || { icon: '?', color: 'var(--bg2)' };
    return \\\<div class="choice-subblock" draggable="true"
      ondragstart="onConditionBlockDragStart(event,'\',\)"
      ondragover="onConditionBlockDragOver(event,'\')"
      ondrop="onConditionBlockDrop(event,'\',\)"
      style="border-left: 3px solid \">
      <span style="font-size:12px;margin-right:6px;">\</span>
      <span style="flex:1;font-size:11px;color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">\</span>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="editConditionBlock('\',\)" title="\">??</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="duplicateConditionBlock('\',\)" title="\">??</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="duplicateConditionBlockToEnd('\',\)" title="\">??</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="moveConditionBlock('\',\,-1)" title="\">?</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--text3);padding:2px;" onclick="moveConditionBlock('\',\,1)" title="\">?</button>
      <button style="background:none;border:none;cursor:pointer;font-size:10px;color:var(--red);padding:2px;" onclick="removeConditionBlock('\',\)" title="\">??</button>
    </div>\\\;
  }).join('');
}

function restoreConditionPosition(branch, savedConditionScrollTop, savedBranchScrollTop) {
  const restoreGeneralScroll = () => {
    const modalBox = document.getElementById('modal-box');
    if (modalBox) modalBox.scrollTop = savedConditionScrollTop || 0;
  };
  setTimeout(() => {
    restoreGeneralScroll();
    const branchEl = document.getElementById('cbl-' + branch);
    if (branchEl) {
      setTimeout(() => { branchEl.scrollTop = savedBranchScrollTop || 0; }, 20);
    }
  }, 10);
  setTimeout(restoreGeneralScroll, 100);
}

function addConditionBlock(branch, type) {
  const savedConditionBlock = readCurrentConditionState();
  const savedConditionScrollTop = document.getElementById('modal-box')?.scrollTop || 0;
  const savedBranchScrollTop = document.getElementById('cbl-' + branch)?.scrollTop || 0;
  conditionBlockContext = { branch, blockIdx: -1, savedConditionBlock, savedEditingIndex: editingIndex, savedConditionScrollTop, savedBranchScrollTop };
  document.getElementById('modal-overlay').classList.remove('open');
  editingIndex = -1;
  openModal(type);
}

function editConditionBlock(branch, blockIdx) {
  const savedConditionBlock = readCurrentConditionState();
  const arr = branch === 'if' ? savedConditionBlock.ifBlocks : savedConditionBlock.elseBlocks;
  const block = arr?.[blockIdx];
  if (!block) return;
  const savedConditionScrollTop = document.getElementById('modal-box')?.scrollTop || 0;
  const savedBranchScrollTop = document.getElementById('cbl-' + branch)?.scrollTop || 0;
  conditionBlockContext = { branch, blockIdx, savedConditionBlock, savedEditingIndex: editingIndex, savedConditionScrollTop, savedBranchScrollTop };
  document.getElementById('modal-overlay').classList.remove('open');
  editingIndex = -1;
  openModal(block.type, { ...block });
}

function moveConditionBlock(branch, blockIdx, dir) {
  const bArr = getConditionBlocks(branch);
  const newIdx = blockIdx + dir;
  if (newIdx < 0 || newIdx >= bArr.length) return;
  [bArr[blockIdx], bArr[newIdx]] = [bArr[newIdx], bArr[blockIdx]];
  setConditionBlocks(branch, bArr);
}

function duplicateConditionBlock(branch, blockIdx) {
  const bArr = getConditionBlocks(branch);
  const clone = JSON.parse(JSON.stringify(bArr[blockIdx]));
  bArr.splice(blockIdx + 1, 0, clone);
  setConditionBlocks(branch, bArr);
}

function duplicateConditionBlockToEnd(branch, blockIdx) {
  const bArr = getConditionBlocks(branch);
  const clone = JSON.parse(JSON.stringify(bArr[blockIdx]));
  bArr.push(clone);
  setConditionBlocks(branch, bArr);
}

function removeConditionBlock(branch, blockIdx) {
  const bArr = getConditionBlocks(branch);
  bArr.splice(blockIdx, 1);
  setConditionBlocks(branch, bArr);
}

function onConditionBlockDragStart(e, branch, j) {
  e.dataTransfer.setData('text/plain', JSON.stringify({ sourceBranch: branch, sourceBlockIdx: j }));
  e.dataTransfer.effectAllowed = 'move';
}
function onConditionBlockDragOver(e, branch) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}
function onConditionBlockDrop(e, targetBranch, targetJ) {
  e.preventDefault();
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.sourceBranch !== targetBranch) return; // Disallow cross-branch drag for simplicity
    const sIdx = data.sourceBlockIdx;
    if (sIdx === targetJ) return;
    const bArr = getConditionBlocks(targetBranch);
    const [moved] = bArr.splice(sIdx, 1);
    bArr.splice(targetJ, 0, moved);
    setConditionBlocks(targetBranch, bArr);
  } catch (err) {}
}
\;

text += addition;

fs.writeFileSync('src/renderer.js', text, 'utf8');
