---
title: "php基础语法 part1"
description: "主要内容是php的基础语法"
pubDate: 2026-11-21T15:55
tags: [php基础]
---

# PHP（基础篇）· part1 基础语法一

---

## 目录

| 章节 | 文件 | 章节 | 文件 |
|---|---|---|---|
| 1 认识 PHP 与运行方式 | [php-part1](../php-part1/) | 10 循环 | [php-part4](../php-part4/) |
| 2 基本语法与输出 | [php-part1](../php-part1/) | 11 函数 | [php-part5](../php-part5/) |
| 3 变量与作用域 | [php-part1](../php-part1/) | 12 类与对象 | [php-part5](../php-part5/) |
| 4 数据类型与类型比较 | [php-part2](../php-part2/) | 13 超全局变量与表单 | [php-part6](../php-part6/) |
| 5 常量与魔术常量 | [php-part2](../php-part2/) | 14 文件包含与文件读写 | [php-part6](../php-part6/) |
| 6 字符串 | [php-part3](../php-part3/) | 15 常见报错对照表 | [php-part7](../php-part7/) |
| 7 运算符 | [php-part3](../php-part3/) | 附 一页速查 | [php-part7](../php-part7/) |
| 8 条件控制 | [php-part4](../php-part4/) | 还没学的部分 | [php-part7](../php-part7/) |
| 9 数组 | [php-part4](../php-part4/) | | |

---

## 1 认识 PHP 与运行方式

PHP 是**服务端**脚本语言：代码在服务器上执行，浏览器只看到最后生成的 HTML。

```php
<!DOCTYPE html>
<html>
<body>
<h1>我的第一个 PHP</h1>
<?php
echo "Hello World!";
?>
</body>
</html>
```

### 三种运行方式

| 方式 | 命令 | 适合 |
|---|---|---|
| 命令行（CLI） | `php demo.php` | 学语法、写脚本、跑测试 |
| 内置服务器 | `php -S localhost:8000` | 调试网页，不用装 Apache |
| 集成环境 | XAMPP / phpStudy 启动 Apache | 完整网站开发 |

```bash
php demo.php            # 运行
php -l demo.php         # 只检查语法，不执行
php -v                  # 看版本
```

`php -l` 的输出：

```
No syntax errors detected in demo.php      # 语法没问题
Parse error: syntax error, unexpected end of file, expecting "," or ";" ...
Errors parsing demo.php                    # 有语法错
```

⚠️ **文件必须是 `.php` 扩展名**，且要经过 Web 服务器（或 CLI）解析。直接双击用浏览器打开 `.php` 文件只会看到源码。

⚠️ **文件不要存成带 BOM 的 UTF-8**。BOM 会被当成输出内容，网页上表现为页面顶部多一行空白、报 `headers already sent`，而且会让 `declare(strict_types=1)` 直接失效：

```
Fatal error: strict_types declaration must be the very first statement in the script
```

⚠️ PHP 版本差异很大，本机是 **8.5**。网上老教程大量是 PHP 5/7 的写法，`==` 比较、`match`、属性提升、`str_contains` 这些都不一样，抄之前先看版本。

---

## 2 基本语法与输出

### 代码必须包在 \<?php...?> 里

```php
<?php
// 这里面是 PHP 代码
echo "hello";
?>

<?= "这句是 <?= 的简写" ?>
```

`<?= $x ?>` 等价于 `<?php echo $x; ?>`，模板文件里非常常用。

⚠️ **PHP 语句必须以分号 `;` 结尾**（最后一行可以省略，但建议都写）。少一个分号就是 `Parse error`。

### 注释

```php
// 单行注释
# 也是单行注释（少用）
/* 多行
   注释 */
```

### echo / print / var_dump

```php
echo "Hello", " ", "World", "\n";   // → Hello World    echo 可以接多个参数，无返回值
print "print 也行\n";                // → print 也行     print 只能接一个参数，返回 1
$r = print "x";                      // $r 是 1
```

| 写法 | 特点 | 用途 |
|---|---|---|
| `echo` | 可多参数，无返回值，最快 | 输出内容 |
| `print` | 单参数，返回 1 | 几乎不用 |
| `print_r($v)` | 打印数组/对象，可读 | 调试数组 |
| `var_dump($v)` | 打印**类型 + 值 + 长度** | 调试类型问题（最好用） |

```php
var_dump(1, 1.5, "a", true, null, [1, 2]);
// → int(1) float(1.5) string(1) "a" bool(true) NULL array(2) { ... }
```

⚠️ `var_dump` 显示的 `string(1) "a"` 里那个 `1` 是**字节数**，不是字符数。中文会是 `string(6) "中文"`（UTF-8 一个汉字 3 字节）。

⚠️ 调试完记得把 `var_dump` 删掉——它会在页面上直接输出，用户都能看见。

### 与 HTML 混排

```php
<?php $name = "小明"; ?>
<h1>你好，<?= $name ?></h1>
<ul>
<?php foreach ([1, 2, 3] as $n): ?>
    <li><?= $n ?></li>
<?php endforeach; ?>
</ul>
```

`foreach: ... endforeach;` 这种「替代语法」在模板里比大括号清爽，看到要认识。

---

## 3 变量与作用域

### 变量必须带 $

```php
$name = "小明";
$age = 18;
echo $name, $age;
```

**命名规则**：字母/数字/下划线，不能数字开头，**区分大小写**（`$Name` 和 `$name` 是两个变量）。

⚠️ **`$` 不能省**。写 `name = "x"` 是语法错误；写 `echo $Name`（大小写不对）会得到一个「未定义变量」的警告，值当空字符串处理。

### 弱类型：变量类型随时能变

```php
$x = 10;        // 现在是 int
$x = "text";    // 变成 string，不需要声明
var_dump($x);   // → string(4) "text"
```

这比 C/Java 省事，但也意味着**类型错误只在运行时暴露**。

### 未定义变量（PHP 8 会警告）

```php
echo $undefinedVar;
// Warning: Undefined variable $undefinedVar
// 结果：输出空字符串，程序继续跑
```

⚠️ PHP 8 起未定义变量/数组键/对象属性都是 **Warning 而不是 Fatal**，程序会继续执行但值不对——这类 bug 最难查，因为页面只是「某处空白了」。

### 作用域

```php
$g = 100;                    // 全局

function f() {
    echo $g;                 // ✗ 拿不到！函数内看不到全局变量
}

function g2() {
    global $g;               // 用 global 声明后才拿得到
    return $g;
}

function counter() {
    static $n = 0;           // 静态变量：多次调用共享，只初始化一次
    $n++;
    return $n;
}

counter(); counter(); counter();   // → 1, 2, 3
```

⚠️ **函数内部默认访问不到全局变量**，这一点和 Python 的「能读不能改」不同——PHP 里是「读也读不到」，必须 `global`。
⚠️ 别滥用 `global`，会让函数依赖隐藏状态。更推荐把值当参数传进去。

### 判断变量是否存在 / 是否为空（超高频）

| 写法 | 含义 |
|---|---|
| `isset($v)` | 变量存在**且不为 null**   -> 返回true |
| `empty($v)` | `0`、`"0"`、`""`、`null`、`[]`、`false`、未定义 → 都为 true |
| `$v ?? 默认值` | 未定义或为 null 时取默认值（不报警告） |
| `@$v` | 抑制警告（不推荐，会掩盖问题） |

```php
var_dump(empty(""), empty("0"), empty(0), empty("0.0"), empty([]), empty(null), empty(" "));
// → true true true false true true false     ⚠️ "0.0" 和 " " 都不是空

$arr = ["a" => null];
var_dump(isset($arr["a"]));              // → false   ⚠️ 值是 null 时 isset 为 false
var_dump(array_key_exists("a", $arr));   // → true    这个才是"键存不存在"

$opt = [];
echo $opt["x"] ?? "默认值";        // → 默认值
```

⚠️ `empty($v)` 对 `"0"` 返回 **true**，这是 PHP 的历史遗留。判断「用户是不是什么都没填」不要用 `empty`，用 `isset($v) && $v !== ""`。

⚠️ `??` 只判 `null` 和「未定义」，`$v = ""` 时 `$v ?? "默认"` 仍然是 `""`。要连空字符串一起替换，用 `$v ?: "默认"`。
