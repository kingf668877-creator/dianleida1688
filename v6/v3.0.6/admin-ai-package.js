/* ================= 基础配置 ================= */
var ECO = ['Ozon生态','拼多多生态','阿里生态','通用'];
var BIZ = ['会员套餐','服务','AI服务'];
var SUB_MAP = { '会员套餐':['年套餐','半年套餐','季度套餐','月套餐'], '服务':['MCP增值包','API增值包'], 'AI服务':['AI点数包'] };
var CAT_MAP = { '会员套餐':'会员套餐', '服务':'增值包', 'AI服务':'AI套餐' };
var PLAT_MAP = { 'Ozon生态':['Ozon'], '拼多多生态':['拼多多'], '阿里生态':['1688','淘宝','天猫'], '通用':['全平台'] };
var DUR = [ {v:0,l:'年'},{v:1,l:'半年'},{v:2,l:'季度'},{v:3,l:'月'},{v:4,l:'7天'} ];
var STORE_KEY = 'dld_ai_setmeal_v1';

/* ================= 菜单 ================= */
var MENU = [
 {icon:'icon-build',label:'客户服务',children:[['icon-peoples','全部客户'],['icon-peoples','服务中客户'],['icon-peoples','未跟进客户'],['icon-peoples','到期客户'],['icon-documentation','客服小记'],['icon-peoples','黑名单客户'],['icon-peoples','在线会员']]},
 {icon:'icon-user',label:'客户管理'},
 {icon:'icon-excel',label:'订单管理',children:[['icon-dict','全部订单'],['icon-shopping','待支付订单'],['icon-dict','MCP订单']]},
 {icon:'icon-list',label:'优惠券管理',children:[['icon-list','优惠券列表'],['icon-list','优惠券使用']]},
 {icon:'icon-link',label:'代理邀请管理',children:[['icon-link','代理主名单'],['icon-guide','代理邀请注册'],['icon-form','代理邀请下单'],['icon-message','代理邀请提现']]},
 {icon:'icon-user',label:'业务管理',open:true,children:[['icon-education','套餐管理',1],['icon-monitor','店铺管理'],['icon-lock','功能埋点'],['icon-slider','违禁词检测'],['icon-table','用户行为'],['icon-monitor','行业大盘'],['icon-form','竞店分析'],['icon-form','竞品分析'],['icon-chart','监控排名分析'],['icon-chart','1688类目分析'],['icon-chart','监控搜索词'],['icon-chart','跨境类目分析'],['icon-upload','新功能提醒'],['icon-documentation','商品收录']]},
 {icon:'icon-education',label:'运营管理',children:[['icon-education','用户反馈'],['icon-international','友链管理'],['icon-tab','预订单'],['icon-druid','行业资讯'],['icon-monitor','公众号管理'],['icon-button','商业合作'],['icon-international','轮播图管理']]},
 {icon:'icon-education',label:'分词管理',children:[['icon-dict','分词词库'],['icon-dict','单词词库'],['icon-dict','行业类目词库'],['icon-dict','类目属性词库'],['icon-dict','过滤词词库'],['icon-dict','过滤关键词']]}
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

/* ================= 下拉组件 ================= */
var SEL = {};
function initSelect(name, onChange){
  var wrap = document.querySelector('[data-select="'+name+'"]');
  var input = wrap.querySelector('input');
  var ul = wrap.querySelector('ul');
  var s = SEL[name] = { wrap:wrap, input:input, ul:ul, value:'', onChange:onChange||null };
  input.addEventListener('click', function(e){
    e.stopPropagation();
    var isOpen = wrap.classList.contains('open');
    closeAllSelects();
    if(!isOpen) wrap.classList.add('open');
  });
  ul.addEventListener('click', function(e){
    var li = e.target.closest('li');
    if(!li || li.classList.contains('empty')) return;
    s.value = li.getAttribute('data-v') || '';
    input.value = li.textContent.trim();
    ul.querySelectorAll('li').forEach(function(x){ x.classList.remove('selected'); });
    li.classList.add('selected');
    wrap.classList.remove('open');
    if(s.onChange) s.onChange(s.value, li.textContent.trim());
  });
}
function closeAllSelects(){ Object.keys(SEL).forEach(function(k){ SEL[k].wrap.classList.remove('open'); }); }
document.addEventListener('click', closeAllSelects);
function setOptions(name, options, placeholderVal){
  var s = SEL[name];
  s.value = placeholderVal !== undefined ? placeholderVal : s.value;
  if(!options || !options.length){
    s.ul.innerHTML = '<li class="empty">无数据</li>'; return;
  }
  s.ul.innerHTML = options.map(function(o){ return '<li data-v="'+o.v+'">'+o.l+'</li>'; }).join('');
}
function toOpts(arr){ return arr.map(function(x){ return {v:x, l:x}; }); }

/* ================= 数据 ================= */
function now(){
  var d = new Date(), p = function(n){ return (n<10?'0':'')+n; };
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
}
function seed(){
  var r = function(id,eco,biz,sub,platform,trial,name,pri,price,original,duration,ai,created,status,sign,text){
    return {id:id,eco:eco,biz:biz,sub:sub,platform:platform,trial:trial,name:name,priority:pri,price:price,original:original,duration:duration,aiPoints:ai,created:created,status:status,sign:sign,text:text};
  };
  return [
    r(1,'通用','服务','MCP增值包','全平台',0,'注册赠送MCP增购包',3,'0','','','','2026-09-18 15:39:57','已上架','',''),
    r(2,'通用','服务','API增值包','全平台',0,'注册赠送API增购包',1,'0','','','','2026-09-18 15:39:41','已上架','',''),
    r(3,'通用','服务','MCP增值包','全平台',0,'购买赠送MCP增购包',2,'0','','','','2026-09-18 15:40:12','已上架','',''),
    r(4,'阿里生态','会员套餐','年套餐','1688',0,'阿里会员年套餐',5,'399','599','年','','2026-08-01 10:00:00','已上架','限时优惠','包含1688店铺数据分析、竞店监控、关键词排名等全部功能'),
    r(5,'阿里生态','会员套餐','月套餐','1688',0,'阿里会员月套餐',4,'69','99','月','','2026-08-01 10:05:00','已上架','',''),
    r(6,'拼多多生态','会员套餐','年套餐','拼多多',0,'拼多多会员年套餐',5,'299','499','年','','2026-07-12 09:30:00','已上架','热卖','拼多多数据化选品、竞店分析、类目大盘一站式运营工具'),
    r(7,'Ozon生态','会员套餐','季度套餐','Ozon',0,'Ozon会员季度套餐',4,'139','199','季度','','2026-07-01 14:20:00','未上架','',''),
    r(8,'通用','AI服务','AI点数包','全平台',1,'AI体验包',1,'9.9','19.9','月',100000,'2026-10-01 10:00:00','已上架','新功能','适合轻度体验AI功能：AI标题生成、AI详情描述、AI卖点提炼'),
    r(9,'通用','AI服务','AI点数包','全平台',0,'AI标准包',2,'99','199','月',1000000,'2026-10-01 10:02:00','已上架','热卖','适合日常运营：AI选品分析、AI竞品洞察、AI文案批量生成'),
    r(10,'通用','AI服务','AI点数包','全平台',0,'AI旗舰包',3,'499','999','年',10000000,'2026-10-01 10:05:00','未上架','','适合团队协作，畅享全部AI能力'),
    r(11,'通用','服务','API增值包','全平台',0,'API调用增购包（100万次）',1,'0','','','','2026-06-15 11:00:00','已上架','',''),
    r(12,'阿里生态','会员套餐','半年套餐','1688',0,'阿里会员半年套餐',4,'219','329','半年','','2026-05-20 16:40:00','已上架','','')
  ];
}
var list = [];
function load(){
  try{ var raw = localStorage.getItem(STORE_KEY); if(raw){ list = JSON.parse(raw); return; } }catch(e){}
  list = seed(); save();
}
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(list)); }catch(e){} }
function fmtAi(v){
  if(v===''||v===null||v===undefined) return '--';
  v = Number(v);
  if(isNaN(v)) return '--';
  return (v%10000===0 ? (v/10000)+'万积分' : v+'积分');
}
function catOf(rec){ return CAT_MAP[rec.biz] || rec.biz; }

/* ================= 筛选 / 排序 / 分页 ================= */
var PAGE_SIZE = 10, page = 1;
var sortDir = 'desc';
var applied = { eco:'', platform:'', category:'', status:'全部', name:'' };
function filtered(){
  var arr = list.filter(function(r){
    if(applied.eco && r.eco !== applied.eco) return false;
    if(applied.platform && r.platform !== applied.platform) return false;
    if(applied.category && catOf(r) !== applied.category) return false;
    if(applied.status && applied.status !== '全部' && r.status !== applied.status) return false;
    if(applied.name && r.name.indexOf(applied.name) < 0) return false;
    return true;
  });
  arr.sort(function(a,b){
    var cmp = a.created > b.created ? 1 : (a.created < b.created ? -1 : 0);
    return sortDir === 'desc' ? -cmp : cmp;
  });
  return arr;
}
function renderTable(){
  var arr = filtered();
  var pages = Math.max(1, Math.ceil(arr.length / PAGE_SIZE));
  if(page > pages) page = pages;
  var rows = arr.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  var tb = document.getElementById('tableBody');
  if(!rows.length){
    tb.innerHTML = '<tr><td colspan="13" style="padding:40px 0;color:#909399">暂无数据</td></tr>';
  } else {
    tb.innerHTML = rows.map(function(r){
      var ops = '<button class="el-button el-button--text el-button--small" data-act="edit" data-id="'+r.id+'">编辑</button>'
        + '<button class="el-button el-button--text el-button--small" data-act="price" data-id="'+r.id+'">修改</button>'
        + '<button class="el-button el-button--text el-button--small" data-act="toggle" data-id="'+r.id+'">'+(r.status==='已上架'?'下架':'上架')+'</button>';
      var cells = [
        r.eco+'-&gt;'+r.biz+'-&gt;'+r.sub,
        r.trial ? '是' : '否',
        r.name,
        r.priority,
        (r.original===''?'--':r.original),
        (r.price===''?'--':r.price),
        (r.duration===''?'--':r.duration),
        fmtAi(r.aiPoints),
        ' '+r.created+' ',
        ' '+r.status+' ',
        (r.sign===''?'--':r.sign),
        '<span class="clamp2">'+(r.text===''?'--':r.text)+'</span>',
        '<div class="op-btns">'+ops+'</div>'
      ];
      return '<tr>'+cells.map(function(c,i){ var cls = i===11 ? ' class="left"' : (i===7 ? ' class="col-new"' : ''); return '<td'+cls+'><div class="cell">'+c+'</div></td>'; }).join('')+'</tr>';
    }).join('');
  }
  renderPager(arr.length, pages);
}
function renderPager(total, pages){
  var row = document.getElementById('pagerRow');
  var html = '<div class="pager-btn" data-pg="prev">‹</div>';
  var win = [];
  if(pages <= 7){ for(var i=1;i<=pages;i++) win.push(i); }
  else {
    win.push(1);
    var s = Math.max(2, page-2), e = Math.min(pages-1, page+2);
    if(s > 2) win.push('...');
    for(var j=s;j<=e;j++) win.push(j);
    if(e < pages-1) win.push('...');
    win.push(pages);
  }
  win.forEach(function(p){
    html += p==='...' ? '<span class="pager-num" style="cursor:default">...</span>'
      : '<span class="pager-num'+(p===page?' active':'')+'" data-pg="'+p+'">'+p+'</span>';
  });
  html += '<div class="pager-btn" data-pg="next">›</div>'
    + '<span class="total-line ml10" style="font-weight:400"><i>共</i><i>'+total+'</i><i>条</i></span>'
    + '<span class="jump-box"><span class="font12">跳至</span><input class="el-input__inner mini" id="jumpInput"><span class="font12">页</span></span>';
  row.innerHTML = html;
  row.onclick = function(e){
    var t = e.target.closest('[data-pg]');
    if(t){
      var p = t.getAttribute('data-pg');
      if(p==='prev') page = Math.max(1, page-1);
      else if(p==='next') page = Math.min(pages, page+1);
      else page = parseInt(p,10);
      renderTable(); return;
    }
    if(e.target.id === 'jumpInput'){
      e.target.onkeydown = function(ev){
        if(ev.key === 'Enter'){
          var n = parseInt(this.value,10);
          if(!isNaN(n)) page = Math.min(pages, Math.max(1,n));
          renderTable();
        }
      };
    }
  };
}
function doSearch(){
  applied.eco = SEL.fEco.value;
  applied.platform = SEL.fPlatform.value;
  applied.category = SEL.fCategory.value;
  applied.status = SEL.fStatus.value || '全部';
  applied.name = document.getElementById('fName').value.trim();
  page = 1; renderTable();
}

/* ================= 单选组 / 开关 ================= */
function radioGroup(container, options, checkedIdx, onChange){
  container.innerHTML = options.map(function(o,i){
    return '<span class="el-radio'+(i===(checkedIdx||0)?' checked':'')+'" data-i="'+i+'"><span class="r-inner"></span><span class="r-label">'+o.l+'</span></span>';
  }).join('');
  container.onclick = function(e){
    var r = e.target.closest('.el-radio');
    if(!r) return;
    container.querySelectorAll('.el-radio').forEach(function(x){ x.classList.remove('checked'); });
    r.classList.add('checked');
    if(onChange) onChange(options[+r.getAttribute('data-i')]);
  };
}
function radioValue(container, options){
  var el = container.querySelector('.el-radio.checked');
  return el ? options[+el.getAttribute('data-i')] : null;
}
function radioSet(container, idx){
  container.querySelectorAll('.el-radio').forEach(function(x,i){ x.classList.toggle('checked', i===idx); });
}

/* ================= 弹窗：创建/编辑 ================= */
var form = { editingId:null, eco:'', biz:'', sub:'', gift:'', trial:false };
var D = {
  title: document.getElementById('dlgTitle'),
  dlg: document.getElementById('dlgSetMeal'),
  name: document.getElementById('fNameInput'),
  price: document.getElementById('fPrice'),
  original: document.getElementById('fOriginal'),
  customDays: document.getElementById('fCustomDays'),
  sign: document.getElementById('fSign'),
  text: document.getElementById('fText'),
  aiPts: document.getElementById('fAiPoints'),
  trial: document.getElementById('fTrial')
};
var fPriority = document.getElementById('fPriority');
var fDuration = document.getElementById('fDuration');
radioGroup(fPriority, [0,1,2,3,4,5].map(function(n){ return {v:n,l:n}; }), 0, updatePreview);
radioGroup(fDuration, DUR, 0, function(){ D.customDays.value=''; updatePreview(); });
D.trial.addEventListener('click', function(){ form.trial = !form.trial; D.trial.classList.toggle('on', form.trial); });
['fNameInput','fPrice','fOriginal','fCustomDays','fAiPoints','fSign','fText'].forEach(function(id){
  document.getElementById(id).addEventListener('input', updatePreview);
});
document.getElementById('fCustomDays').addEventListener('input', function(){ updatePreview(); });

function durLabel(){
  var c = D.customDays.value.trim();
  if(c !== '' && !isNaN(+c) && +c > 0) return c+'天';
  var r = radioValue(fDuration, DUR);
  return r ? r.l : '';
}
function aiPoints(){
  var c = D.aiPts.value.trim();
  if(isAi() && c !== '' && !isNaN(+c) && +c > 0) return +c;
  return '';
}
function isAi(){ return form.sub === 'AI点数包'; }
function updatePreview(){
  var pvT = document.getElementById('pvTitle');
  var pvP = document.getElementById('pvPrice');
  var pvO = document.getElementById('pvOriginal');
  var pvD = document.getElementById('pvDur');
  var pvS = document.getElementById('pvSign');
  var pvA = document.getElementById('pvAi');
  var pvC = document.getElementById('pvContent');
  pvT.textContent = D.name.value.trim() || '套餐名称';
  pvP.textContent = D.price.value.trim() === '' ? '0' : D.price.value.trim();
  pvO.textContent = D.original.value.trim() === '' ? '' : '原价 '+D.original.value.trim();
  pvO.style.display = D.original.value.trim()==='' ? 'none':'block';
  pvD.textContent = durLabel() || '年';
  if(D.sign.value.trim()){ pvS.textContent = D.sign.value.trim(); pvS.classList.add('show'); } else pvS.classList.remove('show');
  var ai = aiPoints();
  if(isAi() && ai !== ''){ pvA.textContent = 'AI积分 '+fmtAi(ai); pvA.classList.add('show'); } else pvA.classList.remove('show');
  pvC.textContent = D.text.value.trim();
}
function openDialog(rec){
  form.editingId = rec ? rec.id : null;
  form.trial = rec ? !!rec.trial : false;
  D.name.value = rec ? rec.name : '';
  D.price.value = rec ? rec.price : '';
  D.original.value = rec ? rec.original : '';
  D.customDays.value = '';
  D.sign.value = rec ? rec.sign : '';
  D.text.value = rec ? rec.text : '';
  D.trial.classList.toggle('on', form.trial);
  radioSet(fPriority, rec ? Math.min(5, rec.priority||0) : 0);
  var durIdx = rec ? DUR.map(function(d){return d.l;}).indexOf(rec.duration) : 0;
  if(rec && rec.duration && /^\d+天$/.test(rec.duration)){ D.customDays.value = rec.duration.replace('天',''); radioSet(fDuration, -1); }
  else { radioSet(fDuration, Math.max(0, durIdx)); }
  D.aiPts.value = (rec && rec.aiPoints) ? String(rec.aiPoints) : '';
  // 类型三级联动
  var eco = rec ? rec.eco : '', biz = rec ? rec.biz : '', sub = rec ? rec.sub : '';
  setOptions('dEco', toOpts(ECO));
  SEL.dEco.value = eco; SEL.dEco.input.value = eco || '';
  markSelected('dEco');
  setOptions('dBiz', toOpts(BIZ));
  SEL.dBiz.value = biz; SEL.dBiz.input.value = biz || '';
  markSelected('dBiz');
  setOptions('dSub', toOpts(biz ? SUB_MAP[biz] : []));
  SEL.dSub.value = sub; SEL.dSub.input.value = sub || '';
  markSelected('dSub');
  setOptions('dGift', toOpts(['无'].concat(ECO)));
  SEL.dGift.value = rec && rec.gift ? rec.gift : '无';
  SEL.dGift.input.value = SEL.dGift.value;
  markSelected('dGift');
  form.eco=eco; form.biz=biz; form.sub=sub; form.gift=SEL.dGift.value;
  D.title.textContent = (rec?'编辑套餐':'创建套餐') + '（套餐在用户侧展示顺序按优先级低到高，同级按先创建先展示）';
  document.getElementById('btnSubmitUp').textContent = rec ? '保存并上架' : '创建并上架';
  document.getElementById('btnSubmitSave').textContent = rec ? '保存不上架' : '保存不上架';
  updatePreview();
  D.dlg.classList.add('show');
}
function markSelected(name){
  var s = SEL[name];
  s.ul.querySelectorAll('li').forEach(function(li){ li.classList.toggle('selected', li.getAttribute('data-v')===s.value); });
}
function closeDialog(id){ document.getElementById(id).classList.remove('show'); }
function validate(){
  if(!form.eco || !form.biz || !form.sub){ toast('请选择完整的套餐类型','error'); return false; }
  if(!D.name.value.trim()){ toast('请输入套餐名称','error'); return false; }
  if(isAi() && aiPoints()===''){ toast('请输入AI积分','error'); return false; }
  return true;
}
function buildRecord(status, rec){
  rec = rec || { id: list.length ? Math.max.apply(null, list.map(function(x){return x.id;}))+1 : 1, created: now() };
  rec.eco=form.eco; rec.biz=form.biz; rec.sub=form.sub;
  rec.platform = (PLAT_MAP[form.eco]||['全平台'])[0];
  rec.trial = form.trial;
  rec.name = D.name.value.trim();
  rec.priority = radioValue(fPriority, [0,1,2,3,4,5].map(function(n){ return {v:n,l:n}; })).v;
  rec.original = D.original.value.trim();
  rec.price = D.price.value.trim();
  rec.duration = durLabel();
  rec.aiPoints = aiPoints();
  rec.status = status;
  rec.sign = D.sign.value.trim();
  rec.text = D.text.value.trim();
  rec.gift = form.gift === '无' ? '' : form.gift;
  return rec;
}
document.getElementById('btnSubmitUp').addEventListener('click', function(){
  if(!validate()) return;
  var up = true, rec;
  if(form.editingId){
    rec = buildRecord('已上架', list.find(function(x){ return x.id===form.editingId; }));
    toast('保存并上架成功');
  } else {
    rec = buildRecord('已上架');
    list.unshift(rec);
    toast('创建并上架成功');
  }
  save(); closeDialog('dlgSetMeal'); renderTable();
});
document.getElementById('btnSubmitSave').addEventListener('click', function(){
  if(!validate()) return;
  if(form.editingId){
    buildRecord('未上架', list.find(function(x){ return x.id===form.editingId; }));
    toast('保存成功（未上架）');
  } else {
    list.unshift(buildRecord('未上架'));
    toast('保存成功（未上架）');
  }
  save(); closeDialog('dlgSetMeal'); renderTable();
});


/* ================= 表格操作 ================= */
document.getElementById('tableBody').addEventListener('click', function(e){
  var b = e.target.closest('button[data-act]');
  if(!b) return;
  var id = +b.getAttribute('data-id');
  var rec = list.find(function(x){ return x.id===id; });
  if(!rec) return;
  var act = b.getAttribute('data-act');
  if(act==='edit') openDialog(rec);
  else if(act==='price'){ openDialog(rec); }
  else if(act==='toggle'){
    rec.status = rec.status==='已上架' ? '未上架' : '已上架';
    save(); toast(rec.status==='已上架'?'已上架':'已下架'); renderTable();
  }
});

/* ================= 排序 ================= */
document.getElementById('thCreated').addEventListener('click', function(){
  sortDir = sortDir==='desc' ? 'asc' : 'desc';
  this.classList.toggle('sort-desc', sortDir==='desc');
  this.classList.toggle('sort-asc', sortDir==='asc');
  renderTable();
});

/* ================= 初始化 ================= */
renderMenu();
initSelect('fEco', function(v){
  setOptions('fPlatform', v ? toOpts(PLAT_MAP[v]||[]) : []);
  SEL.fPlatform.value=''; SEL.fPlatform.input.value='';
});
initSelect('fPlatform');
initSelect('fCategory');
initSelect('fStatus');
initSelect('dEco', function(v){
  form.eco=v;
  setOptions('dBiz', toOpts(BIZ)); SEL.dBiz.value=''; SEL.dBiz.input.value=''; markSelected('dBiz');
  setOptions('dSub', []); SEL.dSub.value=''; SEL.dSub.input.value='';
  form.biz=''; form.sub=''; updatePreview();
});
initSelect('dBiz', function(v){
  form.biz=v;
  setOptions('dSub', toOpts(SUB_MAP[v]||[])); SEL.dSub.value=''; SEL.dSub.input.value='';
  form.sub=''; updatePreview();
});
initSelect('dSub', function(v){
  form.sub=v;
  updatePreview();
});
initSelect('dGift', function(v){ form.gift=v; });

setOptions('fEco', toOpts(ECO));
setOptions('fPlatform', []);
setOptions('fCategory', toOpts(['会员套餐','增值包','AI套餐']));
setOptions('fStatus', toOpts(['全部','未上架','已上架']));
SEL.fStatus.value='全部'; SEL.fStatus.input.value='全部'; markSelected('fStatus');

document.getElementById('btnSearch').addEventListener('click', doSearch);
document.getElementById('fName').addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });
document.getElementById('btnCreate').addEventListener('click', function(){ openDialog(null); });
document.getElementById('btnPosition').addEventListener('click', function(){ toast('原型演示：设置套餐位置功能不在本次迭代范围','info'); });
document.getElementById('btnImgPlugin').addEventListener('click', function(){ toast('原型演示：图搜插件功能不在本次迭代范围','info'); });
document.querySelectorAll('[data-close]').forEach(function(b){
  b.addEventListener('click', function(){ closeDialog(b.getAttribute('data-close')); });
});
document.getElementById('hamburger').addEventListener('click', function(){
  document.getElementById('app').classList.toggle('collapsed');
});
document.querySelectorAll('.el-dialog__wrapper').forEach(function(w){
  w.addEventListener('click', function(e){ if(e.target === w) w.classList.remove('show'); });
});

load();
renderTable();

/* ================= toast ================= */
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
