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

// 保存原始值
editableNodes.forEach(node => {
  originalValues.set(node, node.textContent.trim());
});

editModeBtn.addEventListener('click', toggleEditMode);
copyChangesBtn.addEventListener('click', copyChanges);
resetChangesBtn.addEventListener('click', resetChanges);

// 监听文案修改
editableNodes.forEach(node => {
  node.addEventListener('blur', () => {
    if (!editMode) return;
    const label = node.dataset.editLabel || '未命名字段';
    const oldValue = originalValues.get(node) || '';
    const newValue = node.textContent.trim();
    if (oldValue === newValue) return;

    const existingIndex = changes.findIndex(c => c.label === label);
    if (existingIndex >= 0) {
      changes[existingIndex].newValue = newValue;
      if (changes[existingIndex].oldValue === newValue) {
        changes.splice(existingIndex, 1);
      }
    } else {
      changes.push({ label, oldValue, newValue });
    }

    updateChangesUI();
  });
});

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

function updateChangesUI() {
  const count = changes.length;
  changesCount.textContent = count + ' 条';
  copyChangesBtn.disabled = count === 0;
  resetChangesBtn.disabled = count === 0;

  if (count === 0) {
    changesPanel.classList.remove('show');
    changesPreview.textContent = '暂无修改';
  } else {
    changesPanel.classList.add('show');
    changesPreview.textContent = buildChangeText();
  }
}

function buildChangeText() {
  const lines = ['【AI输出结果交互修改记录】', ''];
  changes.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.label}`);
    lines.push(`   修改前：${item.oldValue || '（空）'}`);
    lines.push(`   修改后：${item.newValue || '（空）'}`);
    lines.push('');
  });
  return lines.join('\n');
}

async function copyChanges() {
  if (changes.length === 0) return;
  const text = buildChangeText();
  try {
    await navigator.clipboard.writeText(text);
    showToast('修改记录已复制');
    copyChangesBtn.textContent = '已复制';
    setTimeout(() => { copyChangesBtn.textContent = '复制修改记录'; }, 1500);
  } catch (e) {
    showToast('复制失败，请手动复制');
  }
}

function resetChanges() {
  if (changes.length === 0) return;
  if (!confirm('确定要重置所有修改吗？')) return;

  editableNodes.forEach(node => {
    const original = originalValues.get(node) || '';
    node.textContent = original;
  });
  changes = [];
  updateChangesUI();
  showToast('已重置为原始文案');
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}
