// ===== 模拟任务数据 =====
const mockTasks = [
  {
    id: 1,
    name: '夏季女装连衣裙寻源',
    type: 'file',
    typeText: '文件上传',
    count: 328,
    status: 'done',
    statusText: '已完成',
    progress: 100,
    finished: 328,
    createTime: '2026-08-04 10:32:15',
    finishTime: '2026-08-04 11:15:42'
  },
  {
    id: 2,
    name: '数码配件手机壳批量寻源',
    type: 'link',
    typeText: '图片链接',
    count: 156,
    status: 'running',
    statusText: '执行中',
    progress: 68,
    finished: 106,
    createTime: '2026-08-04 09:20:08',
    finishTime: '-'
  },
  {
    id: 3,
    name: '家居用品收纳盒',
    type: 'image',
    typeText: '上传图片',
    count: 45,
    status: 'running',
    statusText: '执行中',
    progress: 33,
    finished: 15,
    createTime: '2026-08-04 08:45:30',
    finishTime: '-'
  },
  {
    id: 4,
    name: '运动鞋款图搜',
    type: 'file',
    typeText: '文件上传',
    count: 500,
    status: 'pending',
    statusText: '未执行',
    progress: 0,
    finished: 0,
    createTime: '2026-08-03 16:22:10',
    finishTime: '-'
  },
  {
    id: 5,
    name: '美妆护肤产品',
    type: 'link',
    typeText: '图片链接',
    count: 200,
    status: 'stopped',
    statusText: '已终止',
    progress: 80,
    finished: 160,
    createTime: '2026-08-02 14:10:00',
    finishTime: '2026-08-02 16:30:20'
  }
];

// ===== Toast =====
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ===== 页面面板切换 =====
const pagePanels = document.querySelectorAll('.page-panel');

function switchPage(pageName) {
  pagePanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === 'page-' + pageName);
  });
}

// ===== URL 参数读取 =====
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// 跳转到创建页面
function goCreatePage() {
  switchPage('create');
}

// 页面加载时根据 URL 参数切换面板
(function initPage() {
  const page = getUrlParam('page');
  if (page === 'list') {
    switchPage('list');
  } else if (page === 'result') {
    switchPage('result');
  } else {
    switchPage('create');
  }
})();

// ===== 图搜方式 Tab 切换 =====
const tabBtns = document.querySelectorAll('.search-tabs .tab-btn');
const linkPanel = document.getElementById('panel-link');
const filePanel = document.getElementById('panel-file');
const imagePanel = document.getElementById('panel-image');
const subPanels = [linkPanel, filePanel, imagePanel];

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.toggle('active', b === btn));
    subPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
  });
});

// ===== 图片链接 Tab =====
const linkTextarea = document.getElementById('linkTextarea');
const clearLinkBtn = document.getElementById('clearLinkBtn');
const parseLinkBtn = document.getElementById('parseLinkBtn');
const linkPreview = document.getElementById('linkPreview');
const linkCount = document.getElementById('linkCount');
const linkThumbGrid = document.getElementById('linkThumbGrid');
let parsedLinks = [];

function parseLinksFromText(text) {
  return text
    .split(/[\n,;]+/)
    .map(line => line.trim())
    .filter(line => line && /^https?:\/\//i.test(line));
}

function renderLinkThumbs(links) {
  if (links.length === 0) {
    linkPreview.style.display = 'none';
    return;
  }
  linkPreview.style.display = 'block';
  linkCount.textContent = links.length + ' 条';
  const previewLinks = links.slice(0, 40);
  linkThumbGrid.innerHTML = previewLinks.map((url, i) => `
    <div class="link-thumb-item" title="${url}">
      <img src="${url}" alt="link-${i + 1}" onerror="this.style.display='none';this.parentElement.style.background='var(--bg-tertiary)';this.parentElement.innerHTML='<span style=\\'color:var(--text-muted);font-size:11px;\\'>图片${i + 1}</span>'">
      <span class="thumb-num">${i + 1}</span>
      <button class="thumb-del" data-index="${i}" title="删除">✕</button>
    </div>
  `).join('');
  if (links.length > 40) {
    linkThumbGrid.innerHTML += `
      <div class="link-thumb-item" style="background: var(--primary-bg); display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;">
        <span style="font-size:20px;font-weight:700;color:var(--primary);">+${links.length - 40}</span>
        <span style="font-size:11px;color:var(--primary);">更多</span>
      </div>
    `;
  }
  linkThumbGrid.querySelectorAll('.thumb-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      parsedLinks.splice(idx, 1);
      linkTextarea.value = parsedLinks.join('\n');
      renderLinkThumbs(parsedLinks);
      showToast('已删除链接');
    });
  });
}

parseLinkBtn.addEventListener('click', () => {
  parsedLinks = parseLinksFromText(linkTextarea.value);
  if (parsedLinks.length === 0) {
    showToast('未检测到有效的图片链接');
    return;
  }
  if (parsedLinks.length > 1000) {
    parsedLinks = parsedLinks.slice(0, 1000);
    linkTextarea.value = parsedLinks.join('\n');
    showToast('最多支持 1000 条链接，已自动截断');
  } else {
    showToast(`已解析 ${parsedLinks.length} 条链接`);
  }
  renderLinkThumbs(parsedLinks);
});

clearLinkBtn.addEventListener('click', () => {
  linkTextarea.value = '';
  parsedLinks = [];
  linkPreview.style.display = 'none';
  showToast('已清空');
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
        const success = Math.random() > 0.3;
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

fileDropZone.addEventListener('click', () => fileInput.click());
fileDropZone.addEventListener('dragover', e => {
  e.preventDefault();
  fileDropZone.classList.add('dragover');
});
fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('dragover'));
fileDropZone.addEventListener('drop', e => {
  e.preventDefault();
  fileDropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) simulateUpload(files[0].name);
});
fileInput.addEventListener('change', e => {
  if (e.target.files.length > 0) {
    simulateUpload(e.target.files[0].name);
    e.target.value = '';
  }
});
removeFileBtn.addEventListener('click', () => { resetFileState(); showToast('已移除文件'); });
removeErrorFileBtn.addEventListener('click', () => { resetFileState(); showToast('已移除文件'); });

// ===== 上传图片 Tab =====
const imageGrid = document.getElementById('imageGrid');
const imageInput = document.getElementById('imageInput');
const imageUploadBtn = document.getElementById('imageUploadBtn');
const imageCount = document.getElementById('imageCount');
const MAX_IMAGES = 1000;
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
  if (images.length >= MAX_IMAGES) { showToast(`最多上传${MAX_IMAGES}张图片`); return; }
  imageInput.click();
});
imageInput.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  const remaining = MAX_IMAGES - images.length;
  const toAdd = files.slice(0, remaining);
  toAdd.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(ev) {
      images.push({ id: Date.now() + Math.random(), url: ev.target.result, name: file.name });
      renderImages();
    };
    reader.readAsDataURL(file);
  });
  if (files.length > remaining) showToast(`最多上传${MAX_IMAGES}张，已截断`);
  else if (toAdd.length > 0) showToast(`已添加 ${toAdd.length} 张图片`);
  e.target.value = '';
});

// ===== 创建任务提交 =====
const taskNameInput = document.getElementById('taskNameInput');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');

function getCurrentType() {
  const activeTab = document.querySelector('.search-tabs .tab-btn.active');
  return activeTab ? activeTab.dataset.tab : 'link';
}

function getCurrentCount() {
  const type = getCurrentType();
  if (type === 'link') return parsedLinks.length;
  if (type === 'file' && fileUploaded.style.display !== 'none') return 328;
  if (type === 'image') return images.length;
  return 0;
}

submitBtn.addEventListener('click', () => {
  const name = taskNameInput.value.trim();
  if (!name) { showToast('请输入任务名称'); return; }
  const count = getCurrentCount();
  if (count === 0) { showToast('请先添加图片链接或上传文件'); return; }

  const type = getCurrentType();
  const typeMap = { link: '图片链接', file: '文件上传', image: '上传图片' };
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const newTask = {
    id: Date.now(),
    name,
    type,
    typeText: typeMap[type],
    count,
    status: 'running',
    statusText: '执行中',
    progress: 0,
    finished: 0,
    createTime: timeStr,
    finishTime: '-'
  };
  tasks.unshift(newTask);
  renderTaskTable();
  updateTotalBadge();

  showToast('任务创建成功，正在执行...');

  // 切换到任务列表页面
  switchPage('list');

  // 模拟进度
  simulateTaskProgress(newTask.id);
});

resetBtn.addEventListener('click', () => {
  taskNameInput.value = '';
  linkTextarea.value = '';
  parsedLinks = [];
  linkPreview.style.display = 'none';
  resetFileState();
  images = [];
  renderImages();
  showToast('已重置');
});

// ===== 任务列表 =====
const taskTableBody = document.getElementById('taskTableBody');

function updateTotalBadge() {
  const badge = document.getElementById('totalCountBadge');
  if (badge) badge.textContent = `共 ${tasks.length} 条任务`;
  const total = document.getElementById('totalCount');
  if (total) total.textContent = tasks.length;
}

// 根据任务状态生成操作按钮
function getTaskActions(task) {
  const actions = [];
  const sep = '<span class="action-sep">|</span>';

  if (task.status === 'running') {
    // 执行中：终止任务
    actions.push(`<span class="action-link danger" onclick="stopTask(${task.id})">终止任务</span>`);
  } else if (task.status === 'done') {
    // 已完成：复制任务、寻源结果、删除任务
    actions.push(`<span class="action-link" onclick="copyTask(${task.id})">复制任务</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link" onclick="viewResult(${task.id})">寻源结果</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link danger" onclick="confirmDelete(${task.id})">删除任务</span>`);
  } else if (task.status === 'stopped' || task.status === 'pending') {
    // 已终止 / 未执行：编辑任务、重新执行、复制任务、删除任务
    actions.push(`<span class="action-link" onclick="editTask(${task.id})">编辑任务</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link primary" onclick="retryTask(${task.id})">重新执行</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link" onclick="copyTask(${task.id})">复制任务</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link danger" onclick="confirmDelete(${task.id})">删除任务</span>`);
  }
  return actions;
}

function renderTaskTable() {
  const pagedTasks = getPagedTasks();
  if (tasks.length === 0) {
    taskTableBody.innerHTML = '';
    document.getElementById('emptyState').style.display = 'block';
  } else {
    document.getElementById('emptyState').style.display = 'none';
    taskTableBody.innerHTML = pagedTasks.map(task => `
      <tr data-id="${task.id}">
        <td>
          <div class="task-name-cell" onclick="showDetail(${task.id})" title="${task.name}">${task.name}</div>
        </td>
        <td><span class="type-tag ${task.type}">${task.typeText}</span></td>
        <td>${task.count} 条</td>
        <td>
          <span class="status-tag ${task.status}">
            <span class="status-dot"></span>
            ${task.statusText}
          </span>
        </td>
        <td>
          <div class="progress-cell">
            <div class="progress-text">
              <span><b>${task.finished}</b> / ${task.count}</span>
              <span>${task.progress}%</span>
            </div>
            <div class="mini-progress">
              <div class="mini-progress-fill" style="width: ${task.progress}%"></div>
            </div>
          </div>
        </td>
        <td style="color: var(--text-secondary); font-size: 12px;">${task.createTime}</td>
        <td>
          <div class="action-cell">
            ${getTaskActions(task).join('')}
          </div>
        </td>
      </tr>
    `).join('');
  }
  updateTotalBadge();
  renderPagination();
}

// 模拟任务进度
function simulateTaskProgress(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const timer = setInterval(() => {
    task.progress += Math.floor(Math.random() * 8 + 2);
    task.finished = Math.floor(task.count * task.progress / 100);
    if (task.progress >= 100) {
      task.progress = 100;
      task.finished = task.count;
      task.status = 'done';
      task.statusText = '已完成';
      const now = new Date();
      task.finishTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      clearInterval(timer);
    }
    renderTaskTable();
  }, 1500);
}

// 终止任务
function stopTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = 'stopped';
    task.statusText = '已终止';
    const now = new Date();
    task.finishTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    renderTaskTable();
    showToast('任务已终止');
  }
}

// 重新执行任务
function retryTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = 'running';
  task.statusText = '执行中';
  task.progress = 0;
  task.finished = 0;
  task.finishTime = '-';
  renderTaskTable();
  showToast('任务开始执行...');
  simulateTaskProgress(task.id);
}

// 编辑任务（跳转到创建表单，填充当前任务信息）
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  taskNameInput.value = task.name;

  if (task.type === 'link') {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'link'));
    subPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-link'));
  } else if (task.type === 'file') {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'file'));
    subPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-file'));
    fileUploadEmpty.style.display = 'none';
    fileUploaded.style.display = 'block';
    selectedFileName.textContent = task.name + '.xlsx';
    selectedFileMeta.textContent = `${task.count} 条数据`;
  } else if (task.type === 'image') {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'image'));
    subPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-image'));
  }

  switchPage('create');
  showToast('已加载任务信息到编辑表单');
}

// 复制任务
function copyTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  // 填充任务名称到创建表单
  taskNameInput.value = task.name + ' - 副本';

  // 根据任务类型填充对应的数据
  if (task.type === 'link') {
    // 切换到图片链接tab
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'link'));
    subPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-link'));
    // 模拟填充链接数据
    showToast('已复制任务信息到创建表单');
  } else if (task.type === 'file') {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'file'));
    subPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-file'));
    // 模拟文件已上传状态
    fileUploadEmpty.style.display = 'none';
    fileUploaded.style.display = 'block';
    selectedFileName.textContent = task.name + '.xlsx';
    selectedFileMeta.textContent = `${task.count} 条数据`;
    showToast('已复制任务信息到创建表单');
  } else if (task.type === 'image') {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'image'));
    subPanels.forEach(p => p.classList.toggle('active', p.id === 'panel-image'));
    showToast('已复制任务信息到创建表单');
  }

  // 切换到创建页面
  switchPage('create');
}

// 删除确认浮窗
let deleteTargetId = null;
function confirmDelete(id) {
  deleteTargetId = id;
  const floatModal = document.getElementById('deleteFloatModal');
  if (floatModal) {
    floatModal.classList.add('show');
  } else {
    // 降级：使用原生 confirm
    if (confirm('确定要删除此任务吗？')) {
      deleteTask(id);
    }
  }
}

function cancelDelete() {
  deleteTargetId = null;
  const floatModal = document.getElementById('deleteFloatModal');
  if (floatModal) floatModal.classList.remove('show');
}

function confirmDeleteAction() {
  if (deleteTargetId !== null) {
    deleteTask(deleteTargetId);
    deleteTargetId = null;
  }
  const floatModal = document.getElementById('deleteFloatModal');
  if (floatModal) floatModal.classList.remove('show');
}

// 删除任务
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTaskTable();
  showToast('任务已删除');
}

// 查看结果
function viewResult(id) {
  showToast('跳转到寻源结果页...');
}

// ===== 详情弹窗 =====
const detailModal = document.getElementById('detailModal');

function showDetail(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  if (detailModal) {
    document.getElementById('detailName').textContent = task.name;
    document.getElementById('detailType').textContent = task.typeText;
    document.getElementById('detailStatus').innerHTML = `<span class="status-tag ${task.status}"><span class="status-dot"></span>${task.statusText}</span>`;
    document.getElementById('detailCount').textContent = `${task.count} 条`;
    document.getElementById('detailTime').textContent = task.createTime;
    document.getElementById('detailFinishTime').textContent = task.finishTime;
    document.getElementById('detailProgressText').textContent = `${task.progress}%（${task.finished} / ${task.count}）`;
    document.getElementById('detailProgressBar').style.width = task.progress + '%';
    detailModal.style.display = 'flex';
  } else {
    showToast(`查看任务: ${task.name}`);
  }
}

// ===== 筛选 =====
document.getElementById('searchBtn')?.addEventListener('click', () => {
  const name = document.getElementById('filterTaskName').value.trim().toLowerCase();
  const type = document.getElementById('filterType').value;
  const status = document.getElementById('filterStatus').value;

  let filtered = [...mockTasks];
  if (name) filtered = filtered.filter(t => t.name.toLowerCase().includes(name));
  if (type) filtered = filtered.filter(t => t.type === type);
  if (status) filtered = filtered.filter(t => t.status === status);

  tasks = filtered;
  renderTaskTable();
  showToast(`查询到 ${filtered.length} 条结果`);
});

document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
  document.getElementById('filterTaskName').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterDateStart').value = '';
  document.getElementById('filterDateEnd').value = '';
  tasks = [...mockTasks];
  renderTaskTable();
  showToast('已重置筛选');
});

document.getElementById('refreshBtn')?.addEventListener('click', () => {
  renderTaskTable();
  showToast('已刷新');
});

// ===== 分页状态 =====
let paginationState = {
  currentPage: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 1
};

function updatePaginationState() {
  paginationState.totalItems = tasks.length;
  paginationState.totalPages = Math.max(1, Math.ceil(tasks.length / paginationState.pageSize));
  if (paginationState.currentPage > paginationState.totalPages) {
    paginationState.currentPage = paginationState.totalPages;
  }
}

function getPagedTasks() {
  updatePaginationState();
  const start = (paginationState.currentPage - 1) * paginationState.pageSize;
  const end = start + paginationState.pageSize;
  return tasks.slice(start, end);
}

function renderPagination() {
  updatePaginationState();
  const { currentPage, pageSize, totalItems, totalPages } = paginationState;
  const paginationWrap = document.getElementById('paginationWrap');
  if (!paginationWrap) return;

  // 左侧总条数
  const totalInfo = paginationWrap.querySelector('.pagination-total');
  if (totalInfo) totalInfo.textContent = `共 ${totalItems} 条`;

  // 页码导航
  const pageNav = paginationWrap.querySelector('.pagination-nav');
  if (!pageNav) return;

  let html = '';

  // 上一页
  html += `<button class="page-nav-btn prev" ${currentPage === 1 ? 'disabled' : ''} onclick="goPage(${currentPage - 1})">&lt;</button>`;

  if (totalPages <= 7) {
    // 页数少，全部显示
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-nav-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
  } else {
    // 页数多，显示省略号
    if (currentPage <= 4) {
      for (let i = 1; i <= 6; i++) {
        html += `<button class="page-nav-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
      }
      html += `<span class="page-ellipsis">...</span>`;
      html += `<button class="page-nav-btn" onclick="goPage(${totalPages})">${totalPages}</button>`;
    } else if (currentPage >= totalPages - 3) {
      html += `<button class="page-nav-btn" onclick="goPage(1)">1</button>`;
      html += `<span class="page-ellipsis">...</span>`;
      for (let i = totalPages - 5; i <= totalPages; i++) {
        html += `<button class="page-nav-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
      }
    } else {
      html += `<button class="page-nav-btn" onclick="goPage(1)">1</button>`;
      html += `<span class="page-ellipsis">...</span>`;
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        html += `<button class="page-nav-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
      }
      html += `<span class="page-ellipsis">...</span>`;
      html += `<button class="page-nav-btn" onclick="goPage(${totalPages})">${totalPages}</button>`;
    }
  }

  // 下一页
  html += `<button class="page-nav-btn next" ${currentPage === totalPages ? 'disabled' : ''} onclick="goPage(${currentPage + 1})">&gt;</button>`;

  pageNav.innerHTML = html;

  // 更新"前往"输入框
  const gotoInput = paginationWrap.querySelector('.goto-input');
  if (gotoInput) gotoInput.value = currentPage;
}

function goPage(page) {
  if (page < 1 || page > paginationState.totalPages) return;
  paginationState.currentPage = page;
  renderTaskTable();
  renderPagination();
}

// 每页条数切换
document.getElementById('pageSize')?.addEventListener('change', (e) => {
  paginationState.pageSize = parseInt(e.target.value);
  paginationState.currentPage = 1;
  renderTaskTable();
  renderPagination();
});

// 前往页输入
document.getElementById('gotoPageBtn')?.addEventListener('click', () => {
  const input = document.getElementById('gotoPageInput');
  if (!input) return;
  const page = parseInt(input.value);
  if (page && page >= 1 && page <= paginationState.totalPages) {
    goPage(page);
  } else {
    showToast('请输入有效的页码');
  }
});

document.getElementById('gotoPageInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('gotoPageBtn')?.click();
  }
});

// ===== 编辑模式 =====
const editModeBtn = document.getElementById('editModeBtn');
const resetEditBtn = document.getElementById('resetEditBtn');
const editableNodes = Array.from(document.querySelectorAll('[data-editable]'));
let editMode = false;
const originalValues = new Map();

editableNodes.forEach((node, i) => {
  const key = node.dataset.editKey || `field-${i}`;
  node.dataset.editKey = key;
  originalValues.set(key, node.textContent.trim());
});

editModeBtn?.addEventListener('click', () => {
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
    if (resetEditBtn) {
      resetEditBtn.disabled = !changed && Array.from(editableNodes).every(n =>
        n.textContent.trim() === originalValues.get(n.dataset.editKey)
      );
    }
  });
  node.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); node.blur(); }
  });
});

resetEditBtn?.addEventListener('click', () => {
  if (!confirm('确定重置所有文案修改吗？')) return;
  editableNodes.forEach(node => {
    node.textContent = originalValues.get(node.dataset.editKey) || '';
  });
  resetEditBtn.disabled = true;
  showToast('已重置修改');
});

// ===== 生成更多模拟数据（用于分页展示）=====
(function generateMoreTasks() {
  const names = ['夏季T恤寻源', '秋季外套批量', '冬季羽绒服', '春季衬衫', '牛仔裤寻源',
    '休闲裤批量', '运动鞋款', '皮鞋寻源', '包包批发', '帽子围巾',
    '童装连衣裙', '婴儿用品', '家居四件套', '厨房用品', '收纳整理',
    '美妆工具', '护肤套装', '香水批发', '首饰配件', '手表寻源'];
  const types = ['link', 'file', 'image'];
  const typeTexts = { link: '图片链接', file: '文件上传', image: '上传图片' };
  const statuses = ['done', 'running', 'stopped', 'pending'];
  const statusTexts = { done: '已完成', running: '执行中', stopped: '已终止', pending: '未执行' };

  for (let i = 0; i < 35; i++) {
    const type = types[i % 3];
    const status = statuses[i % 4];
    const count = Math.floor(Math.random() * 800 + 50);
    const progress = status === 'done' ? 100 : status === 'pending' ? 0 : Math.floor(Math.random() * 90 + 5);
    const finished = status === 'pending' ? 0 : Math.floor(count * progress / 100);
    const day = String(1 + (i % 30)).padStart(2, '0');
    const hour = String(8 + (i % 12)).padStart(2, '0');

    mockTasks.push({
      id: 100 + i,
      name: names[i % names.length] + ' - ' + (i + 1),
      type,
      typeText: typeTexts[type],
      count,
      status,
      statusText: statusTexts[status],
      progress,
      finished,
      createTime: `2026-07-${day} ${hour}:${String(i % 60).padStart(2, '0')}:00`,
      finishTime: (status === 'running' || status === 'pending') ? '-' : `2026-07-${day} ${String(parseInt(hour) + 1).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`
    });
  }
  tasks = [...mockTasks];
})();

// ===== 初始化 =====
renderTaskTable();
// 让已有的执行中任务继续跑
tasks.filter(t => t.status === 'running').forEach(t => simulateTaskProgress(t.id));
