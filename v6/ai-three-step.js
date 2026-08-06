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
    status: 'waiting',
    statusText: '待执行',
    progress: 0,
    finished: 0,
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
  },
  {
    id: 6,
    name: '冬季羽绒服批量寻源',
    type: 'file',
    typeText: '文件上传',
    count: 800,
    status: 'waiting',
    statusText: '待执行',
    progress: 0,
    finished: 0,
    createTime: '2026-08-04 11:30:00',
    finishTime: '-'
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
let _pageChangeNotifyEnabled = false;

function switchPage(pageName) {
  pagePanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === 'page-' + pageName);
  });
  // 通知父窗口（search-agent.html / dev-mode.html）当前板块已切换
  if (_pageChangeNotifyEnabled) {
    try { window.parent.postMessage({ type: 'pageChange', page: pageName }, '*'); } catch(e) {}
    try { window.top.postMessage({ type: 'pageChange', page: pageName }, '*'); } catch(e) {}
  }
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
    window._initResultPage = true;
  } else {
    switchPage('create');
  }
})();

// 初始化完成后启用页面切换通知
_pageChangeNotifyEnabled = true;

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
    updateCreditsStats();
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
  updateCreditsStats();
});

clearLinkBtn.addEventListener('click', () => {
  linkTextarea.value = '';
  parsedLinks = [];
  linkPreview.style.display = 'none';
  showToast('已清空');
  updateCreditsStats();
});

// 实时监听文本输入，自动解析链接数量并更新统计（无需点击"解析链接"）
linkTextarea.addEventListener('input', () => {
  parsedLinks = parseLinksFromText(linkTextarea.value);
  updateCreditsStats();
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
          updateCreditsStats();
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
removeFileBtn.addEventListener('click', () => { resetFileState(); showToast('已移除文件'); updateCreditsStats(); });
removeErrorFileBtn.addEventListener('click', () => { resetFileState(); showToast('已移除文件'); updateCreditsStats(); });

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
  updateCreditsStats();
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

  // 检查是否已有任务在执行中，如果有则当前任务变为待执行
  const hasRunning = tasks.some(t => t.status === 'running');
  if (hasRunning) {
    newTask.status = 'waiting';
    newTask.statusText = '待执行';
    showToast('任务已创建，排队等待执行...');
  } else {
    showToast('任务创建成功，正在执行...');
  }

  tasks.unshift(newTask);
  renderTaskTable();
  updateTotalBadge();

  // 切换到任务列表页面
  switchPage('list');

  // 如果没有正在执行的任务，则开始执行
  if (!hasRunning) {
    simulateTaskProgress(newTask.id);
  }
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
  updateCreditsStats();
});

// ===== 张数管理 =====
let userCredits = 2;
let purchaseSelectedCount = 0;

function formatNumber(n) {
  return n.toLocaleString('zh-CN');
}

function updateUserCreditsDisplay() {
  const el = document.getElementById('userCreditsDisplay');
  if (el) el.innerHTML = formatNumber(userCredits) + ' <span class="credits-unit">张</span>';
  const purchaseCurrent = document.getElementById('purchaseCurrentCredits');
  if (purchaseCurrent) purchaseCurrent.textContent = formatNumber(userCredits);
}

function updateCreditsStats() {
  const type = getCurrentType();
  let uploaded = 0;
  if (type === 'link') uploaded = parsedLinks.length;
  else if (type === 'file' && fileUploaded.style.display !== 'none') uploaded = getCurrentCount();
  else if (type === 'image') uploaded = images.length;

  const statsBar = document.getElementById('creditsStats');
  if (!statsBar) return;

  const purchaseBtn = document.getElementById('statsPurchaseBtn');

  if (uploaded > 0) {
    statsBar.style.display = 'flex';
    document.getElementById('uploadedCount').textContent = formatNumber(uploaded) + ' 张';
    document.getElementById('deductionCount').textContent = formatNumber(uploaded) + ' 张';

    const remaining = userCredits - uploaded;
    const remainingEl = document.getElementById('remainingCredits');

    if (remaining < 0) {
      // 超出剩余张数
      remainingEl.textContent = '-' + formatNumber(Math.abs(remaining)) + ' 张';
      remainingEl.className = 'stats-value deficit';
      statsBar.classList.add('exceeded');
      if (purchaseBtn) purchaseBtn.style.display = 'inline-flex';
    } else {
      remainingEl.textContent = formatNumber(remaining) + ' 张';
      statsBar.classList.remove('exceeded');
      if (purchaseBtn) purchaseBtn.style.display = 'none';
      if (remaining < 1000) {
        remainingEl.className = 'stats-value warning';
      } else {
        remainingEl.className = 'stats-value remaining';
      }
    }
  } else {
    statsBar.style.display = 'none';
    statsBar.classList.remove('exceeded');
    if (purchaseBtn) purchaseBtn.style.display = 'none';
  }
}

// 增购弹窗
function openPurchaseModal() {
  const modal = document.getElementById('purchaseModal');
  if (modal) {
    modal.classList.add('show');
    updateUserCreditsDisplay();
    resetPurchaseSelection();
  }
}

function closePurchaseModal() {
  const modal = document.getElementById('purchaseModal');
  if (modal) modal.classList.remove('show');
}

function resetPurchaseSelection() {
  purchaseSelectedCount = 0;
  document.querySelectorAll('.purchase-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('purchaseSelectedCount').textContent = '0';
  document.getElementById('purchaseTotalAmount').textContent = '¥0.00';
  document.getElementById('confirmPurchaseBtn').disabled = true;
}

function selectPurchaseOption(el, count) {
  document.querySelectorAll('.purchase-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  purchaseSelectedCount = count;
  updatePurchaseSummary();
}

function updatePurchaseSummary() {
  const count = purchaseSelectedCount;
  const amount = (count * 0.02).toFixed(2);
  document.getElementById('purchaseSelectedCount').textContent = formatNumber(count);
  document.getElementById('purchaseTotalAmount').textContent = '¥' + amount;
  document.getElementById('confirmPurchaseBtn').disabled = count <= 0;
}

// 确认购买
document.getElementById('confirmPurchaseBtn')?.addEventListener('click', () => {
  if (purchaseSelectedCount <= 0) return;
  userCredits += purchaseSelectedCount;
  updateUserCreditsDisplay();
  updateCreditsStats();
  showToast('增购成功！已添加 ' + formatNumber(purchaseSelectedCount) + ' 张');
  closePurchaseModal();
});

// 增购按钮
document.getElementById('purchaseBtn')?.addEventListener('click', openPurchaseModal);

// ===== 支付弹窗 =====
let paymentTaskId = null;
const UNIT_PRICE = 0.02;

function openPaymentModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  paymentTaskId = taskId;
  const modal = document.getElementById('paymentModal');
  if (!modal) return;
  const orderNo = 'DLDD' + new Date().toISOString().slice(0,10).replace(/-/g,'') + String(taskId).padStart(4,'0');
  document.getElementById('payOrderId').textContent = orderNo;
  document.getElementById('payTaskName').textContent = task.name;
  document.getElementById('payItemCount').textContent = task.count + ' 件';
  const amount = (task.count * UNIT_PRICE).toFixed(2);
  document.getElementById('payAmount').textContent = '¥' + amount;
  const defaultRadio = document.querySelector('input[name="payMethod"][value="alipay"]');
  if (defaultRadio) {
    defaultRadio.checked = true;
    document.querySelectorAll('.payment-method-item').forEach(item => item.classList.remove('active'));
    defaultRadio.closest('.payment-method-item')?.classList.add('active');
    document.getElementById('qrMethodName').textContent = '支付宝';
  }
  modal.style.display = 'flex';
  modal.classList.add('show');
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  paymentTaskId = null;
}

// 任务列表按钮事件委托
document.addEventListener('click', (e) => {
  const buyBtn = e.target.closest('.action-link.buy');
  if (buyBtn) {
    const taskId = Number(buyBtn.dataset.taskId);
    openPaymentModal(taskId);
    return;
  }
  const payOption = e.target.closest('.payment-method-item');
  if (payOption) {
    const radio = payOption.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        document.querySelectorAll('.payment-method-item').forEach(item => item.classList.remove('active'));
        payOption.classList.add('active');
        const methodNames = { alipay: '支付宝', wechat: '微信支付', bank: '银行卡', card: '信用卡' };
        const method = methodNames[radio.value] || '支付宝';
        document.getElementById('qrMethodName').textContent = method;
        const qr = document.getElementById('qrPlaceholder');
        if (qr) qr.textContent = method + '扫码';
      }
  }
});

// 支付方式切换

// 确认支付
document.getElementById('confirmPayBtn')?.addEventListener('click', () => {
  const btn = document.getElementById('confirmPayBtn');
  btn.textContent = '支付中...';
  btn.disabled = true;
  setTimeout(() => {
    const task = tasks.find(t => t.id === paymentTaskId);
    if (task) showToast('支付成功！任务「' + task.name + '」已购买');
    btn.textContent = '确认支付';
    btn.disabled = false;
    closePaymentModal();
  }, 1500);
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
  const buyBtn = `<button type="button" class="action-link buy" data-task-id="${task.id}" onclick="openPaymentModal(${task.id})">立即购买</button>`;

  if (task.status === 'running' || task.status === 'waiting') {
    actions.push(buyBtn);
    actions.push(sep);
    actions.push(`<span class="action-link danger" onclick="stopTask(${task.id})">终止任务</span>`);
  } else if (task.status === 'done') {
    actions.push(buyBtn);
    actions.push(sep);
    actions.push(`<span class="action-link" onclick="showDetail(${task.id})">任务详情</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link" onclick="copyTask(${task.id})">复制任务</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link" onclick="viewResult(${task.id})">寻源结果</span>`);
    actions.push(sep);
    actions.push(`<span class="action-link danger" onclick="confirmDelete(${task.id})">删除任务</span>`);
  } else if (task.status === 'stopped' || task.status === 'pending') {
    actions.push(buyBtn);
    actions.push(sep);
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

function bindBuyButtons() {
  document.querySelectorAll('.action-link.buy').forEach(btn => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPaymentModal(Number(btn.dataset.taskId));
    });
  });
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
    bindBuyButtons();
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
      // 自动开始下一个待执行的任务
      startNextWaitingTask();
    }
    renderTaskTable();
  }, 1500);
}

// 自动开始下一个待执行的任务
function startNextWaitingTask() {
  const nextTask = tasks.find(t => t.status === 'waiting');
  if (nextTask) {
    nextTask.status = 'running';
    nextTask.statusText = '执行中';
    renderTaskTable();
    showToast(`任务"${nextTask.name}"开始执行...`);
    simulateTaskProgress(nextTask.id);
  }
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
    // 自动开始下一个待执行的任务
    startNextWaitingTask();
  }
}

// 重新执行任务
function retryTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.progress = 0;
  task.finished = 0;
  task.finishTime = '-';

  // 检查是否已有任务在执行中
  const hasRunning = tasks.some(t => t.id !== id && t.status === 'running');
  if (hasRunning) {
    task.status = 'waiting';
    task.statusText = '待执行';
    renderTaskTable();
    showToast('任务已加入排队，等待执行...');
  } else {
    task.status = 'running';
    task.statusText = '执行中';
    renderTaskTable();
    showToast('任务开始执行...');
    simulateTaskProgress(task.id);
  }
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

// 查看结果 - 跳转到寻源结果页
function viewResult(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  currentResultTask = task;

  // 每组结果会在左侧展示对应的上传图源，右侧展示该图源的商品信息
  // 这里先生成原型数据，真实上传图片接入后替换每组 source.img1 即可

  // 生成寻源结果数据
  generateSourcingResults(task.count || 20);

  // 切换到结果页
  switchPage('result');
  renderResultCards();
}

// 返回任务列表
function goListPage() {
  switchPage('list');
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
  const statuses = ['done', 'running', 'stopped', 'pending', 'waiting'];
  const statusTexts = { done: '已完成', running: '执行中', stopped: '已终止', pending: '未执行', waiting: '待执行' };
  // 检查初始数据中是否已有执行中的任务
  let runningAssigned = mockTasks.some(t => t.status === 'running');

  for (let i = 0; i < 35; i++) {
    const type = types[i % 3];
    let status = statuses[i % 5];
    // 确保只有一个任务处于执行中状态，其余的running改为waiting
    if (status === 'running') {
      if (runningAssigned) {
        status = 'waiting';
      } else {
        runningAssigned = true;
      }
    }
    const count = Math.floor(Math.random() * 800 + 50);
    const progress = status === 'done' ? 100 : (status === 'pending' || status === 'waiting') ? 0 : Math.floor(Math.random() * 90 + 5);
    const finished = (status === 'pending' || status === 'waiting') ? 0 : Math.floor(count * progress / 100);
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
      finishTime: (status === 'running' || status === 'pending' || status === 'waiting') ? '-' : `2026-07-${day} ${String(parseInt(hour) + 1).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`
    });
  }
  tasks = [...mockTasks];
})();

// ===== 初始化 =====
renderTaskTable();
updateUserCreditsDisplay();
// 让已有的执行中任务继续跑
tasks.filter(t => t.status === 'running').forEach(t => simulateTaskProgress(t.id));

// ===== 寻源结果数据 =====
let currentResultTask = null;
let sourcingResults = [];
let allSourcingResults = []; // 原始全量数据（不受状态筛选影响）
let resultSelectedIds = new Set();
let resultStatusFilter = 'all'; // all | success | fail
let resultPaginationState = { currentPage: 1, pageSize: 20, totalItems: 0, totalPages: 1 };

// 商品名模板
const productNames = [
  '网红创意榴莲玩偶可拆换 plush toy 毛绒玩具',
  '夏季冰丝空调毯 冷感毯 夏凉被',
  '北欧ins风收纳盒 大容量桌面整理盒',
  '硅胶厨房收纳架 可伸缩沥水置物架',
  '加厚不锈钢洗衣液收纳架 承重壁挂架',
  '创意玻璃花瓶 客厅桌面插花装饰',
  '多功能USB充电床头小夜灯 触控调光',
  '可折叠宠物猫窝 四季通用猫床',
  '智能体脂秤蓝牙电子秤 精准称重',
  '304不锈钢保温杯 大容量男女便携',
  '竹纤维毛巾速干浴巾 超吸水家用',
  '北欧风棉麻抱枕套 沙发靠垫套',
  '食品级硅胶保鲜盖 多尺寸弹力盖',
  '免打孔壁挂置物架 浴室厨房收纳',
  '防水牛津布收纳袋 大容量衣物袋',
  '可旋转调料收纳盒 厨房置物架',
  'ins风陶瓷马克杯 创意咖啡杯',
  '便携折叠洗衣盆 硅胶旅行洗脸盆',
  '加厚珍珠棉气泡膜 快递包装缓冲材',
  '实木小夜灯创意卧室床头氛围灯'
];

const factoryNames = [
  '容城县绒毛玩具加工厂', '义乌市百汇日用品厂', '深圳市创新家居厂',
  '广州白云区五金制品厂', '河北省保定市纺织品厂', '杭州余杭塑料厂',
  '义乌市创意百货商行', '温州瓯海洁具厂', '东莞市长安电子厂',
  '临沂市兰山区收纳厂', '潮州市枫溪区陶瓷厂', '佛山市顺德区家电厂'
];

const storeNames = [
  '百汇日用品专营店', '创新家居官方旗舰店', '五金批发大世界',
  '纺织品源头工厂店', '创意百货超市', '洁具批发中心',
  '电子产品专营店', '收纳专家', '陶瓷艺术坊', '家电直供'
];

const cities = ['河北容城县', '浙江义乌市', '广东深圳市', '广东广州市', '河北保定市', '浙江杭州市', '浙江温州市', '广东东莞市', '山东临沂市', '广东潮州市', '广东佛山市', '江苏南通市'];

// 生成寻源结果数据
function generateSourcingResults(count) {
  sourcingResults = [];
  resultSelectedIds.clear();
  const num = Math.min(count, 20); // 最多展示20条

  for (let i = 0; i < num; i++) {
    const price = (Math.random() * 200 + 5).toFixed(2);
    const moq = Math.random() > 0.3 ? 1 : Math.floor(Math.random() * 10 + 2);
    const weightMin = Math.floor(Math.random() * 400 + 20);
    const weightMax = weightMin + Math.floor(Math.random() * 300 + 50);
    const monthlyOrders = Math.floor(Math.random() * 500);
    const monthlyPieces = Math.floor(Math.random() * 2000 + 10);
    const monthlySales = (parseFloat(price) * monthlyPieces).toFixed(2);
    const collect24h = Math.floor(Math.random() * 40 + 60);
    const collect48h = Math.min(100, collect24h + Math.floor(Math.random() * 30 + 5));
    const responseRate = (Math.random() * 60 + 30).toFixed(1);
    const isFactory = Math.random() > 0.5;
    const listingDays = Math.floor(Math.random() * 90 + 1);
    const listingDate = new Date(Date.now() - listingDays * 86400000);
    const listingDateStr = `${listingDate.getFullYear()}-${String(listingDate.getMonth()+1).padStart(2,'0')}-${String(listingDate.getDate()).padStart(2,'0')}`;
    const similarity = Math.random();
    const isNew = listingDays < 30;
    const skuCount = Math.floor(Math.random() * 30 + 1);
    const shippingFee = Math.random() > 0.2 ? parseFloat((Math.random() * 15 + 3).toFixed(1)) : 0;
    const shipText = shippingFee === 0 ? '包邮' : `${shippingFee}`;
    const memberTypes = [];
    if (Math.random() > 0.5) memberTypes.push('实力商家');
    if (Math.random() > 0.7) memberTypes.push('超级工厂');
    if (Math.random() > 0.3) memberTypes.push('诚信通');

    // 寻源状态：大部分成功，少量失败
    const searchStatus = Math.random() > 0.15 ? 'success' : 'fail';

    sourcingResults.push({
      id: i + 1,
      img1: `https://picsum.photos/seed/p${i}a/400/400`,
      img2: `https://picsum.photos/seed/p${i}b/160/160`,
      sourceImg: `https://picsum.photos/seed/source-${Math.floor(i / 4)}/300/300`,
      title: productNames[i % productNames.length],
      category: ['毛绒公仔', '家居日用', '收纳整理', '厨房用品', '纺织品', '电子产品', '陶瓷工艺'][i % 7],
      skuCount,
      isNew,
      listingDate: listingDateStr,
      listingDays,
      price: parseFloat(price),
      moq,
      shippingFee: shipText,
      city: cities[i % cities.length],
      weightMin,
      weightMax,
      monthlyOrders,
      monthlyPieces,
      monthlySales: parseFloat(monthlySales),
      collect24h,
      collect48h,
      responseRate: parseFloat(responseRate),
      isFactory,
      storeName: isFactory ? factoryNames[i % factoryNames.length] : storeNames[i % storeNames.length],
      memberTypes,
      similarity,
      searchStatus
    });
  }

  resultPaginationState.totalItems = sourcingResults.length;
  resultPaginationState.currentPage = 1;
  allSourcingResults = [...sourcingResults];
  resultStatusFilter = 'all';
  updateResultStatusTabs();
}

// 状态筛选：更新标签计数
function updateResultStatusTabs() {
  // 状态筛选已从结果页移除，保留函数以兼容旧的初始化调用。
  return;
}

// 应用状态筛选
function applyStatusFilter(status) {
  resultStatusFilter = status;
  // 更新标签高亮
  document.querySelectorAll('.result-status-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.status === status);
  });
  // 筛选数据
  if (status === 'all') {
    sourcingResults = [...allSourcingResults];
  } else {
    sourcingResults = allSourcingResults.filter(p => p.searchStatus === status);
  }
  resultPaginationState.currentPage = 1;
  resultPaginationState.totalItems = sourcingResults.length;
  renderResultCards();
}

// 渲染寻源结果：每一行对应一个上传图源，右侧展示该图源的商品信息
function renderResultCards() {
  const rows = document.getElementById('resultRows');
  const empty = document.getElementById('resultEmpty');
  const paged = getResultPagedItems();
  // 回退到每行4个商品，兼容性和视觉效果更稳妥
  const groupSize = 4;

  document.getElementById('resultCount').textContent = sourcingResults.length;
  document.getElementById('resultPaginationTotal').textContent = `共 ${sourcingResults.length} 条`;

  if (!rows) return;
  if (sourcingResults.length === 0) {
    rows.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    const groups = [];
    for (let i = 0; i < paged.length; i += groupSize) groups.push(paged.slice(i, i + groupSize));
    rows.innerHTML = groups.map((products, groupIndex) => {
      const source = products[0];
      const sourceImage = source.sourceImg || source.img1;
      const rowSelected = products.every(p => resultSelectedIds.has(p.id));
      const rowChecked = rowSelected ? 'checked' : '';
      const cards = products.map(p => {
        const selected = resultSelectedIds.has(p.id) ? 'selected' : '';
        return `
          <div class="result-product-card ${selected}" data-id="${p.id}">
            <div class="result-card-img-wrap">
              <img src="${p.img1}" alt="${p.title}" onerror="this.style.display='none'">
              <div class="result-card-meta-top">
                <span class="result-card-meta-item"><strong>类目:</strong> ${p.category}</span>
                <span class="result-card-meta-item"><strong>SKU:</strong> ${p.skuCount}</span>
                <span class="result-card-meta-item"><strong>上架:</strong> ${p.listingDate}</span>
              </div>
            </div>
            <div class="result-card-info">
              <div class="result-product-title" title="${p.title}">${p.isNew ? '<span class="result-tag new">新品</span>' : ''}<span class="result-title-text">${p.title}</span></div>
              <div class="result-card-price-row"><span class="result-card-price">¥${p.price.toFixed(2)}</span><span class="result-card-moq">起批量 ${p.moq}件</span></div>
              <div class="result-card-ship-row"><span class="result-ship-item ${p.shippingFee === 0 ? 'free-shipping' : ''}">运费: ${p.shippingFee === 0 ? '包邮' : `¥${p.shippingFee}`}</span><span class="result-ship-item">包装: 仅披露重量(${p.weightMin}g)</span></div>
              <div class="result-card-data-grid">
                <div class="result-data-cell"><span class="result-data-label">月件数</span><span class="result-data-value emphasis">${p.monthlyPieces}</span></div>
                <div class="result-data-cell"><span class="result-data-label">月销</span><span class="result-data-value">¥${p.monthlySales.toFixed(0)}</span></div>
                <div class="result-data-cell"><span class="result-data-label">24H</span><span class="result-data-value">${p.collect24h}%</span></div>
                <div class="result-data-cell"><span class="result-data-label">48H</span><span class="result-data-value">${p.collect48h}%</span></div>
              </div>
            </div>
            <div class="result-card-store"><span class="result-store-type ${p.isFactory ? 'factory' : 'store'}">${p.isFactory ? '工厂' : '店铺'}</span><span class="result-store-name" title="${p.storeName}">${p.storeName}</span><span class="result-store-location">${p.city}</span></div>
          </div>
        `;
      }).join('');
      return `
        <section class="result-source-row" data-row="${groupIndex + 1}">
          <aside class="result-source-column">
            <label class="result-source-checkbox"><input type="checkbox" ${rowChecked} onchange="toggleResultRowSelect(${groupIndex}, this.checked)"></label>
            <div class="result-source-image-wrap"><img src="${sourceImage}" alt="上传图片 ${groupIndex + 1}"></div>
            <div class="result-source-label">url_${String(groupIndex + 1).padStart(4, '0')}.jpg</div>
            <div class="result-source-count">${products.length * 12} 个结果</div>
            <button class="result-source-search-btn" onclick="showToast('全网图搜已触发')">全网图搜</button>
          </aside>
          <div class="result-source-products">${cards}</div>
        </section>
      `;
    }).join('');
  }

  updateResultSelectedCount();
  renderResultPagination();
}

// 切换选中
function toggleResultSelect(id) {
  if (resultSelectedIds.has(id)) {
    resultSelectedIds.delete(id);
  } else {
    resultSelectedIds.add(id);
  }
  const card = document.querySelector(`.result-product-card[data-id="${id}"]`);
  if (card) card.classList.toggle('selected', resultSelectedIds.has(id));
  updateResultSelectedCount();
}

// 整行勾选（左侧上传图片勾选框）
function toggleResultRowSelect(groupIndex, checked) {
  const paged = getResultPagedItems();
  const groupSize = 4;
  const start = groupIndex * groupSize;
  const rowProducts = paged.slice(start, start + groupSize);
  if (checked) {
    rowProducts.forEach(p => resultSelectedIds.add(p.id));
  } else {
    rowProducts.forEach(p => resultSelectedIds.delete(p.id));
  }
  renderResultCards();
}

function updateResultSelectedCount() {
  document.getElementById('resultSelectedCount').textContent = resultSelectedIds.size;
  const selectAll = document.getElementById('resultSelectAll');
  if (!selectAll) return;
  const paged = getResultPagedItems();
  const selectedInPage = paged.filter(p => resultSelectedIds.has(p.id)).length;
  if (selectedInPage === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else if (selectedInPage === paged.length) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  }
}

// 全选：切换全部结果的选中状态
document.getElementById('resultSelectAll')?.addEventListener('change', (e) => {
  if (e.target.checked) {
    sourcingResults.forEach(p => resultSelectedIds.add(p.id));
  } else {
    resultSelectedIds.clear();
  }
  renderResultCards();
});

// 分页
function getResultPagedItems() {
  const { currentPage, pageSize } = resultPaginationState;
  const start = (currentPage - 1) * pageSize;
  return sourcingResults.slice(start, start + pageSize);
}

function updateResultPaginationState() {
  resultPaginationState.totalItems = sourcingResults.length;
  resultPaginationState.totalPages = Math.max(1, Math.ceil(sourcingResults.length / resultPaginationState.pageSize));
  if (resultPaginationState.currentPage > resultPaginationState.totalPages) {
    resultPaginationState.currentPage = resultPaginationState.totalPages;
  }
}

function renderResultPagination() {
  updateResultPaginationState();
  const { currentPage, totalItems, totalPages } = resultPaginationState;
  const nav = document.getElementById('resultPaginationNav');
  if (!nav) return;

  let html = '';
  html += `<button class="page-nav-btn prev" ${currentPage === 1 ? 'disabled' : ''} onclick="goResultPage(${currentPage - 1})">&lt;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-nav-btn ${i === currentPage ? 'active' : ''}" onclick="goResultPage(${i})">${i}</button>`;
  }
  html += `<button class="page-nav-btn next" ${currentPage === totalPages ? 'disabled' : ''} onclick="goResultPage(${currentPage + 1})">&gt;</button>`;
  nav.innerHTML = html;
}

function goResultPage(page) {
  if (page < 1 || page > resultPaginationState.totalPages) return;
  resultPaginationState.currentPage = page;
  renderResultCards();
}

document.getElementById('resultPageSize')?.addEventListener('change', (e) => {
  resultPaginationState.pageSize = parseInt(e.target.value);
  resultPaginationState.currentPage = 1;
  renderResultCards();
});

document.getElementById('resultGotoPageBtn')?.addEventListener('click', () => {
  const input = document.getElementById('resultGotoPageInput');
  const page = parseInt(input.value);
  if (page && page >= 1 && page <= resultPaginationState.totalPages) {
    goResultPage(page);
  } else {
    showToast('请输入有效的页码');
  }
});

document.getElementById('resultGotoPageInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('resultGotoPageBtn')?.click();
});

// ===== 寻源结果页初始化（URL 直接访问时）=====
if (window._initResultPage) {
  const doneTask = mockTasks.find(t => t.status === 'done') || mockTasks[0];
  if (doneTask) {
    currentResultTask = doneTask;
    generateSourcingResults(20);
    renderResultCards();
  }
  window._initResultPage = false;
}
