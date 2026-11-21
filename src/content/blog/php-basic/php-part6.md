---
title: "php基础语法 part6"
description: "主要内容是php的基础语法"
pubDate: 2026-11-21T16:54
tags: [php基础]
---

# PHP（基础篇）· part6 表单与文件

> [← php-part5 函数与类](../php-part5/) · [总目录](../php-part1/#目录) · [下一份 php-part7 报错对照与速查](../php-part7/) →

---

## 13 超级全局变量与表单

### 九个超全局变量（任何作用域都能直接访问）

| 变量 | 内容 |
|---|---|
| `$_GET` | URL 查询串里的参数（`?a=1&b=2`） |
| `$_POST` | 表单 POST 过来的数据 |
| `$_REQUEST` | GET + POST + COOKIE 的合集（不推荐） |
| `$_SERVER` | 服务器信息：`REQUEST_METHOD`、`PHP_SELF`、`HTTP_USER_AGENT` |
| `$_FILES` | 上传的文件信息 |
| `$_SESSION` | 会话数据（需 `session_start()`） |
| `$_COOKIE` | 客户端 cookie |
| `$_ENV` | 环境变量 |
| `$GLOBALS` | 所有全局变量的数组 |

```php
var_dump($_GET["page"] ?? null);
var_dump($_POST["user"] ?? null);
var_dump($_SERVER["REQUEST_METHOD"] ?? "无");   // 网页请求是 "GET"/"POST"
```

⚠️ **CLI 下 `$_GET` / `$_POST` 都是空数组**（没有浏览器请求），`$_SERVER["REQUEST_METHOD"]` 甚至不存在。所以本地命令行测试表单逻辑时，要手动赋值模拟：

```php
$_GET = ["page" => "2"];      // 手动模拟
```

### GET vs POST

| | GET | POST |
|---|---|---|
| 参数位置 | URL 里（`?a=1`） | 请求体里 |
| 可见性 | 地址栏能看到 | 看不到 |
| 长度限制 | 有（约 2000 字符） | 基本没有 |
| 用途 | 查询、翻页、搜索 | 提交密码、上传、改数据 |
| 刷新页面 | 安全（可重复） | 会提示「重新提交表单」 |

### 一个完整的表单处理（同文件）

```php
<?php
$name = $email = "";
$errors = [];

if ($_SERVER["REQUEST_METHOD"] === "POST") {          // 判断是不是提交了

    $name = trim($_POST["name"] ?? "");                // 用 ?? 防未定义警告
    $email = trim($_POST["email"] ?? "");

    if ($name === "") {
        $errors[] = "姓名不能为空";
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {  // 内置校验
        $errors[] = "邮箱格式不对";
    }

    if (!$errors) {
        echo "提交成功：" . htmlspecialchars($name);    // 输出必须转义
    }
}
?>

<form method="post" action="<?= htmlspecialchars($_SERVER["PHP_SELF"]) ?>">
    姓名：<input name="name" value="<?= htmlspecialchars($name) ?>">
    邮箱：<input name="email" value="<?= htmlspecialchars($email) ?>">
    <button>提交</button>
</form>
```

`filter_var` 的实测结果：

```php
filter_var("a@b.com", FILTER_VALIDATE_EMAIL);  // → "a@b.com"
filter_var("not-an-email", FILTER_VALIDATE_EMAIL);  // → false
filter_var("123", FILTER_VALIDATE_INT);  // → 123
```

### 两条安全底线（必须记）

⚠️ **① 输出用户输入必须 `htmlspecialchars()`**

```php
echo "<p>" . htmlspecialchars($_GET["q"]) . "</p>";
```

不转义就等着被 XSS：用户在输入框里填 `<script>...</script>`，你的页面就会执行它。
`htmlspecialchars("<b>x</b>")` → `"&lt;b&gt;x&lt;/b&gt;"`（显示成字符，不当标签解析）。

⚠️ **② 永远不要相信 `$_GET` / `$_POST` 里的内容**

- 取之前先用 `??` 或 `isset`，否则未提交的字段会报 `Warning: Undefined array key`。
- 数字用 `(int)` 强转或 `filter_var(..., FILTER_VALIDATE_INT)`。
- 进数据库要用**预处理语句**（`PDO::prepare`），把参数拼进 SQL 就是 SQL 注入。

---

## 14 文件包含与文件读写

### include 与 require

```php
include __DIR__ . "/header.php";          // 失败：警告 + 继续执行
require __DIR__ . "/config.php";          // 失败：致命错误 + 停止执行

include_once __DIR__ . "/header.php";     // 只包含一次（防止重复定义函数/类）
require_once __DIR__ . "/config.php";     // 最常用
```

失败时的真实表现：

```
# include 缺失文件
Warning: include(): Failed opening '.../_nope.php' for inclusion
bool(false)                     ← 返回 false，程序继续跑

# require 缺失文件
Warning: require(): Failed to open stream: No such file or directory
Fatal error: Uncaught Error: Failed opening required '.../_nope_z.php'
                                ← 程序直接终止，退出码 255
```

**选哪个**：加载「必须要有」的东西（配置、类库）用 `require_once`；可选的部分（广告位、插件）用 `include_once`。

被包含的文件可以 `return` 一个值：

```php
// config.php:  <?php return ["db" => "test"];
$conf = include __DIR__ . "/config.php";    // → ["db" => "test"]
```

### 读文件

```php
// ① 一次读全部（小文件最方便）
$content = file_get_contents("data.txt");

// ② 读成数组，一行一个元素
$lines = file("data.txt", FILE_IGNORE_NEW_LINES);   // → ["line1", "line2"]

// ③ fopen + 逐行读（大文件省内存）
$fh = fopen("data.txt", "r");
if ($fh) {
    while (($line = fgets($fh)) !== false) {
        echo $line;
    }
    fclose($fh);
}
```

### 写文件

```php
file_put_contents("out.txt", "line1\nline2\n");              // 覆盖写入
file_put_contents("out.txt", "more\n", FILE_APPEND);         // 追加
file_put_contents("out.txt", $data, LOCK_EX);                // 加锁，防并发写坏
```

`file_put_contents` 内部就是 fopen + fwrite + fclose，比手动写省事，日常够用。

### 常用文件函数

| 函数 | 作用 |
|---|---|
| `file_exists($p)` | 文件/目录是否存在 |
| `filesize($p)` | 字节数 |
| `unlink($p)` | 删除文件 |
| `copy($a, $b)` | 复制 |
| `rename($a, $b)` | 重命名/移动 |
| `basename($p)` / `dirname($p)` | 取文件名 / 取目录 |
| `is_file($p)` / `is_dir($p)` | 判断类型 |
| `mkdir($p, 0777, true)` | 建目录（第三个参数允许递归） |
| `filemtime($p)` | 最后修改时间戳 |

```php
file_put_contents("t.txt", "line1\nline2\n");
var_dump(file_exists("t.txt"));    // → true
var_dump(filesize("t.txt"));       // → 12
unlink("t.txt");
var_dump(file_exists("t.txt"));    // → false
```

### 两个坑

⚠️ **路径**：用 `__DIR__ . "/data.txt"` 或绝对路径。写 `"data.txt"` 是相对「当前工作目录」，从不同入口跑会指向不同地方。

⚠️ **权限**：写入失败多半是目录没有写权限（Windows 少见，Linux 上很常见）。`file_put_contents` 失败只返回 `false`，不抛异常：

```php
$n = file_put_contents("x.txt", "data");
if ($n === false) {
    echo "写入失败，检查目录权限";
}
```
