(() => {
  const storageKey = 'v3-update-prototype-state-v3';
  const db = {
    currentVersion: '2.9.8',
    latestVersion: '3.6.0',
    notes: [
      { title: '优化加载速度', detail: '插件加载更稳定，数据分析面板打开更快。' },
      { title: '新增 OZON 官网插件', detail: '支持 OZON 官网搜索页和详情页数据分析。' }
    ],
    products: [
      { name: '秋冬加厚连帽冲锋衣男女同款', price: '89.00', sales: '2.3万+', shop: '杭州拓野服饰' },
      { name: '户外防风防水三合一登山服', price: '76.50', sales: '9800+', shop: '泉州纵横供应链' },
      { name: '冬季加绒工装棉服外套', price: '58.80', sales: '1.6万+', shop: '广州麦田制衣' },
      { name: '新款男女同款软壳衣', price: '69.90', sales: '7500+', shop: '义乌山野户外' },
      { name: '跨境保暖抓绒冲锋衣', price: '92.00', sales: '4300+', shop: '宁波极光服饰' }
    ]
  };
  const api = {
    async checkVersion() {
      await new Promise(resolve => setTimeout(resolve, 260));
      return { code: 0, data: { currentVersion: db.currentVersion, latestVersion: db.latestVersion, hasUpdate: true } };
    },
    async startUpdate() {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { code: 0, data: { step: 'guide', downloadUrl: 'https://www.dianleida.net/download/' } };
    }
  };
  const elements = {
    layer: document.getElementById('updateLayer'),
    releaseView: document.getElementById('releaseView'),
    guideView: document.getElementById('guideView'),
    close: document.getElementById('closeModal'),
    later: document.getElementById('laterBtn'),
    update: document.getElementById('updateBtn'),
    back: document.getElementById('backBtn'),
    finish: document.getElementById('finishBtn'),
    dot: document.getElementById('entryDot'),
    toast: document.getElementById('toast'),
    reset: document.getElementById('resetDemo'),
    clear: document.getElementById('clearUpdate'),
    productGrid: document.getElementById('productGrid'),
    releaseList: document.getElementById('releaseList'),
    floatingPlugin: document.getElementById('floatingPlugin'),
    closeFloating: document.getElementById('closeFloatingPlugin'),
    floatingUpdateTool: document.querySelector('.floating-update-tool')
  };
  let state = readState();
  let toastTimer;

  function readState() {
    try { return { dismissed: false, updated: false, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; }
    catch (error) { return { dismissed: false, updated: false }; }
  }
  function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }

  function renderStaticData() {
    document.querySelectorAll('[data-current-version]').forEach(node => { node.textContent = db.currentVersion; });
    document.querySelectorAll('[data-latest-version]').forEach(node => { node.textContent = db.latestVersion; });
    if (elements.releaseList) elements.releaseList.innerHTML = db.notes.map(note => `<article class="release-item"><span class="release-icon">✓</span><div><strong>${note.title}</strong><p>${note.detail}</p></div></article>`).join('');
    if (elements.productGrid) elements.productGrid.innerHTML = db.products.map(product => `<article class="product-card"><div class="product-image"><div class="jacket"></div></div><div class="product-body"><div class="product-tags"><span class="product-tag">实力商家</span><span class="product-tag">一件代发</span></div><p class="product-name">${product.name}</p><div class="price-row"><span class="price"><small>¥</small>${product.price}</span><span class="sales">月销 ${product.sales}</span></div><div class="shop">${product.shop}</div></div></article>`).join('');
  }

  function syncUpdateState() {
    const hasUpdate = !state.updated;
    if (elements.dot) elements.dot.classList.toggle('hidden', state.updated);
    document.querySelectorAll('.floating-update-main').forEach(button => button.classList.toggle('has-update', hasUpdate));
    document.querySelectorAll('.floating-update-tool').forEach(button => button.classList.toggle('has-update', hasUpdate));
    document.querySelectorAll('.floating-update-dot').forEach(dot => dot.classList.toggle('hidden', state.updated));
    document.querySelectorAll('[data-current-version]').forEach(node => { node.textContent = state.updated ? db.latestVersion : db.currentVersion; });
    document.querySelectorAll('[data-open-update]').forEach(button => {
      button.setAttribute('aria-label', state.updated ? '插件已是最新版本' : '打开插件更新提醒');
      button.setAttribute('title', state.updated ? '插件已是最新版本' : '发现新版本');
    });
    document.querySelectorAll('.version-link').forEach(button => { button.textContent = state.updated ? '已是最新版本' : '发现新版本'; });
  }

  function setView(view) {
    const guideActive = view === 'guide';
    if (elements.releaseView) elements.releaseView.classList.toggle('is-hidden', guideActive);
    if (elements.guideView) elements.guideView.classList.toggle('is-active', guideActive);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2200);
  }

  function openModal() {
    if (!elements.layer) return;
    if (state.updated) { showToast('当前已是最新版本 v' + db.latestVersion); return; }
    setView('release');
    elements.layer.classList.remove('is-hidden');
    if (elements.close && typeof elements.close.focus === 'function') {
      setTimeout(() => { try { elements.close.focus(); } catch (error) {} }, 0);
    }
  }

  function closeModal() { if (elements.layer) elements.layer.classList.add('is-hidden'); }

  async function beginUpdate() {
    if (!elements.update) return;
    elements.update.disabled = true;
    elements.update.textContent = '正在准备...';
    const response = await api.startUpdate();
    elements.update.disabled = false;
    elements.update.textContent = '立即升级';
    if (response.code === 0) setView('guide');
  }

  function postpone() {
    state.dismissed = true;
    saveState();
    closeModal();
    showToast('已设置稍后提醒，更新入口会继续保留');
  }

  function finishUpdate() {
    state.updated = true;
    state.dismissed = true;
    saveState();
    syncUpdateState();
    closeModal();
    showToast('模拟完成：更新红点已消失');
  }

  function resetDemo() {
    state = { dismissed: false, updated: false };
    saveState();
    syncUpdateState();
    openModal();
    showToast('已恢复首次发现新版本状态');
  }

  function bindEvents() {
    document.querySelectorAll('[data-open-update]').forEach(button => button.addEventListener('click', openModal));
    if (elements.close) elements.close.addEventListener('click', closeModal);
    if (elements.later) elements.later.addEventListener('click', postpone);
    if (elements.update) elements.update.addEventListener('click', beginUpdate);
    if (elements.back) elements.back.addEventListener('click', () => setView('release'));
    if (elements.finish) elements.finish.addEventListener('click', finishUpdate);
    if (elements.reset) elements.reset.addEventListener('click', resetDemo);
    if (elements.clear) elements.clear.addEventListener('click', finishUpdate);
    if (elements.closeFloating) {
      elements.closeFloating.addEventListener('click', () => {
        if (elements.floatingPlugin) elements.floatingPlugin.classList.add('is-hidden');
        showToast('已隐藏插件悬浮工具条');
      });
    }
    if (elements.layer) {
      elements.layer.addEventListener('click', event => { if (event.target === elements.layer) closeModal(); });
    }
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && elements.layer && !elements.layer.classList.contains('is-hidden')) closeModal(); });
  }

  async function init() {
    try {
      renderStaticData();
      bindEvents();
      syncUpdateState();
      const response = await api.checkVersion();
      if (response.code !== 0) { showToast('版本检查失败，请稍后重试'); return; }
    } catch (error) {
      console.error('[plugin-update] init failed:', error);
      showToast('初始化失败，请刷新页面');
    }
  }
  init();
})();