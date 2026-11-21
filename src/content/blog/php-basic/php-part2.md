---
title: "php基础语法 part2"
description: "主要内容是php的基础语法"
pubDate: 2026-11-21T15:58
tags: [php基础]
---

# PHP（基础篇）· part2 基础语法二

> [← php-part1 基础语法一](../php-part1/) · [总目录](../php-part1/#目录) · [下一份 php-part3 字符串与运算符](../php-part3/) →

---

## 4 数据类型与类型比较

### 八种类型

| 分类 | 类型 | 说明 |
|---|---|---|
| 标量 | `int` | 整数 |
| 标量 | `float` | 浮点（**gettype 里叫 "double"**） |
| 标量 | `string` | 字符串 |
| 标量 | `bool` | `true` / `false` |
| 复合 | `array` | 数组（PHP 的数组同时充当列表 + 字典 + 映射） |
| 复合 | `object` | 对象 |
| 特殊 | `null` | 空值 |
| 特殊 | `resource` | 资源（文件句柄、数据库连接） |

```php
var_dump(1);        // → int(1)
var_dump(1.5);      // → float(1.5)
var_dump("a");      // → string(1) "a"
var_dump(true);     // → bool(true)
var_dump(null);     // → NULL
var_dump([1, 2]);   // → array(2) { [0]=> int(1) [1]=> int(2) }

gettype(1.5);       // → "double"    ⚠️ float 的类型名是 double
```

类型判断函数：`is_int()`、`is_float()`、`is_string()`、`is_bool()`、`is_array()`、`is_null()`、`is_numeric()`。

- is_numeric()作用是判断参数是否为**数字类型或者数字字符串**,如果是,返回true

```php
var_dump(is_numeric("12"), is_numeric("12a"), is_numeric("1.5"));
// → true false true      
// ⚠️ "12a" 不是数字字符串，但 "12abc" + 1 仍然能算出 13, 取前导数字在加上后面的数字12+1=13
```

### 类型转换

```php
(int)"12abc";  // → 12     从前面的数字开始截
(int)"abc";  // → 0      完全是文字就变 0
(int)3.99;  // → 3      截断，不四舍五入
(float)"3.5";  // → 3.5
(string)100;  // → "100"
(string)1.0;  // → "1"    ⚠️ 1.0 转字符串会把 .0 去掉
```

**转 bool 的规则（记住"哪些是假"就够了）**：

```php
var_dump((bool)0, (bool)"0", (bool)"", (bool)"0.0", (bool)"false", (bool)[]);
// → false false false true true false
```

⚠️ 假值只有：`0`、`0.0`、`"0"`、`""`、`null`、`false`、`[]`、未定义。  

**`"0.0"`、`"false"`、`" "` 都是真**——这和很多语言不一样。

⚠️ 数字字符串参与运算：

```php
var_dump("12abc" + 1);
// Warning: A non-numeric value encountered
// → int(13)     ⚠️ 只警告不报错，悄悄算出 13
```

### == 和 ===

- `==` **松散比较**：先转类型再比。
- `===` **严格比较**：类型和值都相同才为 true。

```php
1 == "1";  // → true     ⚠️ 类型不同也相等
1 === "1";  // → false
0 === false;  // → false
null == false;  // → true
null === false;  // → false
```

**PHP 8 改了字符串和数字的比较规则**（这是从老教程迁移过来最容易踩的）：

```php
"abc" == 0;  // → false   ⚠️ PHP 7 里是 true！
"" == 0;  // → false   ⚠️ PHP 7 里是 true！
"1" == "01";  // → true    两个数字字符串按数值比
"10" == "1e1";  // → true    10 == 10.0
100 == "1e2";  // → true
"1" == "1 ";  // → true    末尾空格会被忽略
```

**结论：判等一律用 `===`**，只有确实想「数字字符串也算」时才用 `==`。

### 整数、浮点与溢出

```php
7 / 2;  // → 3.5    ⚠️ 除号永远返回浮点
7 % 2;  // → 1
-7 % 2;  // → -1     余数符号跟着被除数
intdiv(7, 2);  // → 3      整除（向零截断）
intdiv(-7, 2);  // → -3
2 ** 10;  // → 1024     幂运算

PHP_INT_MAX;  // → 9223372036854775807
PHP_INT_MAX + 1;  // → float(9.223372036854776E+18)   ⚠️ 溢出自动变 float，不报错

0.1 + 0.2;  // → 0.30000000000000004
0.1 + 0.2 == 0.3;  // → false      ⚠️ 浮点不能用 == 比
round(0.1 + 0.2, 2);  // → 0.3      保留两位小数,但是0.30和0.3一样,所以结果是0.3
```

数字字面量：`0x1A` = 26（十六进制）、`0o17` = 15（八进制）、`0b1010` = 10（二进制）、`1_000_000`（下划线分隔，PHP 7.4+）。

### 类型声明与严格模式（了解）

```php
function addInt(int $a, int $b): int { return $a + $b; }

addInt("5", "6");   // → 11     非严格模式下数字字符串会被转成 int
addInt("5x", 6);    // → Fatal error: Uncaught TypeError: addInt(): Argument #1 ($a)
                    //   must be of type int, string given
```

文件第一行加 `declare(strict_types=1);` 后，`addInt("5","6")` 也会直接抛 `TypeError`。

⚠️ `declare(strict_types=1)` **必须是文件里第一条语句**（前面不能有任何输出，连 BOM 都不行）。

---

## 5 常量与魔术常量

```php
define("PI", 3.14);      // 函数方式，运行时定义，可在 if 里
const NAME = "php";      // 语法方式，编译期定义，可写在类里
echo PI, NAME;
```

| | `define()` | `const` |
|---|---|---|
| 定义位置 | 任意位置（含 if/for 内） | 只能顶层/类内，不能放 if 里 |
| 能否用表达式 | 可以 | 可以（PHP 5.6+） |
| 类常量 | 不能 | 能 |

⚠️ **常量名前面不加 `$`**：`echo PI` 正确，`echo $PI` 是变量。

⚠️ 常量一旦定义**不能再改、不能重新定义**，改它只会产生警告。

### 魔术常量（双下划线，会自动变化）

| 常量 | 值 |
|---|---|
| `__LINE__` | 当前行号（调试常用） |
| `__FILE__` | 当前文件完整路径 |
| `__DIR__` | 当前文件所在目录（**最常用，拼路径必用**） |
| `__FUNCTION__` | 当前函数名（不在函数里时是空字符串） |
| `__CLASS__` | 当前类名 |

```php
var_dump(__LINE__);   // → int(160)   实际行号
var_dump(__DIR__);

// 拼路径的标准写法，下面这个判断永远为 true
__FILE__ === __DIR__ . DIRECTORY_SEPARATOR . basename(__FILE__);
```

⚠️ 拼路径一律用 `__DIR__ . "/xxx.php"`，**不要**用相对路径 `"xxx.php"`。相对路径是相对「当前工作目录」，从不同入口运行会指向不同地方，这是「明明有这文件却 require 失败」的头号原因。
