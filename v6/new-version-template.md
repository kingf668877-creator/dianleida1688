# 新版本创建指南

## 一、目录结构

```
v6/
├── dev-mode.html          # 导航主入口（所有版本共用）
├── logo.png               # Logo（所有版本共用）
├── v2.9.0/                # V2.9.0 版本目录
│   ├── search-agent.html
│   ├── ai-output-interaction-viewer.html
│   ├── prototype-spec.html
│   ├── backend-json-mapping-viewer.html
│   ├── backend-json-mapping.md
│   └── ...
├── v2.8.9/                # V2.8.9 版本目录（后续迁移）
│   └── ...
└── new-version-template.md # 本文件
```

## 二、新建版本步骤（以 V2.10.0 为例）

### 步骤 1：复制版本目录

复制最新版本目录为新版本：

```bash
# 以最新版本为模板，复制到新版本目录
cp -r v2.9.0/ v2.10.0/
```

### 步骤 2：在 dev-mode.html 中添加新版本导航

在 `dev-mode.html` 的 `<nav class="layer-list">` 中，在最前面添加新版本分组：

```html
<!-- V2.10.0 版本（最新版本，默认展开） -->
<div class="version-folder open" data-version="v2.10.0">
  <span class="folder-arrow">▶</span>
  <span>V2.10.0</span>
  <span class="version-badge">最新</span>
</div>
<div class="version-pages open" data-version="v2.10.0">
  <button class="layer-item" data-page="v2.10.0/search-agent.html" data-search="V2.10.0 搜索智能体 ..."><span class="layer-icon icon-p">P</span>搜索智能体</button>
  <button class="layer-item" data-page="v2.10.0/ai-output-interaction-viewer.html" data-search="V2.10.0 AI输出结果交互 ..."><span class="layer-icon icon-p" style="background:#7c4dff;">AI</span>AI输出结果交互</button>
  <button class="layer-item" data-page="v2.10.0/prototype-spec.html" data-search="V2.10.0 原型说明 ..."><span class="layer-icon icon-p" style="background:#f59e0b;">P</span>原型说明</button>
  <button class="layer-item" data-page="v2.10.0/backend-json-mapping-viewer.html" data-search="V2.10.0 后端对接文档 ..."><span class="layer-icon icon-p" style="background:#10b981;">MD</span>后端对接文档</button>
</div>
```

**注意事项：**
- 新版本放在最前面（列表顶部）
- 给新版本加上 `open` 类（默认展开）
- 给新版本加上 `<span class="version-badge">最新</span>` 标签
- 旧版本的「最新」标签要去掉
- 旧版本的 `open` 类要去掉（默认收起）
- `data-page` 路径改成新版本目录
- `data-search` 中的版本号改成新版本号

### 步骤 3：修改默认打开页面

修改 iframe 的默认 src，指向新版本的搜索智能体：

```html
<iframe id="designFrame" src="v2.10.0/search-agent.html" title="设计页面预览"></iframe>
```

### 步骤 4：修改搜索逻辑中的默认版本

在 JavaScript 的搜索逻辑中，把默认展开的版本号改成新版本：

```javascript
// 找到这段代码，把 'v2.9.0' 改成 'v2.10.0'
if (version === 'v2.10.0') {
  folder.classList.add('open');
  pages.classList.add('open');
}
```

### 步骤 5：更新新版本内容

根据新版本的需求，修改对应页面的内容：

- **search-agent.html** — 搜索智能体页面
- **ai-output-interaction-viewer.html** — AI 输出结果交互
- **prototype-spec.html** — 原型说明（修改 iframe 链接）
- **backend-json-mapping.md** — 后端对接文档内容

## 三、标准页面清单

每个版本包含以下 4 个标准页面：

| 页面 | 文件名 | 说明 |
|------|--------|------|
| 搜索智能体 | `search-agent.html` | 搜索页 + AI 三步动画 |
| AI输出结果交互 | `ai-output-interaction-viewer.html` | AI 结果展示页 |
| 原型说明 | `prototype-spec.html` | Axure 原型嵌入页 |
| 后端对接文档 | `backend-json-mapping-viewer.html` | MD 文档查看/编辑/发布 |

## 四、部署

```bash
git add v2.10.0/ dev-mode.html
git commit -m "feat: add V2.10.0 version"
git push origin master
```
