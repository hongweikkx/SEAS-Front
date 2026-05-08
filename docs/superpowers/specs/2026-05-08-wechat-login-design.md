# 微信公众号扫码登录系统设计

## 一、概述

SEAS 智能学业分析系统采用微信公众号扫码登录作为唯一的认证方式。用户无需输入账号密码，扫码关注公众号并回复验证码即可完成登录。系统不获取用户昵称、头像等个人信息，仅用微信 OpenID 做匿名身份标识。

## 二、技术前提

- **公众号类型**：个人订阅号（未认证）
- **可用接口**：接收消息推送（包括关注事件、文本消息）
- **不可用接口**：带参数二维码、网页授权（OAuth2）、获取用户信息
- **替代方案**：使用公众号普通二维码 + 验证码回复的方式完成身份关联

## 三、核心流程

### 3.1 登录触发

```
用户访问 /login
    ↓
前端调用 POST /api/auth/login-request
    ↓
后端生成 5 位数字验证码，存入 Redis（5 分钟过期）
    ↓
返回：{ code: "82736", qrUrl: "公众号二维码URL", expireAt: "..." }
    ↓
前端展示二维码 + 验证码，同时建立 SSE 连接监听登录结果
```

### 3.2 用户扫码并回复验证码

```
用户微信扫码 → 关注公众号
    ↓
在公众号聊天窗口回复验证码 "82736"
    ↓
微信服务器将消息推送到后端回调接口
    ↓
后端解析消息：提取 OpenID + 验证码内容
```

### 3.3 登录完成

```
后端验证验证码：
  - 验证码存在且未过期 → 继续
  - 验证码不存在或已过期 → 回复"验证码已过期，请刷新页面重试"
    ↓
用 OpenID 查询用户表：
  - 存在 → 更新登录时间
  - 不存在 → 创建新用户（仅存储 OpenID、创建时间）
    ↓
生成 JWT（有效期 7 天）
    ↓
通过 SSE 推送登录态给前端：{ status: "success", token: "xxx" }
    ↓
前端存储 token 到 localStorage，跳转首页
```

## 四、接口设计

### 4.1 后端接口（Go / Kratos）

#### POST /api/auth/login-request — 生成登录验证码

**Request:**
```json
{}
```

**Response:**
```json
{
  "code": "82736",
  "qrUrl": "https://mp.weixin.qq.com/...",
  "expireSeconds": 300
}
```

**实现逻辑：**
1. 生成 5 位随机数字验证码
2. 存入 Redis：`wechat:login:{code} = { status: "waiting" }`，TTL = 300 秒
3. 返回验证码 + 公众号二维码 URL（固定二维码，长期有效）

#### GET /api/auth/login-sse — SSE 长连接监听登录结果

**Query:** `?code=82736`

**SSE Events:**
```
event: status
data: {"status":"waiting"}

event: status
data: {"status":"success","token":"eyJhbG...","expiresAt":"..."}

event: status
data: {"status":"expired"}
```

**实现逻辑：**
1. 设置 SSE 响应头（Content-Type: text/event-stream）
2. 每 2 秒检查一次 Redis 中该验证码的状态
3. 状态变更时推送事件
4. 5 分钟无变化自动关闭连接

#### POST /api/auth/wechat-callback — 接收微信消息推送

**Request (XML，微信标准格式):**
```xml
<xml>
  <ToUserName><![CDATA[gh_xxx]]></ToUserName>
  <FromUserName><![CDATA[openid_xxx]]></FromUserName>
  <CreateTime>123456789</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[82736]]></Content>
  <MsgId>1234567890123456</MsgId>
</xml>
```

**Response (XML):**
```xml
<xml>
  <ToUserName><![CDATA[openid_xxx]]></ToUserName>
  <FromUserName><![CDATA[gh_xxx]]></FromUserName>
  <CreateTime>123456789</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[登录成功！您可以在浏览器中继续使用 SEAS 系统。]]></Content>
</xml>
```

**实现逻辑：**
1. 验证微信消息签名（防止伪造）
2. 判断消息类型：`MsgType == "text"` 且 `Content` 为 5 位纯数字
3. 从 Redis 查找该验证码：`wechat:login:{code}`
4. 若验证码有效：
   - 用 `FromUserName`（OpenID）查询/创建用户
   - 生成 JWT
   - 更新 Redis：`wechat:login:{code} = { status: "success", token, userId }`
   - 回复微信"登录成功"消息
5. 若验证码无效或已过期：
   - 回复微信"验证码已过期，请刷新页面重试"

#### POST /api/auth/logout — 登出

**Request Headers:** `Authorization: Bearer {token}`

**实现逻辑：**
前端调用后端通知登出（主要用于审计），实际 token 清除由前端完成（从 localStorage 删除）。

### 4.2 前端改动

#### /login/page.tsx — 登录页重构

页面结构：
- 顶部品牌栏（保持现有）
- 中央登录卡片：
  - 公众号二维码图片
  - 5 位验证码大字显示
  - "请在公众号中回复上方验证码"提示文字
  - 刷新验证码按钮（重新请求新验证码）
  - 倒计时显示（5 分钟）
- SSE 连接管理：登录成功后自动跳转

#### api.ts — 增加认证拦截器

```typescript
// 请求拦截器：自动附加 Authorization header
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### middleware.ts — 登录保护（新增）

未登录用户访问受保护页面时，重定向到 /login。

## 五、数据模型

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键，自增 |
| openid | varchar(64) | 微信 OpenID，唯一索引 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

**说明：**
- 不存储用户名、密码、昵称、头像等任何个人信息
- OpenID 作为匿名身份标识，同一用户多次登录可识别为同一人
- 每个微信用户在该公众号下的 OpenID 是唯一的

### Redis 键设计

| 键 | 值 | TTL |
|----|----|-----|
| `wechat:login:{code}` | `{"status":"waiting"}` / `{"status":"success","token":"..."}` | 300 秒 |

## 六、认证机制

### JWT 设计

- **载体**：用户 ID（`sub` 字段）
- **有效期**：7 天
- **签名算法**：HS256
- **存储位置**：前端 localStorage
- **传递方式**：每个 API 请求通过 `Authorization: Bearer {token}` Header 携带

### Token 验证

后端每个受保护接口的拦截器：
1. 从 Header 提取 token
2. 验证签名和过期时间
3. 从 token 中解析用户 ID
4. 将用户 ID 注入上下文，供业务逻辑使用

## 七、安全考虑

1. **验证码防枚举**：5 位纯数字，空间 10 万，5 分钟内暴力破解概率极低
2. **验证码一次性使用**：登录成功后立即从 Redis 删除
3. **微信消息签名验证**：回调接口必须验证微信消息签名，防止伪造
4. **同一 OpenID 频率限制**：单个 OpenID 短时间内多次发送无效验证码时，可暂时忽略其消息
5. **HTTPS 传输**：生产环境所有接口必须使用 HTTPS

## 八、微信后台配置

1. **启用开发者模式**：在公众号后台 → 开发 → 基本配置 → 启用服务器配置
2. **配置服务器 URL**：填写 `https://your-domain.com/api/auth/wechat-callback`
3. **配置 Token**：用于微信消息签名验证
4. **配置 EncodingAESKey**：消息加密密钥（推荐启用加密）
5. **设置 IP 白名单**：将服务器出口 IP 加入白名单

## 九、错误处理

| 场景 | 前端表现 | 后端处理 |
|------|----------|----------|
| 验证码过期 | 显示"验证码已过期，请刷新重试" | SSE 推送 `{"status":"expired"}` |
| 用户发送错误验证码 | 公众号回复"验证码错误，请检查" | 不更新 Redis 状态 |
| 网络断开 | 自动重连 SSE | SSE 连接断开，等待重新连接 |
| 微信回调失败 | 不影响前端，用户可重新发送 | 记录日志，继续服务 |

## 十、实现范围

### 前端
- [ ] 重构 `/login/page.tsx` — 验证码登录界面
- [ ] 新增 `src/middleware.ts` — 登录态保护
- [ ] 修改 `src/services/api.ts` — 自动附加 token

### 后端
- [ ] 新增 `auth.proto` — 定义认证相关接口
- [ ] 实现登录验证码生成服务
- [ ] 实现 SSE 登录状态查询服务
- [ ] 实现微信消息回调处理服务
- [ ] 新增 users 数据表
- [ ] JWT 签发与验证工具
