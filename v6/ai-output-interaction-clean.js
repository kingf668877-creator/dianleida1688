// AI 输出结果交互 - 分析完成提示条
// 展开/收起按钮交互

const expandBtn = document.querySelector('.expand-btn');
if (expandBtn) {
  expandBtn.addEventListener('click', () => {
    expandBtn.classList.toggle('expanded');
  });
}
