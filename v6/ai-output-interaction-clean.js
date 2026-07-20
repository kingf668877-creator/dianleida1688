// AI 输出结果交互 - 商品列表展示页
// 包含全选、已选计数等基础交互

const selectAll = document.getElementById('selectAll');
const cardCheckboxes = document.querySelectorAll('.card-checkbox input[type="checkbox"]');
const selectedCountEl = document.querySelector('.selected-count');

if (selectAll) {
  selectAll.addEventListener('change', () => {
    const checked = selectAll.checked;
    cardCheckboxes.forEach(cb => { cb.checked = checked; });
    updateSelectedCount();
  });
}

cardCheckboxes.forEach(cb => {
  cb.addEventListener('change', updateSelectedCount);
});

function updateSelectedCount() {
  const checked = document.querySelectorAll('.card-checkbox input[type="checkbox"]:checked').length;
  if (selectedCountEl) {
    selectedCountEl.textContent = `已选 ${checked}`;
  }
  if (selectAll) {
    selectAll.checked = checked === cardCheckboxes.length && checked > 0;
  }
}
