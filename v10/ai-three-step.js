const card = document.getElementById('analysisCard');
const collapseBtn = document.getElementById('collapseBtn');
const expandBtn = document.getElementById('expandBtn');
const collapseLabel = collapseBtn.querySelector('.collapse-label');
const toast = document.getElementById('toast');

const editModeBtn = document.getElementById('editModeBtn');
const copyChangesBtn = document.getElementById('copyChangesBtn');
const resetChangesBtn = document.getElementById('resetChangesBtn');
const changesPanel = document.getElementById('changesPanel');
const changesPreview = document.getElementById('changesPreview');
const changesCount = document.getElementById('changesCount');
const editTip = document.getElementById('editTip');
const editableNodes = Array.from(document.querySelectorAll('[data-editable]'));

let editMode = false;
let changes = [];
const originalValues = new Map();

editableNodes.forEach((node, index) => {
  const key = node.dataset.editKey || `field-${index}`;
  node.dataset.editKey = key;
  originalValues.set(key, node.textContent.trim());
});

function setCollapsed(collapsed) {
  card.classList.toggle('collapsed', collapsed);
  collapseBtn.setAttribute('aria-expanded', String(!collapsed));
  collapseLabel.textContent = collapsed ? '展开' : '收起';
}

collapseBtn.addEventListener('click', event => {
  if (editMode && event.target.closest('[data-editable]')) return;
  setCollapsed(!card.classList.contains('collapsed'));
});

expandBtn.addEventListener('click', event => {
  if (editMode && event.target.closest('[data-editable]')) return;
  setCollapsed(false);
});

function fallbackCopy(text) {
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1500);
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else fallbackCopy(text);
    if (button) {
      const original = button.textContent;
      button.textContent = '已复制';
      button.classList.add('copied');
      clearTimeout(copyText.timer);
      copyText.timer = setTimeout(() => {
        button.textContent = original;
        button.classList.remove('copied');
      }, 1200);
    }
    showToast('已复制');
  } catch (error) {
    showToast('复制失败，请手动复制');
  }
}

function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);
  editModeBtn.textContent = editMode ? '完成编辑' : '编辑模式';
  editModeBtn.classList.toggle('primary', !editMode);
  editModeBtn.classList.toggle('ghost', editMode);
  editTip.textContent = editMode ? '点击虚线文案可直接修改，离开焦点后记录变更' : '开启后可直接点击文案修改';

  editableNodes.forEach(node => {
    node.contentEditable = editMode ? 'true' : 'false';
    node.spellcheck = false;
  });

  if (editMode) showToast('编辑模式已开启');
  else showToast('编辑已完成，可复制修改记录');
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function recordChange(node) {
  const key = node.dataset.editKey;
  const label = node.dataset.editLabel || '文案';
  const oldValue = originalValues.get(key) || '';
  const newValue = normalizeText(node.textContent);
  if (newValue === oldValue) {
    changes = changes.filter(item => item.key !== key);
  } else {
    const existing = changes.find(item => item.key === key);
    if (existing) existing.newValue = newValue;
    else changes.push({ key, label, oldValue, newValue });
  }
  renderChanges();
}

function renderChanges() {
  changesCount.textContent = `${changes.length} 条`;
  copyChangesBtn.disabled = changes.length === 0;
  resetChangesBtn.disabled = changes.length === 0;
  changesPanel.hidden = changes.length === 0;

  if (!changes.length) {
    changesPreview.textContent = '暂无修改';
    return;
  }
  changesPreview.textContent = buildChangeText();
}

function buildChangeText() {
  const lines = ['【AI分析卡片修改记录】', ''];
  changes.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.label}`);
    lines.push(`   修改前：${item.oldValue || '（空）'}`);
    lines.push(`   修改后：${item.newValue || '（空）'}`);
    lines.push('');
  });
  return lines.join('\n');
}

function resetChanges() {
  if (!changes.length) return;
  if (!confirm('确定重置本次所有文案修改吗？')) return;
  editableNodes.forEach(node => {
    const key = node.dataset.editKey;
    node.textContent = originalValues.get(key) || '';
  });
  changes = [];
  renderChanges();
  showToast('已重置修改');
}

editableNodes.forEach(node => {
  node.addEventListener('click', event => {
    if (editMode) event.stopPropagation();
  });
  node.addEventListener('focus', () => {
    node.dataset.beforeEdit = normalizeText(node.textContent);
  });
  node.addEventListener('blur', () => recordChange(node));
  node.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      node.blur();
    }
  });
});

editModeBtn.addEventListener('click', toggleEditMode);
copyChangesBtn.addEventListener('click', () => copyText(buildChangeText(), copyChangesBtn));
resetChangesBtn.addEventListener('click', resetChanges);

renderChanges();
setCollapsed(false);
