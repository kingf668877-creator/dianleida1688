# 扣子智能体调用方案（后端对接文档）

> 版本：V3.0（双智能体并行架构）
> 更新时间：2026-07-21

## 一、基本信息

### 接口信息

| 项 | 值 |
|----|----|
| 接口地址 | `https://api.coze.cn/v3/chat` |
| 请求方式 | `POST` |
| 认证方式 | Bearer Token |
| 响应格式 | SSE 流式（text/event-stream） |
| 超时建议 | 90 秒 |

### 智能体列表

| 智能体名称 | Bot ID | API Token | 用途 | 是否需要流式 |
|-----------|--------|-----------|------|-------------|
| 1688类目智能体 | `7660723428240588815` | `sat_PlUdFXma7wnCH84SsUNGJzRDBE39CLxOG1Dv7KLqjz6uyi4077qxbAwTiOI71PGm` | 只获取商品类目数据 | 否（拿最终结果即可） |
| 1688关键词智能体 | `7664543077167808527` | `sat_4R0kwl9V9vA4d1MaroUhGHNySizh17LvG2Z0gpiSyHgvtqzs1PNbRZCm8xOvZXaS` | 只做搜索词分析（含分析过程） | 是（实时展示分析过程） |

### 推荐架构：双智能体并行

```
用户搜索关键词
    ↓
后端同时发起两个请求（并行）
    ├─→ 类目智能体（同步拿结果）  ──→ 类目JSON
    └─→ 关键词智能体（SSE流式）   ──→ 分析过程文字流 + 关键词JSON
    ↓
合并结果 → 返回给前端
```

**为什么并行？**
- 类目智能体要调插件，慢（10~30秒）
- 关键词智能体纯文本生成，快（5~15秒）
- 并行后总耗时 = 慢的那个，而不是两个相加
- 关键词的分析过程可以实时推给前端，用户等待时有反馈

---

## 二、请求参数

### 请求头

```
Content-Type: application/json
Authorization: Bearer <对应智能体的Token>
Accept: text/event-stream
```

### 请求体

```json
{
  "bot_id": "7664543077167808527",
  "user_id": "dianleida_backend_xxx",
  "stream": true,
  "auto_save_history": false,
  "additional_messages": [
    {
      "role": "user",
      "content": "跨境女装",
      "content_type": "text"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `bot_id` | string | 是 | 智能体ID，类目用 `7660723428240588815`，关键词用 `7664543077167808527` |
| `user_id` | string | 是 | 用户标识，后端自己生成，用于会话区分 |
| `stream` | boolean | 是 | 关键词智能体固定 `true`，类目智能体可设 `false` |
| `auto_save_history` | boolean | 建议 | 建议 `false`，避免历史记录污染 |
| `additional_messages[0].content` | string | 是 | 用户搜索关键词，即要分析的词 |

---

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
  "content": "分析用户输入...",
  "content_type": "text"
}
```

**关键字段**：`type === "answer"` 的事件，其 `content` 是增量内容，需要累积拼接。

### 解析步骤

1. 建立 SSE 连接，持续接收事件
2. 只收集 `conversation.message.delta` 事件中 `type === "answer"` 的 `content`，逐段拼接
3. 关键词智能体：每收到一段就实时推给前端（用于展示分析过程）
4. 当收到 `conversation.chat.completed` 事件，或拼接内容包含完整 JSON 时，提取 JSON
5. JSON 提取用**括号匹配法**，因为关键词智能体输出前面有分析过程文字

### 括号匹配提取法（必用）

两个智能体的输出都可能包含分析过程文字，不能直接 `JSON.parse`，必须用深度计数法提取第一个完整 JSON：

```
遍历字符串：
  遇到 '{'  → depth++，depth从0变1时记录 start
  遇到 '}'  → depth--，depth从1变0时记录 end，结束遍历
  截取 [start, end+1] 就是完整的 JSON 对象
```

---

## 四、返回的 JSON 结构

### 4.1 类目智能体输出

```json
{
  "category": {
    "mainCategory": "女装",
    "subCategory": "连衣裙",
    "categoryId": "123456789",
    "categoryKeywords": ["女装", "连衣裙", "半身裙"],
    "levelNames": ["女装>连衣裙>"]
  },
  "categoryTree": [
    { "category_name": "女装", "category_id": "123" },
    { "category_name": "连衣裙", "category_id": "456" }
  ]
}
```

| 字段 | 用途 |
|------|------|
| `category.mainCategory` | 一级类目名称 |
| `category.subCategory` | 二级类目名称 |
| `category.categoryId` | 主推类目ID |
| `category.categoryKeywords` | 所有相关类目名称数组 |
| `category.levelNames` | 类目层级路径数组 |
| `categoryTree` | 完整类目树数组，**用里面的 category_id 传给店雷达 API 的 categoryIdList** |

### 4.2 关键词智能体输出

前面是分析过程文字（用于流式展示），最后输出 JSON：

```json
{
  "coreProduct": "女装",
  "modifiers": {
    "style": [],
    "material": [],
    "crowd": ["女"],
    "scene": ["跨境"]
  },
  "expandedKeywords": ["跨境女装批发", "外贸女装", "欧美跨境女装", "大码跨境女装", "快时尚女装"],
  "excludedKeywords": ["男装", "童装", "女鞋", "女包", "纽扣", "衣架"],
  "requiredKeywords": ["女装", "跨境"]
}
```

| 字段 | 用途 |
|------|------|
| `coreProduct` | 核心产品词 |
| `modifiers.style` | 款式/外观/规格修饰词 |
| `modifiers.material` | 材质修饰词 |
| `modifiers.crowd` | 人群修饰词 |
| `modifiers.scene` | 场景/平台修饰词 |
| `expandedKeywords` | 扩展词，3~6个，用于扩大搜索召回 |
| `excludedKeywords` | 排除词，3~12个，用于过滤无关商品 |
| `requiredKeywords` | 必含词，1~3个，确保搜索结果不跑偏 |

### 4.3 合并后的完整结果（给前端用）

后端把两个智能体的结果合并成一个 JSON 返回给前端：

```json
{
  "category": {
    "mainCategory": "女装",
    "subCategory": "连衣裙",
    "categoryId": "123456789",
    "categoryKeywords": ["女装", "连衣裙", "半身裙"],
    "levelNames": ["女装>连衣裙>"]
  },
  "categoryTree": [
    { "category_name": "女装", "category_id": "123" },
    { "category_name": "连衣裙", "category_id": "456" }
  ],
  "coreProduct": "女装",
  "modifiers": {
    "style": [],
    "material": [],
    "crowd": ["女"],
    "scene": ["跨境"]
  },
  "expandedKeywords": ["跨境女装批发", "外贸女装", "欧美跨境女装", "大码跨境女装", "快时尚女装"],
  "excludedKeywords": ["男装", "童装", "女鞋", "女包", "纽扣", "衣架"],
  "requiredKeywords": ["女装", "跨境"]
}
```

**合并规则**：
- 类目智能体的 `category` 和 `categoryTree` 直接用
- 关键词智能体的其他字段（coreProduct、modifiers、expandedKeywords 等）直接用
- 如果某个智能体失败，用另一个的结果兜底，失败的字段填空或空数组

---

## 五、后端 SSE 转发方案（推荐）

### 后端接口设计

**接口**：`GET /api/ai/analyze?keyword=跨境女装`

**响应**：SSE 流式（text/event-stream）

**事件类型**：

| 事件名 | 触发时机 | 数据内容 |
|--------|---------|---------|
| `delta` | 关键词智能体每输出一段文字 | 增量文本（分析过程） |
| `keyword_done` | 关键词智能体完成，JSON已提取 | 关键词 JSON |
| `category_done` | 类目智能体完成，JSON已提取 | 类目 JSON |
| `done` | 两个智能体都完成，合并完毕 | 完整合并后的 JSON |
| `error` | 出错 | 错误信息 |

### 时序图

```
前端                    后端                    类目智能体            关键词智能体
  │                       │                          │                      │
  │── GET /api/ai/analyze ──→                       │                      │
  │                       │── POST 类目请求 ────────→│                      │
  │                       │── POST 关键词请求(SSE) ───────────────────────→│
  │                       │                          │                      │
  │←──── event: delta ────│←──── SSE 流式输出 ────────────────────────────│
  │←──── event: delta ────│←──── SSE 流式输出 ────────────────────────────│
  │                       │                          │                      │
  │                       │←── 类目JSON 返回 ────────│                      │
  │←─ event: category_done│                          │                      │
  │                       │                          │                      │
  │                       │←── 关键词完成 ─────────────────────────────────│
  │←─ event: keyword_done │                          │                      │
  │←─ event: done ────────│（合并后返回）            │                      │
  │                       │                          │                      │
```

---

## 六、搜索流程

```
用户输入搜索词
    ↓
后端并行调用两个智能体
    ├─ 类目智能体 → 提取 categoryIdList → 传给店雷达 API
    └─ 关键词智能体 → 提取 expandedKeywords / excludedKeywords / requiredKeywords
    ↓
第一步：类目服务端过滤
   用 categoryIdList（逗号分隔，最多20个）传给店雷达 API 的 categoryIdList 参数
   API 服务端先把商品范围锁死在这些类目里
    ↓
第二步：关键词搜索
   第一轮：主关键词 + 类目ID（最精准）
   第二轮：前 2 个扩展词分别 + 类目ID，逐个补充搜索
   每个扩展词在同一类目下做词组搜索
    ↓
第三步：客户端过滤
   用 excludedKeywords 过滤掉配件、材料等不相关商品
   用 requiredKeywords 确保核心词存在
   用类目精确匹配做二次校验
    ↓
返回商品列表给前端
```

### 兜底策略

- 如果结果 < 10 条：放宽到类目热词 + 宽松类目过滤
- 如果还是不够：完全放开类目，只用一级类目前缀 + 排除词兜底

---

## 七、注意事项

1. **Token 安全**：两个智能体的 API Token 都不要暴露在前端，必须由后端调用
2. **并行调用**：一定要并行，不要串行，总耗时取决于慢的那个（类目智能体）
3. **超时设置**：建议设置 90 秒超时，类目智能体调插件可能比较慢
4. **错误重试**：调用失败可重试 1 次，不要无限重试
5. **扩展词数量**：`expandedKeywords` 取前 2 个参与扩展搜索即可，太多会慢
6. **类目ID数量**：`categoryIdList` 最多传 20 个（店雷达 API 限制），超出取前 20 个
7. **JSON 提取**：两个智能体的输出都不能直接 JSON.parse，必须用括号匹配法提取
8. **分析过程流式转发**：关键词智能体的 delta 要实时推给前端，不要等全部完成
9. **历史记录**：`auto_save_history` 建议设为 `false`，避免上下文污染
10. **类目展示**：前端展示类目时，只展示最后一级叶子类目，不要展示整棵树

---

## 八、Java 调用示例（Spring Boot）

```java
package com.dianleida.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiAnalysisController {

    private static final String COZE_API_URL = "https://api.coze.cn/v3/chat";
    private static final String CATEGORY_BOT_ID = "7660723428240588815";
    private static final String CATEGORY_TOKEN = "sat_PlUdFXma7wnCH84SsUNGJzRDBE39CLxOG1Dv7KLqjz6uyi4077qxbAwTiOI71PGm";
    private static final String KEYWORD_BOT_ID = "7664543077167808527";
    private static final String KEYWORD_TOKEN = "sat_4R0kwl9V9vA4d1MaroUhGHNySizh17LvG2Z0gpiSyHgvtqzs1PNbRZCm8xOvZXaS";

    private final ExecutorService executor = Executors.newCachedThreadPool();

    /**
     * 双智能体并行流式分析接口
     */
    @GetMapping(value = "/analyze", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyze(@RequestParam String keyword) {
        SseEmitter emitter = new SseEmitter(90000L);

        executor.execute(() -> {
            try {
                // 并行调用两个智能体
                CompletableFuture<String> categoryFuture = CompletableFuture.supplyAsync(() -> {
                    try {
                        return callCozeSync(CATEGORY_BOT_ID, CATEGORY_TOKEN, keyword);
                    } catch (Exception e) {
                        return null;
                    }
                }, executor);

                CompletableFuture<String> keywordFuture = CompletableFuture.supplyAsync(() -> {
                    try {
                        StringBuilder fullText = new StringBuilder();
                        callCozeStream(KEYWORD_BOT_ID, KEYWORD_TOKEN, keyword, delta -> {
                            try {
                                fullText.append(delta);
                                emitter.send(SseEmitter.event().name("delta").data(delta));
                            } catch (Exception e) {
                                throw new RuntimeException(e);
                            }
                        });
                        return fullText.toString();
                    } catch (Exception e) {
                        return null;
                    }
                }, executor);

                // 等两个都完成
                CompletableFuture.allOf(categoryFuture, keywordFuture).join();

                String categoryText = categoryFuture.get();
                String keywordText = keywordFuture.get();

                // 提取 JSON
                String categoryJson = categoryText != null ? extractJson(categoryText) : null;
                String keywordJson = keywordText != null ? extractJson(keywordText) : null;

                // 分别推送
                if (categoryJson != null) {
                    emitter.send(SseEmitter.event().name("category_done").data(categoryJson));
                }
                if (keywordJson != null) {
                    emitter.send(SseEmitter.event().name("keyword_done").data(keywordJson));
                }

                // 合并结果
                String merged = mergeResults(keywordJson, categoryJson);
                emitter.send(SseEmitter.event().name("done").data(merged));

                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                    emitter.complete();
                } catch (Exception ex) {
                    // ignore
                }
            }
        });

        return emitter;
    }

    // 调用扣子智能体（同步）
    private String callCozeSync(String botId, String token, String query) throws Exception {
        // ... 实现见附档 ...
    }

    // 调用扣子智能体（流式，带delta回调）
    private void callCozeStream(String botId, String token, String query, DeltaCallback callback) throws Exception {
        // ... 实现见附档 ...
    }

    // 括号匹配法提取 JSON
    private String extractJson(String text) {
        int start = text.indexOf('{');
        if (start < 0) return "{}";
        int depth = 0;
        for (int i = start; i < text.length(); i++) {
            if (text.charAt(i) == '{') depth++;
            else if (text.charAt(i) == '}') {
                depth--;
                if (depth == 0) return text.substring(start, i + 1);
            }
        }
        return "{}";
    }

    // 合并结果
    private String mergeResults(String keywordJson, String categoryJson) {
        // ... 将 category 和 categoryTree 插入 keywordJson ...
        // 生产环境建议用 Jackson 操作
    }

    @FunctionalInterface
    interface DeltaCallback {
        void onDelta(String delta);
    }
}
```

---

## 九、前端调用示例

```javascript
async function callAIAnalysis(keyword, onDelta) {
  const url = '/api/ai/analyze?keyword=' + encodeURIComponent(keyword);

  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url);
    let finalResult = null;

    eventSource.addEventListener('delta', (event) => {
      // 分析过程实时更新
      if (onDelta) onDelta(event.data);
    });

    eventSource.addEventListener('category_done', (event) => {
      console.log('类目结果:', JSON.parse(event.data));
    });

    eventSource.addEventListener('keyword_done', (event) => {
      console.log('关键词结果:', JSON.parse(event.data));
    });

    eventSource.addEventListener('done', (event) => {
      try {
        finalResult = JSON.parse(event.data);
      } catch (e) {
        finalResult = extractJson(event.data);
      }
      eventSource.close();
      resolve(finalResult);
    });

    eventSource.addEventListener('error', (err) => {
      eventSource.close();
      if (finalResult) {
        resolve(finalResult);
      } else {
        reject(new Error('AI分析失败'));
      }
    });
  });
}

// 使用示例
callAIAnalysis('跨境女装', (deltaText) => {
  // 实时展示分析过程
  document.getElementById('analysis-text').textContent = deltaText;
}).then(result => {
  // 拿到完整结果，去搜商品
  console.log('分析完成:', result);
});
```