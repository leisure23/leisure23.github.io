---
title: "php基础语法 part7"
description: "主要内容是php的基础语法"
pubDate: 2026-11-21T16:56
tags: [php基础]
draft: true
---

# PHP 精简笔记（基础篇）· part7 报错对照与速查

> [← php-part6 表单与文件](../php-part6/) · [总目录](../php-part1/#目录)

---

## 15 常见报错对照表

以下全是本机 PHP 8.5 的**真实报错原文**，复习时直接对照搜索。

### 解析错误（语法问题，`php -l` 就能查）

| 报错 | 原因 | 修法 |
|---|---|---|
| `Parse error: syntax error, unexpected end of file, expecting "," or ";"` | 少分号/少右括号 | 看报错行**附近**，尤其是上一行 |
| `Parse error: syntax error, unexpected string content "", expecting "-" or identifier...` | 双引号里用了 `$arr['k']` | 改成 `"{$arr['k']}"` |
| `Parse error: unexpected 'xxx'` | 关键字拼错、中文标点 | 检查是不是用了中文的 `，` `；` |
| `Fatal error: strict_types declaration must be the very first statement` | `declare` 前面有输出（含 BOM） | 删掉 BOM，`declare` 放第一行 |

### 警告（程序继续跑，但值不对）

| 报错 | 原因 | 修法 |
|---|---|---|
| `Warning: Undefined variable $x` | 变量没定义/拼错 | 先赋值，或用 `$x ?? 默认` |
| `Warning: Undefined array key 5` | 键不存在 | 用 `??` 或 `array_key_exists` |
| `Warning: Undefined property: stdClass::$nope` | 对象属性不存在 | 用 `$o->p ?? null` 或 `property_exists` |
| `Warning: A non-numeric value encountered` | 用数字去加非数字字符串 | 先 `(int)` 转或校验 |
| `Deprecated: Optional parameter $b declared before required parameter $c` | 默认值参数放在了必填参数前面 | 调整参数顺序 |
| `Warning: include(): Failed opening ...` | 包含的文件路径不对 | 用 `__DIR__ . "/x.php"` |

### 致命错误（程序停止）

| 报错 | 原因 | 修法 |
|---|---|---|
| `Fatal error: Uncaught Error: Call to undefined function mb_strlen()` | 扩展没开（mbstring） | php.ini 启用，或改用 `strlen` |
| `Fatal error: Uncaught Error: Cannot access private property` | 外部访问私有属性 | 提供 getter 方法 |
| `Fatal error: Uncaught Error: Cannot access protected property` | 外部访问受保护属性 | 同上 |
| `Fatal error: Uncaught Error: Typed property X::$a must not be accessed before initialization` | 类型化属性没赋初值 | 给默认值或写 `?int $a = null` |
| `Fatal error: Uncaught TypeError: ... must be of type int, string given` | 类型不匹配（严格模式/非数字字符串） | 传对类型，或先转换 |
| `Fatal error: Uncaught Error: Failed opening required ...` | `require` 的文件不存在 | 检查路径，先 `include` 试 |
| `Fatal error: Uncaught Error: Class "X" not found` | 类没定义/没 require 进来 | 写 `require_once` 或检查命名空间 |
| `Fatal error: Uncaught Error: Object of class X could not be converted to string` | 对象直接当字符串用 | 实现 `__toString()` |

### 逻辑错误（能跑但结果不对）

按这个顺序查：

1. **是不是该用 `===` 却用了 `==`**（`1 == "1"`、`"abc" == 0`）
2. **`strpos` 的返回值**用 `=== false` 判断了吗
3. **`foreach` 想改原数组**是不是漏了 `&`
4. **`sort()` 的返回值**是不是被赋值了（它返回 bool）
5. **数组键**有没有被 `unset` 打乱、`array_filter` 保留了原键
6. **变量作用域**：函数里访问全局变量有没有 `global`
7. **`empty()`** 把合法的 `"0"` 当成空了没有
8. **字符串拼接**是不是误用了 `+`

**调试手段**：`var_dump()` 打变量（看类型+值）、`error_reporting(E_ALL)` + `ini_set('display_errors', 1)` 打开全部报错、`php -l` 先过一遍语法。

---

## 附：一页速查

```php
// ---------- 骨架 ----------
<?php
$var = 1;
echo "值：$var\n";
?>

// ---------- 输出调试 ----------
echo $a, $b;         print $a;
var_dump($a);        print_r($arr);

// ---------- 变量与判断 ----------
$v ?? "默认"          // 未定义/null 时用默认
isset($v)            // 存在且非 null
empty($v)            // 0 "" "0" null [] false 都为 true
is_int is_string is_array is_numeric

// ---------- 类型转换 ----------
(int)  (float)  (string)  (bool)  (array)
intval()  floatval()  strval()

// ---------- 比较 ----------
== 松散（会转类型）      === 严格（推荐）
!=  !==  <=>          <=> 返回 -1/0/1

// ---------- 算术 ----------
7 / 2 = 3.5            // 总是浮点
intdiv(7, 2) = 3       // 整除
7 % 2 = 1              // 取余，-7 % 2 = -1
2 ** 10 = 1024

// ---------- 字符串 ----------
$a . $b                拼接
"插值 $var"            双引号才插值
"{$arr['k']}"          取数组/对象必须加 {}
strlen substr str_replace strpos strtoupper strtolower trim
str_pad str_repeat strrev implode explode sprintf number_format
htmlspecialchars        输出用户输入必须转
str_contains / str_starts_with / str_ends_with    // PHP 8

// ---------- 数组 ----------
$list = [1, 2, 3];              $dict = ["k" => "v"];
$list[] = 4;                    $dict["k2"] = "v2";
count in_array(严格加true) array_search array_key_exists
array_push pop shift unshift    array_merge array_slice array_reverse
array_keys array_values array_sum array_map array_filter(fn)
array_unique array_flip array_combine array_column array_pad range
sort rsort asort arsort ksort krsort usort     // sort 返回 bool！

// ---------- 控制流 ----------
if / elseif / else
switch ($x) { case 1: ...; break; default: ...; }
match ($x) { 1 => "a", default => "b" };        // 严格比较，有返回值
for ($i = 0; $i < $n; $i++) { }
while (cond) { }   do { } while (cond);
foreach ($arr as $v) { }
foreach ($arr as $k => $v) { }
foreach ($arr as &$v) { }  unset($v);           // 引用要 unset
break; continue; break 2;

// ---------- 函数 ----------
function f($a, $b = 1) { return $a + $b; }
function f(...$args) { }                        // 可变参数
f(1, c: 3)                                       // 命名参数
function f(&$v) { }                              // 引用传参
fn($x) => $x * 2                                 // 箭头函数
function () use ($v) { }                         // 闭包

// ---------- 类 ----------
class A {
    public $x; private $y = 1; protected $z;
    const V = 1;
    public static $n = 0;
    public function __construct(public int $id = 0) {}
    public function m() { return $this->x; }
    public static function s() { return self::$n; }
}
$a = new A(1);
$a->x;  $a->m();  A::V;  A::$n;  A::s();
class B extends A { public function m() { return parent::m(); } }
abstract class C { abstract public function f(); }
interface I { public function f(); }
class D extends C implements I { public function f() {} }
$a instanceof A;
get_class($a);  method_exists($a, "m");

// ---------- 超全局与表单 ----------
$_GET $_POST $_SERVER["REQUEST_METHOD"] $_FILES $_SESSION $_COOKIE $GLOBALS
if ($_SERVER["REQUEST_METHOD"] === "POST") { $v = $_POST["k"] ?? ""; }
filter_var($email, FILTER_VALIDATE_EMAIL);
filter_var($n, FILTER_VALIDATE_INT);
htmlspecialchars($s, ENT_QUOTES, "UTF-8");

// ---------- 文件 ----------
require_once __DIR__ . "/config.php";
include __DIR__ . "/x.php";
file_get_contents($p)        file_put_contents($p, $s, FILE_APPEND)
file($p, FILE_IGNORE_NEW_LINES)
fopen("r") fgets fclose fwrite
file_exists filesize unlink copy rename mkdir basename dirname
```

---

## 还没学的部分（下一步方向）

| 顺序 | 主题 | 说明 |
|---|---|---|
| 1 | **命名空间 namespace + use** | 项目一大就必须用，不然类名会撞 |
| 2 | **PDO 与预处理语句** | 连数据库的正规做法，重点学 `prepare` + `execute` 防注入 |
| 3 | **Session / Cookie** | 登录状态怎么保持；`session_start()`、会话固定攻击 |
| 4 | **文件上传** | `$_FILES`、`move_uploaded_file`、类型/大小校验（很有安全风险） |
| 5 | **Composer** | PHP 的依赖管理（类似 pip / npm），拉第三方库 |
| 6 | **trait 与 enum** | `trait` 复用方法；`enum`（PHP 8.1）定义有限集合 |
| 7 | **魔术方法进阶** | `__get` `__set` `__call` `__invoke`、`__serialize` |
| 8 | **正则 PCRE** | `preg_match` / `preg_replace`，文本处理 |
| 9 | **JSON 与接口** | `json_encode(json_decode)`，写 API 必备 |
| 10 | **安全** | XSS、CSRF、SQL 注入、密码哈希 `password_hash` |
| 11 | **框架** | Laravel / ThinkPHP，以及 MVC 分层思想 |

补完 1–4 之后，基本就能做一个能登录、能存数据的网站了。
**再之后建议先学 Composer + 一个框架**，而不是继续啃手写原生代码——现代 PHP 岗位基本都是框架开发。
