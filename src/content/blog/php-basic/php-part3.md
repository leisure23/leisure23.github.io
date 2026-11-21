---
title: "php基础语法 part3"
description: "主要内容是php的基础语法"
pubDate: 2026-11-21T16:01
tags: [php基础]
---


# PHP（基础篇）· part3 字符串与运算符

> [← php-part2 基础语法二](../php-part2/) · [总目录](../php-part1/#目录) · [下一份 php-part4 数据结构](../php-part4/) →

---

## 6 字符串

### 单引号 vs 双引号（必须分清）

```php
$name = "小明";

echo "你好，$name\n";     // → 你好，小明     双引号：会解析变量 + 转义符
echo '你好，$name\n';     // → 你好，$name\n  单引号：原样输出，不解解析
```

| | 单引号 `'...'` | 双引号 `"..."` |
|---|---|---|
| 解析 `$变量` | ✗ 不解析 | ✓ 解析 |
| `\n` `\t` | ✗ 原样 | ✓ 转义 |
| 速度 | 略快 | 略慢 |

**结论**：不含变量就用单引号，要插值就用双引号。

### 插值的三种写法

```php
$arr = [10, 20];
echo "值是 $arr[0]\n";          // → 值是 10     数字下标可以省略括号

$assoc = ["k" => "v"];          
echo "值是 $assoc[k]\n";        // → 值是 v      字符串下标不加引号也行
echo "值是 {$assoc['k']}\n";    // → 值是 v      推荐写法，最清晰

$obj->x = 1;
echo "对象 {$obj->x}\n";        // → 对象 1      对象必须用 {}

echo "{$name}s\n";              // → 小明的s     变量后面紧跟字母/汉字时要用 {}
```

⚠️ **`echo "值是 $assoc['k']"` 会直接解析错误**：

```
Parse error: syntax error, unexpected string content "", expecting "-" or identifier
```

双引号里用单引号取键，必须加 `{}` 写成 `"{$assoc['k']}"`。

### heredoc / nowdoc（写多行文本）

```php
$n = "小明";

$h = <<<EOT
两行文本，可以插值：$n
第二行
EOT;
// → "两行文本，可以插值：小明\n第二行"      ⚠️ 结束的 EOT 必须顶格、单独一行

$now = <<<'EOT'
不插值：$n
EOT;
// → "不插值：$n"
```

`<<<EOT`（heredoc）= 双引号行为；`<<<'EOT'`（nowdoc）= 单引号行为。

### 常用字符串函数（全部实测）

| 函数 | 作用 | 示例 → 结果 |
|---|---|---|
| `strlen` | 长度（**字节数**） | `strlen("abc")` → `3` |
| `strtoupper` / `strtolower` | 转大小写 | `strtoupper("abc")` → `"ABC"` |
| `ucfirst` / `ucwords` | 首字母大写 | `ucwords("hello world")` → `"Hello World"` |
| `trim` / `ltrim` / `rtrim` | 去首尾空白 | `trim("  hi  ")` → `"hi"` |
| `substr($s,$start,$len)` | 截取（支持负数） | `substr("hello",-2)` → `"lo"` |
| `str_replace($a,$b,$s)` | 全部替换 | `str_replace("a","X","abcabc")` → `"XbcXbc"` |
| `strpos($s,$sub)` | 找子串，**返回位置或 false** | `strpos("hello","l")` → `2` |
| `str_contains` | 是否包含（PHP 8） | `str_contains("hello","ell")` → `true` |
| `str_starts_with` / `str_ends_with` | 前缀/后缀（PHP 8） | `true` / `true` |
| `implode($glue,$arr)` | 数组拼字符串 | `implode("-",["a","b"])` → `"a-b"` |
| `explode($sep,$s)` | 字符串切数组 | `explode(",","a,b,c")` → `["a","b","c"]` |
| `str_repeat($s,$n)` | 重复 | `str_repeat("ab",2)` → `"abab"` |
| `str_pad($s,$len,$pad,$type)` | 补齐 | `str_pad("5",3,"0",STR_PAD_LEFT)` → `"005"` |
| `strrev` | 反转 | `strrev("abc")` → `"cba"` |
| `sprintf($fmt,...)` | 格式化返回字符串 | `sprintf("%d-%.2f-%s-%05d",42,3.14159,"x",7)` → `"42-3.14-x-00007"` |
| `number_format($n,$dec)` | 千分位 | `number_format(1234567.891,2)` → `"1,234,567.89"` |
| `htmlspecialchars($s)` | 转 HTML 实体（防 XSS） | `"&lt;b&gt;x&lt;/b&gt;"` |
| `nl2br($s)` | 换行转 `<br>` | `"a<br />\nb"` |
| `sprintf` 格式符 | `%d %s %f %.2f %05d %x` | 和 Python/C 类似 |

### 三个注意点

**① `strpos` 返回 0 时的假判断**

```php
$s = "hello";
if (strpos($s, "he") == false) {   // ⚠️ 找到了，但位置是 0，0 == false 为 true
    echo "错误判断：以为没找到";     // ← 实际输出这一句
}
if (strpos($s, "he") === false) {  // ✓ 必须用 ===
    echo "没找到";
} else {
    echo "找到了，位置=" . strpos($s, "he");   // → 找到了，位置=0
}
```
> 这里echo "找到了，位置=" . strpos($s, "he");中的.是拼接运算符,与python中的+一样
> 作用是把两个字符串拼接起来,在这个语句中,右边是数字0,被自动转换成字符串0,然后拼接
  
**② `strlen` 数的是字节，不是字符**

```php
strlen("abc");  // → 3
strlen("中文");  // → 6      ⚠️ UTF-8 一个汉字 3 字节
```

要数字符数得用 `mb_strlen`，但它需要 **mbstring 扩展**：

```php
function_exists("mb_strlen");   // 本机 → false   ⚠️ 没开扩展，调用会 Fatal error
// Fatal error: Uncaught Error: Call to undefined function mb_strlen()
```

注意: **涉及中文长度/截取，先 `function_exists('mb_strlen')` 探一下**，或者在 php.ini 里启用 `extension=mbstring`。
同理 `substr("中文", 0, 1)` 会切出半个汉字变成乱码。

**③ 字符串拼接用 `.` 不用 `+`**

```php
"a" . "b";  // → "ab"
"a" . 1;  // → "a1"     数字会自动转字符串
"a" + 1;  // ⚠️ 报 Warning，结果是 1（把 "a" 转成了 0）
```

---

## 7 运算符

### 算术

| 运算符 | 含义 | 示例 | 结果 |
|---|---|---|---|
| `+` `-` `*` | 加减乘 | `3 * 4` | `12` |
| `/` | **永远浮点** | `7 / 2` | `3.5` |
| `%` | 取余 | `7 % 2` | `1` |
| `**` | 幂 | `2 ** 10` | `1024` |
| `intdiv()` | 整除 | `intdiv(7,2)` | `3` |

⚠️ PHP **没有** `//` 整除运算符（那是 Python）。要整数除法用 `intdiv()`。

### 字符串与赋值

```php
$a = "Hello";
$b = $a . " World";     // . 拼接
$a .= "!";              // .= 追加，等价于 $a = $a . "!"
```

### 比较

| 运算符 | 说明 |
|---|---|
| `==` | 松散相等（**会转类型**） |
| `===` | 严格相等（类型 + 值） |
| `!=` / `<>` | 不等（松散） |
| `!==` | 严格不等 |
| `<=>` | 飞船运算符：左小返回 -1，相等 0，左大 1 |

```php
1 <=> 2;  // → -1
2 <=> 2;  // → 0
3 <=> 2;  // → 1
```

`<=>` 主要给 `usort` 写排序回调用。

### 逻辑

| 运算符 | 说明 |
|---|---|
| `&&` / `and` | 与 |
| `\|\|` / `or` | 或 |
| `!` | 非 |
| `xor` | 异或 |

⚠️ **PHP 的逻辑运算符返回真正的 bool**（不像 JS/Python 返回操作数）：

```php
var_dump(0 or "x");    // → bool(true)   不是 "x"！
var_dump(true and false);   // → bool(false)
```

⚠️ **`and` / `or` 的优先级低于 `=`**，这是经典陷阱：

```php
$r = true and false;    // $r 是 true！等价于 ($r = true) and false
$r = (true and false);  // $r 才是 false
$r = true && false;     // $r 是 false（&& 优先级高于 =）
```

**结论：赋值时一律用 `&&` / `||`，`and` / `or` 只在 `if` 条件里用。**

### 空合并与三元

```php
$v = $arr["k"] ?? "默认";        // 未定义或 null → 默认值（不报警告）
$v = $x ?: "默认";               // $x 为假值（含 "" 和 0）→ 默认值
$v = $ok ? "是" : "否";          // 普通三元
$v = $a ?? $b ?? $c ?? "最后默认";   // 可以链式
```

⚠️ `?:` 会把 `0` 和 `"0"` 也当成假，如果合法值是 0 就用 `??` 而不是 `?:`。

### 自增自减与位运算

```php
$i = 5;
$i++;        // 后置：先取值再加
++$i;        // 前置：先加再取值
```

位运算：`&` `|` `^` `~` `<<` `>>`，用途和 C 一样（标志位、加密）。

### 优先级

不确定就加括号。有一个**版本陷阱**值得知道：**PHP 8 起 `.`（拼接）的优先级低于 `+`**。

```php
"总数：" . 1 + 2;
// PHP 8：先算 1+2，得 "总数：3"
// PHP 7：先拼接（同优先级、从左往右），等价于 ("总数：" . 1) + 2，得 2，还带个警告
```

同一个表达式在两个版本里结果完全不同。**涉及拼接和算术混写，一律加括号**：`"总数：" . (1 + 2)`。
