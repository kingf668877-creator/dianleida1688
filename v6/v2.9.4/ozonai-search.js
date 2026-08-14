(() => {
  const steps = Array.from(document.querySelectorAll('.step'));
  const status = document.getElementById('analysis-status');
  const restart = document.getElementById('restart');
  const timers = new Set();
  let runToken = 0;

  const states = {
    step1: { classes: ['running','waiting','waiting'], text: '正在提取核心词' },
    step2: { classes: ['done','running','waiting'], text: '正在扩展搜索关键词' },
    step3: { classes: ['done','done','running'], text: '正在匹配类目' }
  };

  function render(name) {
    const state = states[name];
    steps.forEach((step, index) => {
      step.classList.remove('done', 'running', 'waiting');
      step.classList.add(state.classes[index]);
      step.querySelector('.step-dot').textContent = state.classes[index] === 'done' ? '✓' : '●';
    });
    status.textContent = state.text;
  }

  function cancelRun() {
    runToken += 1;
    timers.forEach(clearTimeout);
    timers.clear();
  }

  function later(delay, token, action) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (token === runToken) action();
    }, delay);
    timers.add(timer);
  }

  function startRun() {
    cancelRun();
    const token = runToken;
    render('step1');
    later(1200, token, () => render('step2'));
    later(2800, token, () => render('step3'));
  }

  restart.addEventListener('click', startRun);
  window.addEventListener('pagehide', cancelRun);
  startRun();
})();