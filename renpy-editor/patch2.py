import re

with open('src/renderer.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "let choiceBlockContext = null;",
    "let choiceBlockContext = null;\nlet conditionBlockContext = null;"
)

def build_addition():
    return '''

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
    return <button class="btn btn-secondary" style="font-size:10px;padding:3px 8px;" onclick="addConditionBlock('','')"></button>;
  }).join('');

  const html = 
    <div style="font-size:11px;color:var(--text2);margin-bottom:10px;"></div>
    <div class="form-group">
      <label class="form-label"></label>
      <input class="form-input" id="f-condition" value="" placeholder="flag_name == True">
    </div>
    
    <div class="choice-item" style="margin-bottom: 12px;">
      <div class="form-label" style="margin-bottom: 8px;"><b></b></div>
      <input type="hidden" id="cb-if" value="">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;"></div>
      <div id="cbl-if" class="choice-blocks-list"></div>
    </div>

    <div class="choice-item">
      <div class="form-label" style="margin-bottom: 8px;"><b></b></div>
      <input type="hidden" id="cb-else" value="">
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;"></div>
      <div id="cbl-else" class="choice-blocks-list"></div>
    </div>
  ;
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
    return \<div class="choice-subblock" draggable="true"
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
    </div>\;
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
'''

text += build_addition()

text = text.replace(
'''  if (choiceBlockContext) {
    const { savedMenuBlock, savedEditingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop, choiceIdx } = choiceBlockContext;''',
'''  if (conditionBlockContext) {
    const { savedConditionBlock, savedEditingIndex, savedConditionScrollTop, savedBranchScrollTop, branch } = conditionBlockContext;
    conditionBlockContext = null;
    editingIndex = savedEditingIndex;
    pendingBlock = {};
    openModal('condition', savedConditionBlock);
    restoreConditionPosition(branch, savedConditionScrollTop, savedBranchScrollTop);
    return;
  }
  if (choiceBlockContext) {
    const { savedMenuBlock, savedEditingIndex, savedMenuScrollTop, savedChoiceBlocksScrollTop, choiceIdx } = choiceBlockContext;'''
)

text = text.replace(
'''  if (choiceBlockContext) {
    const { choiceIdx, blockIdx, savedMenuBlock, savedMenuScrollTop, savedChoiceBlocksScrollTop } = choiceBlockContext;''',
'''  if (conditionBlockContext) {
    const { branch, blockIdx, savedConditionBlock, savedConditionScrollTop, savedBranchScrollTop } = conditionBlockContext;
    const blocksArr = branch === 'if' ? savedConditionBlock.ifBlocks : savedConditionBlock.elseBlocks;
    if (blockIdx >= 0) {
      blocksArr[blockIdx] = b;
    } else {
      blocksArr.push(b);
    }
    const ctx = conditionBlockContext;
    conditionBlockContext = null;
    editingIndex = ctx.savedEditingIndex;
    document.getElementById('modal-overlay').classList.remove('open');
    pendingBlock = {};
    openModal('condition', savedConditionBlock);
    restoreConditionPosition(branch, savedConditionScrollTop, savedBranchScrollTop);
    notify(ctx.blockIdx >= 0 ? t('btn_edit') : t('block_added'), 'ok');
    return;
  }
  if (choiceBlockContext) {
    const { choiceIdx, blockIdx, savedMenuBlock, savedMenuScrollTop, savedChoiceBlocksScrollTop } = choiceBlockContext;'''
)

with open('src/renderer.js', 'w', encoding='utf-8') as f:
    f.write(text)

