// ===== Tab 切换 =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('active', b === btn));
    tabPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
  });
});

// ===== Toast =====
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ===== 图片链接 Tab =====
const linkInput = document.getElementById('linkInput');
const addLinkBtn = document.getElementById('addLinkBtn');
const linkList = document.getElementById('linkList');
let links = [];

function renderLinks() {
  linkList.innerHTML = links.map((url, i) => `
    <div class="link-item">
      <span class="link-num">${i + 1}</span>
      <span class="link-text" title="${url}">${url}</span>
      <button class="link-remove" data-index="${i}" title="删除">✕</button>
    </div>
  `).join('');

  // 绑定删除事件
  linkList.querySelectorAll('.link-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      links.splice(idx, 1);
      renderLinks();
    });
  });
}

function addLink() {
  const url = linkInput.value.trim();
  if (!url) { showToast('请输入图片链接'); return; }
  if (links.length >= 10) { showToast('最多添加10条示例链接'); return; }
  links.push(url);
  linkInput.value = '';
  renderLinks();
  showToast('已添加链接');
}

addLinkBtn.addEventListener('click', addLink);
linkInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addLink();
});

// ===== 文件上传 Tab =====
const fileDropZone = document.getElementById('fileDropZone');
const fileInput = document.getElementById('fileInput');
const fileUploadEmpty = document.getElementById('fileUploadEmpty');
const fileUploading = document.getElementById('fileUploading');
const fileUploaded = document.getElementById('fileUploaded');
const fileUploadError = document.getElementById('fileUploadError');
const removeFileBtn = document.getElementById('removeFileBtn');
const removeErrorFileBtn = document.getElementById('removeErrorFileBtn');
const progressFill = document.getElementById('progressFill');
const uploadingPercent = document.getElementById('uploadingPercent');
const uploadingFileName = document.getElementById('uploadingFileName');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileMeta = document.getElementById('selectedFileMeta');

function resetFileState() {
  fileUploadEmpty.style.display = 'block';
  fileUploading.style.display = 'none';
  fileUploaded.style.display = 'none';
  fileUploadError.style.display = 'none';
}

function simulateUpload(fileName) {
  fileUploadEmpty.style.display = 'none';
  fileUploading.style.display = 'block';
  fileUploaded.style.display = 'none';
  fileUploadError.style.display = 'none';

  uploadingFileName.textContent = fileName;
  let progress = 0;
  progressFill.style.width = '0%';
  uploadingPercent.textContent = '0%';

  const timer = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
      setTimeout(() => {
        fileUploading.style.display = 'none';
        const success = Math.random() > 0.3 || links.length === 0;
        if (success) {
          selectedFileName.textContent = fileName;
          const size = (Math.random() * 5 + 0.5).toFixed(1);
          const count = Math.floor(Math.random() * 500 + 50);
          selectedFileMeta.textContent = `${size} MB · ${count} 条数据`;
          fileUploaded.style.display = 'block';
          showToast('文件上传成功');
        } else {
          fileUploadError.style.display = 'block';
          showToast('文件格式校验失败');
        }
      }, 300);
    }
    progressFill.style.width = progress + '%';
    uploadingPercent.textContent = Math.floor(progress) + '%';
  }, 150);
}

// 点击上传区域
fileDropZone.addEventListener('click', () => fileInput.click());

// 拖拽
fileDropZone.addEventListener('dragover', e => {
  e.preventDefault();
  fileDropZone.classList.add('dragover');
});
fileDropZone.addEventListener('dragleave', () => {
  fileDropZone.classList.remove('dragover');
});
fileDropZone.addEventListener('drop', e => {
  e.preventDefault();
  fileDropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    simulateUpload(files[0].name);
  }
});

// 文件选择
fileInput.addEventListener('change', e => {
  if (e.target.files.length > 0) {
    simulateUpload(e.target.files[0].name);
    e.target.value = '';
  }
});

// 移除文件
removeFileBtn.addEventListener('click', () => {
  resetFileState();
  showToast('已移除文件');
});
removeErrorFileBtn.addEventListener('click', () => {
  resetFileState();
  showToast('已移除文件');
});

// ===== 上传图片 Tab =====
const imageGrid = document.getElementById('imageGrid');
const imageInput = document.getElementById('imageInput');
const imageUploadBtn = document.getElementById('imageUploadBtn');
const imageCount = document.getElementById('imageCount');
const MAX_IMAGES = 9;
let images = [];

function renderImages() {
  const items = imageGrid.querySelectorAll('.image-item');
  items.forEach(item => item.remove());

  images.forEach((img, i) => {
    const div = document.createElement('div');
    div.className = 'image-item';
    div.innerHTML = `
      <img src="${img.url}" alt="${img.name}">
      <div class="img-overlay">
        <button class="preview-btn" title="预览">👁</button>
        <button class="delete-btn" title="删除" data-index="${i}">✕</button>
      </div>
    `;
    imageGrid.insertBefore(div, imageUploadBtn);
  });

  imageGrid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      images.splice(idx, 1);
      renderImages();
      showToast('已删除图片');
    });
  });

  imageCount.textContent = images.length;
  imageUploadBtn.style.display = images.length >= MAX_IMAGES ? 'none' : 'flex';
}

imageUploadBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (images.length >= MAX_IMAGES) {
    showToast('最多上传9张图片');
    return;
  }
  imageInput.click();
});

imageInput.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  const remaining = MAX_IMAGES - images.length;
  const toAdd = files.slice(0, remaining);

  toAdd.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(ev) {
      images.push({
        id: Date.now() + Math.random(),
        url: ev.target.result,
        name: file.name
      });
      renderImages();
    };
    reader.readAsDataURL(file);
  });

  if (files.length > remaining) {
    showToast(`最多上传${MAX_IMAGES}张，已截断`);
  } else if (toAdd.length > 0) {
    showToast(`已添加 ${toAdd.length} 张图片`);
  }

  e.target.value = '';
});

// ===== 底部按钮 =====
document.getElementById('cancelBtn').addEventListener('click', () => {
  showToast('已取消');
});
document.getElementById('submitBtn').addEventListener('click', () => {
  showToast('任务已提交，开始执行...');
});
document.getElementById('modalClose').addEventListener('click', () => {
  showToast('已关闭弹窗');
});

// ===== 编辑模式 =====
const editModeBtn = document.getElementById('editModeBtn');
const resetBtn = document.getElementById('resetBtn');
const editableNodes = Array.from(document.querySelectorAll('[data-editable]'));
let editMode = false;
const originalValues = new Map();

editableNodes.forEach((node, i) => {
  const key = node.dataset.editKey || `field-${i}`;
  node.dataset.editKey = key;
  originalValues.set(key, node.textContent.trim());
});

editModeBtn.addEventListener('click', () => {
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);
  editModeBtn.textContent = editMode ? '完成编辑' : '编辑模式';
  editModeBtn.classList.toggle('primary', !editMode);
  editableNodes.forEach(node => {
    node.contentEditable = editMode ? 'true' : 'false';
    node.spellcheck = false;
  });
  if (editMode) showToast('编辑模式已开启，点击文案可修改');
  else showToast('编辑已完成');
});

editableNodes.forEach(node => {
  node.addEventListener('blur', () => {
    const key = node.dataset.editKey;
    const changed = node.textContent.trim() !== originalValues.get(key);
    resetBtn.disabled = !changed && Array.from(editableNodes).every(n =>
      n.textContent.trim() === originalValues.get(n.dataset.editKey)
    );
  });
  node.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); node.blur(); }
  });
});

resetBtn.addEventListener('click', () => {
  if (!confirm('确定重置所有文案修改吗？')) return;
  editableNodes.forEach(node => {
    node.textContent = originalValues.get(node.dataset.editKey) || '';
  });
  resetBtn.disabled = true;
  showToast('已重置修改');
});
