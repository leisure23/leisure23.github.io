---
title: "文件上传漏洞:upload-labs 第1~5关"
description: 这是upload-labs的前五道题题解
pubDate: 2026-11-18T22:20
tags: [文件上传漏洞]
emoji: "📝"
hue: 255
featured: false
draft: false
---

# upload-labs 第1~5关

---

## 1. 核心分析方法

### 1.1 五变量：服务器能看到的东西只有五样

| 变量 | 服务器看到什么 |
|---|---|
| ① 文件名 | 完整字符串（扩展名、大小写、末尾点/空格、`::`） |
| ② Content-Type | 每个分片自述的 MIME |
| ③ 文件内容 | 那堆字节 |
| ④ 文件大小 | 长度 |
| ⑤ 其它参数 | 字段名、隐藏字段 |

任何一道上传题，过滤逻辑都在盯着这五样里的某几样。**要做的是用单变量对照把它试出来。**

### 1.2 两个必要条件（最重要的一条）

| 条件 | 含义 | 不满足的后果 |
|---|---|---|
| **传得上去** | 通过校验，写进上传目录 | 被拦，什么都没发生 |
| **跑得起来** | Web 服务器把该文件交给 PHP | 文件躺着，访问只吐源码 |

**只有 A+B 同时成立才是任意代码执行。** 新手九成的时间浪费在：A 早就过了，却一直在 A 上死磕。

> 判定方法：看 `div#msg` 空不空（A），再去访问 URL 看吐的是输出还是源码（B）。

### 1.3 请求核心内容

| 旋钮 | 住在哪 | 谁在看 | 决定什么 |
|---|---|---|---|
| 文件名 | `Content-Disposition: filename=` | Web 服务器 | 存成什么名、交给谁处理 |
| Content-Type | 分片头 | 浏览器 / 应用代码 | 怎么渲染、某些校验怎么判 |
| 内容 | 数据段 | 解释器 | 真执行起来是什么 |

三者可以任意组合。**"看起来是图片"和"里面藏着代码"可以同时为真**，因为不同检查者只看不同部分。

### 1.4 基本分析方法

- **单变量对照**：一次只改一样，读错误信息的原文。
- **基线对比**：先让"合法用户"走一遍（上传真图片 / 正常请求），把合法样本和恶意样本 diff，差异处就是守门人看的东西。

---

## 2. Pass-01：前端校验

### 现象
选一个 `.php` 点上传 → **浏览器弹窗**"不允许上传此类型文件" → Network 面板**没有任何 POST 请求**。

### 试错过程

1. **先尝试：骗过它。** 看到页面 `<form onsubmit="return checkFile()">`，第一反应是研究 `checkFile` 的判断逻辑（白名单 `.jpg|.png|.gif`），想构造一个"奇怪的扩展名"混过去 → **方向错了**，因为墙建在自己的机器上，研究砖缝没有意义。
2. **后尝试：分析它在哪一层。** 三个观察：弹窗是浏览器画的 / Network 无 POST / 页面未刷新 → 断定**文件从未离开本机**。得出结论：这是前端校验。
3. **又尝试：让它"不发生"。** 拆解提交链条（点击 → submit 事件 → onsubmit → 组装请求 → 发送），发现每个环节都在自己可控范围内。选了最省事的一个：覆盖函数。

### 解法
在浏览器控制台执行：

```js
checkFile = function(){ return true; }
```

再正常点上传。另一种等价做法：在 Elements 里删掉 `onsubmit` 属性。

### 验证
上传 `probe.php`（内容 `<?php echo "PROBE-OK"; ?>`），响应出现 `<img src="../upload/probe.php">`；
访问 `http://upload.test/upload/probe.php` → 输出 `PROBE-OK`


### 原理
`function checkFile(){}` 在全局作用域创建了一个属性 `window.checkFile`，其值是一个函数对象。
`onsubmit` 里的 `checkFile()` **不是提前绑定的**，而是在提交那一刻"查这个名字现在指向谁"（运行时解析 / 晚绑定）。
把名字重新指向另一个函数，调用方就拿到了新函数。

- 原来的函数只是失去了引用 → 被 GC
- **刷新页面即复原**：脚本重新加载、重新声明
- 改 Elements 里的 HTML 文本无效，因为那段 `<script>` 早已解析执行完毕

---

## 3. Pass-02：Content-Type（MIME）绕过

### 现象
传 `test.php` → 页面里出现**红字**（不是弹窗）：`提示：文件类型不正确，请重新上传！`

### 试错过程

1. **先尝试：对比 Pass-01 的响应。** 发现同一个 `<div id="msg">`，上一关永远是空的，这一关有字。

2. **后尝试：定位它在看什么。** 想到"类型"这个词可能是扩展名、也可能是自述 MIME。为了不猜，做**基线对比**：
   上传一张真正的 `.jpg`，在 Yakit 里看这条合法请求 → 第②层是 `Content-Type: image/jpeg`。
3. **又尝试：只改这一个变量。** 把自己的 `test.php` 请求里那段 `Content-Type` 从 `application/octet-stream` 改成 `image/jpeg`，其它一个字节不动。

### 解法
只改 multipart body 里文件那一段的头部：

```
Content-Disposition: form-data; name="upload_file"; filename="test.php"
Content-Type: image/jpeg          ← 只改这一行
```

### 验证
响应 `div#msg` 空、出现 `<img src="../upload/test.php">`；访问 → 输出 `hello,world!` → **通关**。

### 原理
PHP 的 `$_FILES['file']['type']` **完全来自客户端在分片头里写的那行 Content-Type**，服务器没有任何办法验证真假（除非它愿意去嗅探内容）。
代码写着"必须是 image/jpeg/png/gif"，实际上是在检查**一份自己写的说明书**。

### 关键细节（当时没注意、后来才想明白）
- **服务器没有改名**：`../upload/test.php` 原样落地。这决定了后面几关的攻击面。
- **Content-Length 也是自述**：改了 body 长度却没改它，长度不一致时服务器可能**静默截断**——页面显示成功，但落地文件缺了尾巴。

---

## 4. Pass-03：黑名单

### 现象
报错原文：`不允许上传.asp,.aspx,.php,.jsp后缀文件！`
尝试了接下来的若干种方法,然而都不行

### 试错过程（完整清单）

| 顺序 | 尝试 | 结果 | 从中学到什么 |
|---|---|---|---|
| 1 | `.jpg` + `image/jpeg` | 放行，破图 | 文件落地但被当静态资源 |
| 2 | `.txt` + `text/plain` | 放行，直接显示文本 | **"显示内容" ≠ "执行"** |
| 3 | `.php` | 拦截 | 黑名单生效 |
| 4 | `.phpphp` | 放行，访问吐源码 | 服务器是**整段精确匹配**，不是"包含 php 就算" |
| 5 | `.jpg.php` | 拦截 | 过滤取的是**最后一段**后缀 |
| 6 | `.php.jpg` | 放行，但落地名变成 `202611181539271022.jpg` | **服务器会重命名，只保留最后一段后缀** → 文件名结构类手法全废 |
| 7 | `.PHP` | 拦截 | 代码里有 `strtolower` |
| 8 | `test.php␣`（尾空格） | 拦截 | 有 `trim` |
| 9 | `test.␣jpg`（中间空格） | 放行，空格保留在 URL 里 | **`trim` 只削首尾** → 用实验反推出了处理函数的行为 |
| 10 | `.php3` | 放行，落地 `xxx.php3`，访问吐源码 | **本机只有 `.php` 会被执行** |
| 11 | `.php::$DATA` | 拦截 | 代码专门清了 `::$DATA` |

源码贴在底下：

```php
$deny_ext = array('.asp','.aspx','.php','.jsp');
$file_name = trim($_FILES['upload_file']['name']);
$file_name = deldot($file_name);                    // 去尾点
$file_ext  = strrchr($file_name, '.');
$file_ext  = strtolower($file_ext);                 // ← 对应第 7 次尝试
$file_ext  = str_ireplace('::$DATA', '', $file_ext); // ← 对应第 11 次
$file_ext  = trim($file_ext);                        // ← 对应第 8、9 次
$img_path  = UPLOAD_PATH.'/'.date("YmdHis").rand(1000,9999).$file_ext; // ← 对应第 6 次
```

### 结论
**这道题在本机无解**（就"扩展名绕过"这一维度而言）。
标准解 `shell.phtml` 依赖"Apache 把 `.phtml` 也交给 PHP"，而本机只映射 `.php`。

---

## 5. Pass-04：`.htaccess`（配置文件上传）

### 现象
黑名单变得极长（`.php/.php5/.php4/.php3/.php2/.php1/.html/.htm/.phtml/.pht/.pHp…/.jsp*/.asp*/.cer/.swf`）。
**基本上把所有"能被执行的后缀"穷举完了。**

### 试错过程

1. **先尝试：沿用 Pass-03 的思路，找漏网后缀。** 黑名单列举出来的太多了
2. **后尝试：换维度提问。** 既然"哪个后缀能执行"是**服务器配置**决定的，那配置存在哪？能不能被我影响？
   于是把问题从"找一个能被执行的文件"改成"**找一个能改变服务器规则的文件**"。
3. **又尝试：找符合条件的文件。** 三个条件：① 自己不需要被执行 ② 能改变同目录下其它文件的处理方式 ③ 名字不在黑名单里 → `.htaccess`。


### 解法
先传 `.htaccess`：

```
AddHandler fcgid-script .jpg
FcgidWrapper "C:/D/phpstudyyy/phpstudy_pro/Extensions/php/php5.6.9nts/php-cgi.exe"
```

再传 `shell.jpg`（内容是 PHP 代码）→ 访问 `/upload/shell.jpg` → 代码执行。

> 本机已实测通过（返回 `PASS04_OK`）。

### 原理
- `.htaccess` 是 Apache 的**目录级配置文件**，对该目录下所有文件生效。它本身**不需要被执行**，只是一份"规则说明书"。
- `AddHandler fcgid-script .jpg`：把 `.jpg` 指派给 `fcgid-script` 这个处理器（处理器名由模块注册，不能自己编）。
- `FcgidWrapper "<绝对路径>"`：告诉 FastCGI 用哪个程序执行（此处即 `php-cgi.exe`）。不带后缀 = 该目录的默认解释器。
- 因为 `.htaccess` 的 `strrchr` 结果是整个 `.htaccess`，不在黑名单里；且本关**不重命名**，名字得以保留。

### 为什么黑名单挡不住
> 黑名单防守的是"文件能不能被执行"。而 `.htaccess` **自己根本不需要被执行**,这是一份说明书

### 隐形开关
整个攻击依赖 vhost 里的 `AllowOverride All`。若是 `AllowOverride None`，Apache 根本不读 `.htaccess`，这关就不存在。
→ **很多漏洞的成立，靠的是某个"没人在意的配置项"。**

---

## 6. Pass-05：`.user.ini`（换一个配置层）

### 现象
黑名单把 `.htaccess` 也补进去了 → Pass-04 的路被封。

### 试错过程

1. **先尝试：双写。** 传 `test.pphphp` → **放行**，还很兴奋，以为"服务器会把它还原成 .php"。
   **结果落地名依然是 `test.pphphp`** → 访问吐源码，不执行。
   → 教训：**"上传成功"必须看落地名，名字没变回去就是白传。**
2. **后尝试：字符类招数全扫一遍。**
   - `test.PHP` → 拦截（有 `strtolower`）
   - `test.php␣`（尾空格）→ 拦截（有 `trim`）
   - `test.php.`（尾点）→ 拦截（有 `deldot`）
   - `test.php::$DATA` → 拦截（有 `str_ireplace`）
   → **四个全灭**，字符层面彻底走不通。
3. **又尝试：换配置层。** Pass-04 用的是 Apache 的配置，那 PHP 自己有没有配置？
   → `.user.ini`。而黑名单里**恰恰没有 `.ini`**（这是 Pass-04 补丁的遗漏）。

### 解法
先传 `.user.ini`：

```
auto_prepend_file=shell.jpg
```

再传 `shell.jpg`（内容是 PHP 代码），然后访问：

```
http://upload.test/upload/readme.php
```

> 本机已实测通过（`readme.php` 输出 `PASS05_OK` + 原内容）。

### 原理
- `.user.ini` 是 **PHP 自己的目录级配置文件**，PHP 执行该目录下的脚本前会去找它，**不需要 Apache 参与**——所以 `.htaccess` 被禁也无所谓。
- `auto_prepend_file`：执行该目录下**任何 PHP 脚本之前**，先把指定文件执行一遍。
- `upload/` 目录里恰好有靶场自带的 `readme.php`，它就是那个"触发器"。
- 过滤侧：`.user.ini` 的 `strrchr` 结果是 `.ini`，不在黑名单里。

### 坑
1. **`.user.ini` 有缓存**：`user_ini.cache_ttl` 默认 300 秒，改完可能不立刻生效。
2. **路径解析**：`auto_prepend_file` 写成相对名可能找不到，必要时写绝对路径。

---

## 7. 总结：五关的数据

| 关卡 | 攻击维度 | 关键动作 | 一句话 |
|---|---|---|---|
| 01 | 前端 | 覆盖 `checkFile` 让它返回 true | 在攻击者机器上执行的检查，等于没检查 |
| 02 | 自述字段 | 改分片头 `Content-Type` | 服务器信的是说明书，不是东西本身 |
| 03 | 扩展名 | （本机无解）标准解 `.phtml` | 黑名单要"漏网"且"服务器认"，两条件同时成立才行 |
| 04 | Apache 配置 | `.htaccess` 改 `.jpg` 的处理器 | 不打文件，打"谁可执行"的规则 |
| 05 | PHP 配置 | `.user.ini` + `auto_prepend_file` | 上层配置被封，就换下层配置 |
