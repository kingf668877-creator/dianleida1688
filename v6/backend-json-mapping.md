# 扣子智能体调用方案（后端对接文档）

## 一、基本信息

| 项 | 值 |
|----|----|
| 接口地址 | `https://api.coze.cn/v3/chat` |
| 请求方式 | `POST` |
| 认证方式 | Bearer Token |
| 响应格式 | SSE 流式（text/event-stream） |
| 智能体ID（bot_id） | `7660723428240588815` |
| API Token | `sat_M2oVUcRcmShLQVJuvMdLm7K7DSxC9KvvuZI8Yj9eqt4uSvelfMmeMsYSGqveGK1m` |
| 超时建议 | 60秒 |

## 二、请求参数

### 请求头

```
Content-Type: application/json
Authorization: Bearer sat_M2oVUcRcmShLQVJuvMdLm7K7DSxC9KvvuZI8Yj9eqt4uSvelfMmeMsYSGqveGK1m
Accept: text/event-stream
```

### 请求体

```json
{
  "bot_id": "7660723428240588815",
  "user_id": "dianleida_backend_xxx",
  "stream": true,
  "auto_save_history": true,
  "additional_messages": [
    {
      "role": "user",
      "content": "透明化妆包pvc",
      "content_type": "text"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `bot_id` | string | 是 | 智能体ID，固定值 `7660723428240588815` |
| `user_id` | string | 是 | 用户标识，后端自己生成，用于会话区分 |
| `stream` | boolean | 是 | 固定 `true`，启用流式响应 |
| `auto_save_history` | boolean | 是 | 固定 `true`，自动保存历史 |
| `additional_messages[0].content` | string | 是 | 用户搜索关键词，即要分析的词 |

## 三、响应解析

### SSE 事件类型

响应是 SSE 流式格式，主要关注以下事件：

| 事件 | 说明 |
|------|------|
| `conversation.message.delta` | 流式消息增量，**主要用这个**，从里面提取 answer 类型的内容 |
| `conversation.message.completed` | 单条消息完成 |
| `conversation.chat.completed` | 整个对话完成 |
| `conversation.chat.failed` | 对话失败 |

### 事件数据结构（conversation.message.delta）

```json
{
  "id": "msg_xxx",
  "type": "answer",
  "content": "{",
  "content_type": "text"
}
```

**关键字段**：`type === "answer"` 的事件，其 `content` 是 JSON 的片段，需要累积拼接。

### 解析步骤

1. 建立 SSE 连接，持续接收事件
2. 只收集 `conversation.message.delta` 事件中 `type === "answer"` 的 `content`，逐段拼接成完整字符串
3. 当收到 `conversation.chat.completed` 事件，或拼接出的字符串包含完整 JSON 时，解析 JSON
4. JSON 解析失败时，用**括号匹配法**提取第一个完整的 `{...}` 对象再解析

### 括号匹配提取法（容错用）

如果智能体返回的内容前后有多余文字，用深度计数法提取第一个完整 JSON：

```
遍历字符串：
  遇到 '{'  → depth++，depth从0变1时记录 start
  遇到 '}'  → depth--，depth从1变0时记录 end，结束遍历
  截取 [start, end+1] 就是完整的 JSON 对象
```

## 四、返回的 JSON 结构

智能体最终输出的 JSON 包含以下字段：

```json
{
  "categoryName": "化妆包",
  "categoryId": "1226749003",
  "coreProduct": "化妆包",
  "modifiers": {
    "style": [],
    "material": ["PVC"],
    "crowd": [],
    "scene": ["旅行", "洗漱"],
    "other": ["透明", "防水"]
  },
  "requiredKeywords": ["化妆包"],
  "expandedKeywords": ["PVC化妆包", "透明化妆包", "旅行洗漱包"],
  "excludedKeywords": ["笔袋", "文具盒", "材料包"],
  "categoryTree": [
    { "category_name": "化妆包", "category_id": "1226749003" }
  ]
}
```

### 字段用途

| 字段 | 用途 |
|------|------|
| `categoryName` | 匹配的类目名称 |
| `categoryId` | 匹配的类目ID |
| `coreProduct` | 核心产品词 |
| `modifiers` | 修饰词（风格/材质/人群/场景/其他） |
| `requiredKeywords` | 必含词，商品标题必须包含 |
| `expandedKeywords` | 扩展词，用于扩大搜索召回 |
| `excludedKeywords` | 排除词，用于过滤无关商品 |
| `categoryTree` | 插件返回的完整类目数组（备用） |

## 五、调用流程

```text
用户搜索关键词
    ↓
后端调用扣子智能体 API
    ↓
SSE 流式接收，累积 answer 内容
    ↓
解析出 JSON 结果
    ↓
用扩展词调用店雷达商品搜索接口
    ↓
用必含词 + 排除词 + 类目名过滤商品
    ↓
返回给前端
```

## 六、注意事项

1. **Token 安全**：API Token 不要暴露在前端，必须由后端调用
2. **超时设置**：建议设置 60 秒超时，智能体需要调用插件，整体耗时 5~15 秒左右
3. **错误重试**：调用失败可重试 1 次，不要无限重试
4. **搜索词数量**：`expandedKeywords` 取前 2 个参与主搜索即可，拼太多店雷达会返回 400
5. **类目匹配**：`category_id` 不能直接用于店雷达搜索过滤，需要用 `category_name` 匹配商品的 `levelName` 字段
6. **单字必含词**：如果 `requiredKeywords` 里有单字词如"包"，要注意排除"一包""包邮"等量词/动词用法

## 七、Python 调用示例

```python
import requests
import json

def call_coze_agent(keyword: str) -> dict:
    url = "https://api.coze.cn/v3/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer sat_M2oVUcRcmShLQVJuvMdLm7K7DSxC9KvvuZI8Yj9eqt4uSvelfMmeMsYSGqveGK1m",
        "Accept": "text/event-stream",
    }
    body = {
        "bot_id": "7660723428240588815",
        "user_id": "dianleida_backend",
        "stream": True,
        "auto_save_history": True,
        "additional_messages": [
            {"role": "user", "content": keyword, "content_type": "text"}
        ],
    }

    answer_content = ""
    with requests.post(url, headers=headers, json=body, stream=True, timeout=60) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("event:"):
                event_type = line[6:].strip()
                continue
            if line.startswith("data:"):
                data_str = line[5:].strip()
                if not data_str or data_str == "[DONE]":
                    continue
                try:
                    data = json.loads(data_str)
                except:
                    continue
                if event_type == "conversation.message.delta":
                    if data.get("type") == "answer":
                        answer_content += data.get("content", "")
                elif event_type == "conversation.chat.failed":
                    raise Exception(data.get("last_error", {}).get("msg", "调用失败"))
                elif event_type == "conversation.chat.completed":
                    break

    # 尝试解析 JSON
    try:
        return json.loads(answer_content)
    except:
        # 括号匹配法提取第一个完整 JSON
        depth = 0
        start = -1
        for i, ch in enumerate(answer_content):
            if ch == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start >= 0:
                    return json.loads(answer_content[start:i+1])
        raise Exception("无法解析智能体返回结果")

# 调用示例
result = call_coze_agent("透明化妆包pvc")
print(result)
```

## 八、Node.js 调用示例

```javascript
async function callCozeAgent(keyword) {
  const response = await fetch('https://api.coze.cn/v3/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sat_M2oVUcRcmShLQVJuvMdLm7K7DSxC9KvvuZI8Yj9eqt4uSvelfMmeMsYSGqveGK1m',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      bot_id: '7660723428240588815',
      user_id: 'dianleida_backend',
      stream: true,
      auto_save_history: true,
      additional_messages: [
        { role: 'user', content: keyword, content_type: 'text' }
      ]
    })
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let answerContent = '';
  let eventType = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('event:')) {
        eventType = trimmed.substring(6).trim();
      } else if (trimmed.startsWith('data:')) {
        const dataStr = trimmed.substring(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          if (eventType === 'conversation.message.delta' && data.type === 'answer') {
            answerContent += data.content || '';
          } else if (eventType === 'conversation.chat.failed') {
            throw new Error(data.last_error?.msg || '调用失败');
          } else if (eventType === 'conversation.chat.completed') {
            return parseJSON(answerContent);
          }
        } catch (e) {
          // skip
        }
      }
    }
  }

  return parseJSON(answerContent);
}

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    let depth = 0, start = -1;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') { if (depth === 0) start = i; depth++; }
      else if (str[i] === '}') {
        depth--;
        if (depth === 0 && start >= 0) return JSON.parse(str.substring(start, i + 1));
      }
    }
    throw new Error('无法解析智能体返回结果');
  }
}
```
