---
title: "http基础请求:get,post"
description: 这是一个关于get和post请求的基础文章
pubDate: 2026-11-05T23:28
tags: [请求, get, post, http]
emoji: "📝"
hue: 255
featured: false
draft: false
---

## 一、Python 发送 GET 和 POST 请求

### requests 的定位

`requests` 是 Python 最常用的**同步** HTTP 客户端：调用 `requests.get()` / `requests.post()` 后，当前线程会一直等到响应返回（或超时）。它封装了 URL 编码、连接池、Cookie、重定向、JSON 解析等细节，适合脚本、爬虫入口和普通后端调用。

```bash
pip install requests
```

需要复用连接、统一请求头或 Cookie 时，使用 `requests.Session()`；只发一两次请求时，直接用模块级函数即可。

GET 与 POST 的核心区别在 HTTP 语义，而不只是“参数放哪里”：

| 维度 | GET | POST |
|---|---|---|
| 语义 | 获取资源；应设计为安全、幂等 | 提交数据；通常不视为安全、幂等 |
| 参数位置 | URL 查询串（query string） | 请求体（body） |
| 典型用途 | 查询、搜索、读取详情 | 登录、创建资源、提交表单 |
| 可见性 | URL 会进入日志、浏览器历史 | 不出现在 URL，但仍要靠 HTTPS 保护 |

这里的“安全”是 HTTP 语义，指不改变服务器状态，不是“安全性高”。GET 也可以携带请求体，POST 也可以把参数放 URL，但都不符合常规约定，实际接口应按语义使用。

### 1. 最基本的 GET：读取状态码和文本

```python
import requests

response = requests.get("https://httpbin.org/get", timeout=10)
print("status:", response.status_code)
print("body:", response.text[:200])
```

说明：`status_code` 是整数状态码，`text` 是按响应编码解码后的字符串；`timeout=10` 是连接/读取超时，避免请求无限挂起。

需要把 4xx/5xx 当作异常处理时，加一行 `response.raise_for_status()`；`requests` 不会自动调用它。

### 2. 带查询参数的 GET：使用 `params`

```python
import requests

params = {"q": "python", "page": 2}

response = requests.get(
    "https://httpbin.org/get",
    params=params,
    timeout=10,
)
print(response.url)
print(response.json()["args"])
```

说明：**`params` 字典**会被 URL 编码并拼到查询串，`response.url` 可核对最终地址；httpbin 会把收到的参数回显在 JSON 的 `args` 字段中。

如果 URL 本身已有查询参数，`requests` 会保留并追加，不会直接覆盖。

### 3. 表单格式的 POST：使用 `data`

```python
import requests

data = {"username": "alice", "password": "s3cret"}

response = requests.post(
    "https://httpbin.org/post",
    data=data,
    timeout=10,
)
print(response.json()["form"])
```

说明：`data=` 发送 `application/x-www-form-urlencoded`，对应传统 HTML 表单；httpbin 在 JSON 的 `form` 字段中回显收到的表单。

这不是 JSON。服务端必须按表单解析，不能直接当 JSON 读。

### 4. JSON 格式的 POST：使用 `json`

```python
import requests
json = {"name": "alice", "age": 30}
response = requests.post(
    "https://httpbin.org/post",
    json=json,
    timeout=10,
)
print(response.json()["json"])
```

说明：`json=` 会自动做 JSON 序列化，并默认设置 `Content-Type: application/json`；不需要先手动 `json.dumps()` 再传给 `data`，除非你要自己控制请求头或序列化细节。

httpbin 会把解析后的 JSON 放在响应的 `json` 字段中，所以这里读 `["json"]`。

### 5. 自定义请求头：使用 `headers`

HTTP 头是请求和响应的元数据，常见的有 `User-Agent`、`Accept`、`Content-Type`、`Authorization` 和自定义的 `X-*`。`headers=` 可以覆盖 `requests` 的默认值；响应头通过 `response.headers` 读取（大小写不敏感）。

```python
import requests

url = "https://httpbin.org/headers"

headers = {
    "User-Agent": "my-app/1.0",
    "Accept": "application/json",       # 这个accept的意思是:"期望服务端返回的数据是json"
    "Content-Type": "application/json"  # 这个content-type的意思是:"我发送的请求是json"
}
response = requests.get(url, headers=headers, timeout=10)
print(response.json()["headers"]["User-Agent"])
```

说明：httpbin 会回显服务端收到的请求头，因此可以确认自定义 `User-Agent` 已生效；`requests` 仍会自动补上 `Host`、`Accept-Encoding` 等必要头。

不要手动设置 `Content-Length`、`Host` 这类由客户端库管理的头；`Authorization` 里也不要硬编码明文令牌，应该从环境变量或密钥管理系统读取，并只走 HTTPS。

### 6. Cookie：发送、接收与保存

Cookie 是服务器通过 `Set-Cookie` 让客户端保存、后续请求再通过 `Cookie` 头回传的一小段状态。用 `cookies=` 可以给单次请求带上 Cookie；`response.cookies` 则是这次响应里 `Set-Cookie` 解析出的 cookie jar，不等于“本次请求发送了哪些 Cookie”。

```python
import requests

cookies = {"sessionid": "abc123"}
response = requests.get(
    "https://httpbin.org/cookies",
    cookies=cookies,
    timeout=10,
)
print(response.json()["cookies"])
```

说明：httpbin 会把收到的 Cookie 回显在 `cookies` 字段中；`cookies=` 适合临时指定一两个值，需要跨请求保存时用下一节的 `Session`。

Cookie 的属性由服务端设置，常见的有 `Domain`、`Path`、`Expires`/`Max-Age`、`Secure`、`HttpOnly`、`SameSite`。其中 `HttpOnly` 只阻止浏览器 JavaScript 读取，不阻止 Python 客户端或中间人；`Secure` 只表示浏览器应通过 HTTPS 发送，不能替代服务端校验。Cookie 的内容默认可被客户端读取和修改，服务端不能直接信任；Flask 的 session cookie 会用 itsdangerous 签名防篡改，但并不加密（见第四部分）。

> 如果每次请求都给你分发新的cookie,那下一次请求都要带上这个新cookie,这样复制粘贴难免过于复杂,于是我们介绍下面的东西 

### 7. Session：复用连接、请求头和 Cookie

`requests.Session()` 是**客户端**的持久化容器：它维护连接池、默认请求头、Cookie jar、认证信息和重定向配置。

```python
import requests

s = requests.Session()

# 1. 发送账号密码去登录（服务器返回了一个证明你身份的身份牌 Cookie）
s.post("http://网站/login", data={"user": "admin", "pass": "123"})

# 2. 直接带着身份去打后台（它会自动带上刚才的 Cookie，相当于你已经登录了）
res = s.get("http://网站/个人中心?id=1")

# 3. 测试越权（修改 id 看看能不能看到别人的）
res2 = s.get("http://网站/个人中心?id=2")
```

说明：`Session` 会把接受到的cookie存进自己的 cookie jar；下一次请求自动带上它, 如若服务器下发了新的cookie,Session也会带上他。
当服务器下发新 Cookie 时，遵循“同名覆盖，异名追加”原则：如果 Key 相同，新值会直接覆盖并删除旧值；如果 Key 不同，则作为新条目追加。
因此，下一次请求自动带上它时，带上的是当前最新、最全的 Cookie 状态（没有历史版本，无法回滚）。



### headers、cookies、Session 的关系

| 机制 | 解决什么 | 作用范围 | 常用写法 |
|---|---|---|---|
| headers | 请求元数据、内容协商、认证 | 单次请求或 Session 默认值 | `headers=...`、`session.headers.update(...)` |
| cookies | 服务器要求客户端保存并回传的状态 | 单次请求或 Session 的 cookie jar | `cookies=...`、`response.cookies`、`session.cookies` |
| Session | 复用连接并保持默认头、Cookie、认证 | 从创建到 `close()` | `with requests.Session() as session:` |

三者不是互斥关系：Session 可以统一管理 headers 和 cookies；cookies 最终会体现在请求的 `Cookie` 头里。抓取需要登录的页面时，通常先用 Session 提交登录表单，再复用同一个 Session 访问后续页面。

几个容易踩的点：

- **GET 的查询参数会出现在 URL 和访问日志里**，不要把密码、令牌等秘密放在 GET 参数中。
- 先看状态码，再解析响应；`response.json()` 在响应不是合法 JSON 时会抛异常。
- `requests` 是同步的，一个请求会占住当前线程；并发请求要靠多线程或异步客户端，见后文。
- `headers` 的值通常是字符串；`Content-Type` 要和请求体一致，JSON 请求优先让 `json=` 自动设置。
- 模块级 `requests.get()` 每次都会创建并丢弃内部 Session，所以服务器设置的 Cookie 不会自动带到下一次调用；跨请求状态用 `Session`。
- `Authorization`、Cookie 都是凭证：只走 HTTPS，不要硬编码进代码，也不要把它们原样写进日志。

PUT、DELETE、HEAD、OPTIONS 的调用形式同样是 `requests.put/delete/head/options`，只是语义不同，这里不展开。

