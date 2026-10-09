/* ================= 后台-AI订单 原型交互 ================= */
var MENU = [
  {icon:'icon-peoples', label:'客户服务'},
  {icon:'icon-dict', label:'订单管理', open:true, children:[
    ['icon-dict','全部订单'],['icon-shopping','待支付订单'],['icon-dict','MCP订单'],['icon-dict','AI订单',1]
  ]},
  {icon:'icon-list', label:'优惠券管理'},
  {icon:'icon-peoples', label:'代理邀请管理'},
  {icon:'icon-list', label:'业务管理'},
  {icon:'icon-peoples', label:'运营管理'}
];
function renderMenu(){
  var html = '';
  MENU.forEach(function(m){
    if(m.children){
      html += '<li class="el-submenu'+(m.open?' is-opened':'')+'"><div class="el-submenu__title"><svg class="svg-icon"><use href="#'+m.icon+'"></use></svg><span>'+m.label+'</span><i class="el-submenu__icon-arrow">▼</i></div><ul class="el-menu--inline"'+(m.open?'':' style="display:none"')+'>';
      m.children.forEach(function(c){
        html += '<li class="el-menu-item'+(c[2]?' is-active':'')+'"><svg class="svg-icon"><use href="#'+c[0]+'"></use></svg><span>'+c[1]+'</span></li>';
      });
      html += '</ul></li>';
    } else {
      html += '<li class="submenu-title-noDropdown"><svg class="svg-icon"><use href="#'+m.icon+'"></use></svg><span>'+m.label+'</span></li>';
    }
  });
  document.getElementById('sideMenu').innerHTML = html;
  document.getElementById('sideMenu').addEventListener('click', function(e){
    var t = e.target.closest('.el-submenu__title');
    if(t){ t.parentNode.classList.toggle('is-opened'); var ul=t.nextElementSibling; if(ul) ul.style.display = ul.style.display==='none'?'':'none'; }
  });
}

/* ================= 通用组件（下拉 / toast / 弹窗） ================= */
var SEL = {};
function initSelect(name, options, onChange){
  var wrap = document.querySelector('[data-select="'+name+'"]');
  if(!wrap) return;
  var input = wrap.querySelector('input');
  var ul = wrap.querySelector('ul');
  var s = SEL[name] = { wrap:wrap, input:input, ul:ul, value:'', onChange:onChange||null };
  ul.innerHTML = options.map(function(o){ return '<li data-v="'+o+'">'+o+'</li>'; }).join('');
  input.addEventListener('click', function(e){
    e.stopPropagation();
    var isOpen = wrap.classList.contains('open');
    closeAllSelects();
    if(!isOpen) wrap.classList.add('open');
  });
  ul.addEventListener('click', function(e){
    var li = e.target.closest('li'); if(!li) return;
    s.value = li.getAttribute('data-v');
    input.value = s.value;
    ul.querySelectorAll('li').forEach(function(x){ x.classList.toggle('selected', x===li); });
    wrap.classList.remove('open');
    if(s.onChange) s.onChange(s.value);
  });
}
function closeAllSelects(){ document.querySelectorAll('.select-wrap.open').forEach(function(w){ w.classList.remove('open'); }); }
document.addEventListener('click', closeAllSelects);
var toastTimer = null;
function toast(msg, type){
  var wrap = document.getElementById('toastWrap');
  var el = document.createElement('div');
  el.className = 'el-message ' + (type || 'success');
  el.textContent = msg;
  wrap.innerHTML = '';
  wrap.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.remove(); }, 2200);
}
function closeDialog(id){ document.getElementById(id).classList.remove('show'); }
function openDialog(id){ document.getElementById(id).classList.add('show'); }
function now(){
  function p(n){ return (n<10?'0':'')+n; }
  var d = new Date();
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
}
function fmtAi(v){
  if(v===''||v===null||v===undefined) return '--';
  v = Number(v);
  if(isNaN(v)) return '--';
  return (v%10000===0 ? (v/10000)+'万点' : v+'点');
}
function payTag(st){
  var cls = st==='已支付' ? 'pay-ok' : (st==='待支付' ? 'pay-wait' : 'pay-close');
  return '<span class="tag-dot '+cls+'"></span>'+st;
}

/* ================= 数据 ================= */
var AI_PACKAGES = [
  {name:'AI体验包（月）', points:100000, price:'9.9', dur:'月'},
  {name:'AI标准包（月）', points:1000000, price:'99', dur:'月'},
  {name:'AI旗舰包（年）', points:10000000, price:'499', dur:'年'}
];
function seed(){
  var r = function(phone,nick,renew,type,pkg,ai,left,today,dur,price,dis,pay,st,src,created,end,no){
    return {phone:phone,nick:nick,renew:renew,type:type,pkg:pkg,aiPoints:ai,left:left,today:today,dur:dur,price:price,dis:dis,pay:pay,st:st,src:src,created:created,end:end,no:no};
  };
  return [
    r('18373229819','--','否/0','AI订单','AI体验包（月）',100000,100000,0,'月','9.9','0','9.9','已支付','线上订单','2026-10-09 14:33:05','2026-11-09 23:59:59','202610091433046571'),
    r('18790971249','🍇','否/0','AI订单','AI体验包（月）',100000,98000,2000,'月','9.9','0','9.9','已支付','线上订单','2026-10-09 10:12:40','2026-11-09 23:59:59','202610091012406233'),
    r('13922334455','AI运营小助手','是/2','AI订单','AI标准包（月）',1000000,860000,140000,'月','99','20','79','已支付','手工订单','2026-10-08 16:40:11','2026-11-08 23:59:59','202610081640118877'),
    r('13666778899','Molly','否/0','AI订单','AI旗舰包（年）',10000000,10000000,0,'年','499','100','399','待支付','线上订单','2026-10-08 09:05:22','--','202610080905224410'),
    r('15099887766','老张做跨境','否/0','AI订单','AI标准包（月）',1000000,1000000,0,'月','','99','0','已关闭','线上订单','2026-10-07 11:30:00','--','202610071130009922'),
    r('18911223344','Lisa','是/1','AI订单','AI体验包（月）',100000,84500,15500,'月','0','0','0','已支付','赠送订单','2026-10-06 15:20:33','2026-11-05 23:59:59','202610061520335566'),
    r('17766554433','Peter外贸笔记','否/0','AI订单','AI体验包（月）',100000,80000,20000,'月','9.9','0','9.9','已支付','手工订单','2026-10-05 20:08:45','2026-11-04 23:59:59','202610052008451120'),
    r('13512349876','阿May','否/0','AI订单','AI标准包（月）',1000000,720000,280000,'月','99','0','99','已支付','线上订单','2026-10-04 08:45:19','2026-11-04 23:59:59','202610040845193340')
  ];
}
var STORE_KEY = 'dld_ai_order_v1';
var list = [];
function load(){ try{ var raw = localStorage.getItem(STORE_KEY); if(raw){ list = JSON.parse(raw); return; } }catch(e){} list = seed(); save(); }
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(list)); }catch(e){} }

/* ================= 筛选与渲染 ================= */
var applied = { st:'全部', renew:'全部', type:'全部', src:'全部', phone:'' };
function filtered(){
  return list.filter(function(r){
    if(applied.st!=='全部' && r.st!==applied.st) return false;
    if(applied.renew!=='全部' && (applied.renew==='是') !== (r.renew.indexOf('是')===0)) return false;
    if(applied.type!=='全部' && r.type!==applied.type) return false;
    if(applied.src!=='全部' && r.src!==applied.src) return false;
    if(applied.phone && r.phone.indexOf(applied.phone)<0) return false;
    return true;
  });
}
function renderTable(){
  var rows = filtered();
  document.getElementById('totalCount').textContent = rows.length;
  var tb = document.getElementById('tableBody');
  if(!rows.length){
    tb.innerHTML = '<tr><td colspan="18" style="padding:40px 0;color:#909399">暂无数据</td></tr>';
    return;
  }
  tb.innerHTML = rows.map(function(r){
    var ops = '<button class="el-button el-button--text el-button--small" data-act="detail" data-no="'+r.no+'">明细</button>';
    var cells = [r.phone, r.nick, r.renew, r.type+(r.type==='AI订单'?'<span class="st-ai">AI</span>':''), r.pkg,
      '<span class="col-new-text">'+fmtAi(r.aiPoints)+'</span>', fmtAi(r.left), String(r.today), r.dur,
      (r.price===''?'--':r.price), (r.dis===''?'--':r.dis), (r.pay===''?'--':r.pay),
      payTag(r.st), r.src, ' '+r.created+' ', r.end, r.no, '<div class="op-btns">'+ops+'</div>'];
    return '<tr>'+cells.map(function(c){ return '<td><div class="cell">'+c+'</div></td>'; }).join('')+'</tr>';
  }).join('');
}

/* ================= 创建手工订单 / 赠送订单 ================= */
function nextNo(d){
  return d.replace(/[-: ]/g,'') + String(Math.floor(Math.random()*900)+100);
}
function bindCreate(btnId, dlgId, onSave){
  document.getElementById(btnId).addEventListener('click', function(){
    var phone = document.getElementById(btnId==='btnManualSave'?'mPhone':'gPhone').value.trim();
    var pkg = SEL[btnId==='btnManualSave'?'mPkg':'gPkg'].value;
    if(!/^1\d{10}$/.test(phone)){ toast('请输入正确的手机号','error'); return; }
    if(!pkg){ toast('请选择AI套餐','error'); return; }
    onSave(phone, pkg);
  });
}
document.getElementById('btnSearch').addEventListener('click', function(){
  applied.phone = document.getElementById('fPhone').value.trim();
  renderTable(); toast('已刷新');
});
document.getElementById('btnManual').addEventListener('click', function(){ openDialog('dlgManual'); });
document.getElementById('btnGift').addEventListener('click', function(){ openDialog('dlgGift'); });
document.getElementById('btnExport').addEventListener('click', function(){ toast('已导出当前筛选订单（演示）'); });
bindCreate('btnManualSave', 'dlgManual', function(phone, pkgName){
  var pkg = AI_PACKAGES.find(function(x){ return x.name===pkgName; });
  var pts = document.getElementById('mPoints').value.trim();
  var price = document.getElementById('mPrice').value.trim();
  var d = now();
  list.unshift({phone:phone,nick:'--',renew:'否/0',type:'AI订单',pkg:pkgName,
    aiPoints:pts===''?(pkg.points||0):Number(pts), left:pts===''?(pkg.points||0):Number(pts), today:0,
    dur:pkg.dur, price:price===''?(pkg.price||'0'):price, dis:'0', pay:price===''?(pkg.price||'0'):price,
    st:'已支付', src:'手工订单', created:d, end:'--', no:nextNo(d)});
  save(); closeDialog('dlgManual'); renderTable(); toast('手工订单创建成功');
});
bindCreate('btnGiftSave', 'dlgGift', function(phone, pkgName){
  var pkg = AI_PACKAGES.find(function(x){ return x.name===pkgName; });
  var pts = document.getElementById('gPoints').value.trim();
  var note = document.getElementById('gNote').value.trim();
  var d = now();
  list.unshift({phone:phone,nick:'--',renew:'否/0',type:'AI订单',pkg:pkgName,
    aiPoints:pts===''?(pkg.points||0):Number(pts), left:pts===''?(pkg.points||0):Number(pts), today:0,
    dur:SEL.gDur.value||'7天', price:'0', dis:'0', pay:'0',
    st:'已支付', src:'赠送订单', created:d, end:'--', no:nextNo(d)});
  save(); closeDialog('dlgGift'); renderTable(); toast('赠送订单创建成功' + (note?'（'+note+'）':''));
});

/* ================= 点数明细（充值 / 消耗） ================= */
var curDetail = null;
function renderDetailTab(tab){
  document.querySelectorAll('.detail-tab').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-tab')===tab); });
  document.getElementById('detailRecharge').style.display = tab==='recharge' ? '' : 'none';
  document.getElementById('detailConsume').style.display = tab==='consume' ? '' : 'none';
  if(!curDetail) return;
  if(tab==='recharge'){
    var re = list.filter(function(x){ return x.phone===curDetail.phone; });
    var sum = 0;
    document.getElementById('rechargeBody').innerHTML = re.map(function(x){
      sum += Number(x.aiPoints)||0;
      return '<tr>'+[x.no, x.pkg, x.created, '<span class="pt-add">+'+fmtAi(x.aiPoints)+'</span>'].map(function(c){ return '<td><div class="cell">'+c+'</div></td>'; }).join('')+'</tr>';
    }).join('');
    document.getElementById('rechargeSum').innerHTML = '共 <i>'+re.length+'</i> 条 · 累计充值 <i>'+fmtAi(sum)+'</i>';
  } else {
    var base = curDetail.created.slice(0,10);
    var uses = [['09:12','AI标题生成',2000],['10:05','AI选品分析',5000],['14:37','AI详情描述',3000],['16:20','AI卖点提炼',2000],['18:03','AI竞品洞察',5000]];
    var cut = 0;
    document.getElementById('consumeBody').innerHTML = uses.map(function(u){
      cut += u[2];
      return '<tr>'+[base+' '+u[0], u[1], '<span class="pt-cut">-'+u[2]+'</span>'].map(function(c){ return '<td><div class="cell">'+c+'</div></td>'; }).join('')+'</tr>';
    }).join('');
    document.getElementById('consumeSum').innerHTML = '共 <i>'+uses.length+'</i> 条 · 累计消耗 <i>'+cut+' 点</i>';
  }
}
document.querySelectorAll('.detail-tab').forEach(function(b){
  b.addEventListener('click', function(){ renderDetailTab(b.getAttribute('data-tab')); });
});
document.getElementById('tableBody').addEventListener('click', function(e){
  var b = e.target.closest('button[data-act="detail"]'); if(!b) return;
  var rec = list.find(function(x){ return x.no===b.getAttribute('data-no'); }); if(!rec) return;
  curDetail = rec;
  document.getElementById('detailTitle').textContent = '点数明细';
  document.getElementById('detailSub').innerHTML = rec.phone + ' · ' + rec.pkg + ' · 剩余点数 <b>' + fmtAi(rec.left) + '</b>';
  renderDetailTab('recharge');
  openDialog('dlgDetail');
});

/* ================= 初始化 ================= */
renderMenu();
load();
initSelect('fStatus', ['全部','待支付','已支付','已关闭'], function(v){ applied.st=v; renderTable(); });
initSelect('fRenew', ['全部','是','否'], function(v){ applied.renew=v; renderTable(); });
initSelect('fType', ['全部','AI订单'], function(v){ applied.type=v; renderTable(); });
initSelect('fSource', ['全部','线上订单','手工订单','赠送订单'], function(v){ applied.src=v; renderTable(); });
initSelect('mPkg', AI_PACKAGES.map(function(x){ return x.name; }), function(v){
  var pkg = AI_PACKAGES.find(function(x){ return x.name===v; });
  document.getElementById('mPoints').value = pkg.points ? String(pkg.points) : '';
  document.getElementById('mPrice').value = pkg.price || '';
});
initSelect('gPkg', AI_PACKAGES.map(function(x){ return x.name; }), function(v){
  var pkg = AI_PACKAGES.find(function(x){ return x.name===v; });
  document.getElementById('gPoints').value = pkg.points ? String(pkg.points) : '';
});
initSelect('gDur', ['7天','月','年']);
renderTable();
