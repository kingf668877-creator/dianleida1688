const input=document.getElementById('searchInput');
const count=document.getElementById('charCount');
const clearBtn=document.getElementById('clearBtn');
const form=document.getElementById('searchForm');
const searchBtn=document.getElementById('searchBtn');
const resultPanel=document.getElementById('resultPanel');
const resultText=document.getElementById('resultText');
function syncCount(){count.textContent=input.value.length;searchBtn.disabled=!input.value.trim();}
input.addEventListener('input',syncCount);
clearBtn.addEventListener('click',()=>{input.value='';syncCount();input.focus();resultPanel.classList.remove('show');});
document.querySelectorAll('.examples button').forEach(button=>button.addEventListener('click',()=>{input.value=button.textContent.trim();syncCount();input.focus();}));
form.addEventListener('submit',event=>{event.preventDefault();const query=input.value.trim();if(!query)return;resultText.textContent=`已识别需求：“${query}”。正在匹配 OZON 类目、价格带与热销商品。`;resultPanel.classList.add('show');});
syncCount();
