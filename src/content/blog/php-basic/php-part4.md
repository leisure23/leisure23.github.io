---
title: "php基础语法 part4"
description: "主要内容是php的基础语法"
pubDate: 2026-11-21T16:04
tags: [php基础]
---

# PHP（基础篇）· part4 数据结构

> [← php-part3 字符串与运算符](../php-part3/) · [总目录](../php-part1/#目录) · [下一份 php-part5 函数与类](../php-part5/) →

---

## 8 条件控制

```php
$score = 85;
if ($score >= 90) {
    echo "A";
}
elseif ($score >= 80) {      // → 执行这里，输出 B
    echo "B";
}
else {
    echo "C";
}
```

⚠️ PHP 写 `elseif`（一个词）或 `else if`（两个词）都可以，但 `elseif` 更常用。

⚠️ 条件里不要写 `if ($x = 1)`（赋值），这是最贵的错字，而且 PHP 只当普通赋值不报错。

### switch（松散比较）

```php
switch ("2") {
    case 1:
        echo "one";
        break;
    case 2:
        echo "two(loose)";     // → 输出这个！"2" 松散等于 2
        break;
    default:
        echo "other";
}
```

⚠️ `switch` 用的是 **`==` 松散比较**，`"2"` 会命中 `case 2`。
⚠️ **忘写 `break` 会穿透**，从命中的 case 一直执行到底。故意利用穿透时（多个 case 共用逻辑）要写注释。

```php
switch (99) {
    case 1: echo "no"; break;
}
// 没有匹配也没有 default → 什么都不输出，不报错
```

### match（PHP 8 新增，推荐）

```php
$r = match(2) {
    1 => "one",
    2 => "two",
    default => "other",
};
// → "two"
```

和 `switch` 的区别：

| | `switch` | `match` |
|---|---|---|
| 比较方式 | 松散 `==` | **严格 `===`** |
| 返回值 | 无 | **有**，能直接赋值 |
| 忘记写 break | 会穿透 | 不需要 break |
| 必须匹配 | 不需要 | 没有 `default` 且没命中会抛错 |

### 三元

```php
$age = 20;
echo $age >= 18 ? "adult" : "minor";   // → adult
```

⚠️ 三元别嵌套超过一层，`$a ? $b : $c ? $d : $e` 在 PHP 8 里已经需要加括号，可读性也崩了。

---

## 9 数组

PHP 的数组是**万能容器**：既是列表，也是字典，还能嵌套成多维。这是 PHP 最有特色的地方。

### 两种写法

```php
$list = [1, 2, 3];                       // 索引数组（下标 0,1,2 自动分配）
$dict = ["name" => "小明", "age" => 18];  // 关联数组（键值对）

$a = array(1, 2, 3);                     // 老式写法，等价于 [1,2,3]
```

### 访问与修改

```php
$a = [1, 2, 3];
echo $a[0];              // → 1        下标从 0 开始

$a[] = 4;                // 追加到末尾（不写下标就是追加）
echo $a[3];              // → 4

$d = ["name" => "小明"];
echo $d["name"];         // → 小明
$d["age"] = 18;          // 新增键

unset($a[0]);            // 删除元素
var_dump($a);            // → [1]=>2 [2]=>3 [3]=>4   ⚠️ 键不会重排！
```

⚠️ **`unset` 之后数组的键是「断裂」的**，`$a[0]` 已经不存在了。要重新编号用 `array_values($a)`。

### 键的规则（有坑）

```php
$m = ["1" => "a", 2 => "b", true => "c"];
var_dump($m);
// → [1] => "c"
//   [2] => "b"

$n = [];
$n["7"] = "x";
var_dump(array_keys($n));   // → [0] => int(7)    ⚠️ 键从字符串 "7" 变成了 int 7
```

⚠️ **数字字符串会自动转成 int 键**（`"7"` → `7`，`"01"` 不会转因为不是规范数字）。
⚠️ `true` 会转成 int `1`，`false` → `0`，`null` → `""`，浮点会被截断。

### 增删改查常用函数

| 函数 | 作用 | 示例 → 结果 |
|---|---|---|
| `count($a)` | 元素个数 | `count([1,2,3])` → `3` |
| `array_push($a,$v)` | 末尾追加（返回长度） | 直接用 `$a[] = $v` 更快 |
| `array_pop($a)` | 弹出末尾（返回值） | `array_pop([1,2,3])` → `3` |
| `array_unshift($a,$v)` | 开头插入 | 键会重排 |
| `array_shift($a)` | 弹出开头 | 键会重排 |
| `array_keys($a)` | 所有键 | `["name","age"]` |
| `array_values($a)` | 所有值 | `["小明",18]` |
| `in_array($v,$a,$strict)` | 值是否在数组里 | `in_array(2,[1,2,3])` → `true` |
| `array_search($v,$a)` | 找值返回键 | `array_search(2,[1,2,3])` → `1` |
| `array_key_exists($k,$a)` | 键是否存在 | |
| `array_merge($a,$b)` | 合并 | `array_merge([1,2],[3])` → `[1,2,3]` |
| `array_slice($a,$start,$len)` | 截取一段 | `array_slice([1,2,3,4],1,2)` → `[2,3]` |
| `array_reverse($a)` | 反转 | `[3,2,1]` |
| `array_sum($a)` | 求和 | `array_sum([1,2,3])` → `6` |
| `array_unique($a)` | 去重 | ⚠️ **保留原键** |
| `array_filter($a,$fn)` | 过滤 | ⚠️ **保留原键** |
| `array_map($fn,$a)` | 逐个处理 | `array_map(fn($x)=>$x*2,[1,2])` → `[2,4]` |
| `array_combine($keys,$vals)` | 键值组合 | `["a"=>1,"b"=>2]` |
| `array_flip($a)` | 键值互换 | `[1=>"a"]` |
| `array_column($rows,$col)` | 取某一列 | `["A","B"]` |
| `array_pad($a,$n,$v)` | 补齐长度 | `array_pad([1],3,0)` → `[1,0,0]` |
| `range($start,$end,$step)` | 生成范围 | `range(1,10,3)` → `[1,4,7,10]` |
| `max($a)` / `min($a)` | 最大/最小 | 也可 `max(1,5,3)` → `5` |

### ⚠️ in_array 的松散比较

```php
in_array(2, [1,2,3]);  // → true
in_array("2", [1,2,3]);  // → true    ⚠️ 松散比较，"2" 等于数字 2
in_array("2", [1,2,3], true);  // → false   第三个参数 true = 严格比较
```

**结论：判断值存在时强烈建议加第三个参数 `true`**，否则 `"1abc"` 也可能匹配到 `1`。

### ⚠️ array_unique / array_filter 会保留原键

```php
array_unique([1,1,2,2,3]);
// → [0]=>1  [2]=>2  [4]=>3      ⚠️ 键是 0、2、4，不是 0、1、2

array_filter([1,2,3,4], fn($x) => $x % 2 == 0);
// → [1]=>2  [3]=>4              ⚠️ 键是 1、3
```

需要连续下标时包一层 `array_values()`：`array_values(array_unique($a))`。

### 数组排序函数（容易搞混，重点记）

| 函数 | 排序依据 | 是否保留键 |
|---|---|---|
| `sort($a)` | 按**值**升序 | ✗ 键重排 |
| `rsort($a)` | 按值降序 | ✗ 键重排 |
| `asort($a)` | 按值升序 | ✓ **保留键**（关联数组用） |
| `arsort($a)` | 按值降序 | ✓ 保留键 |
| `ksort($a)` | 按**键**升序 | ✓ |
| `krsort($a)` | 按键降序 | ✓ |
| `usort($a,$fn)` | 自定义比较 | ✗ 键重排 |
| `uasort($a,$fn)` | 自定义比较 | ✓ 保留键 |

```php
$s = [3, 1, 2];
sort($s);
var_dump($s);      // → [0]=>1 [1]=>2 [2]=>3

$k = ["b" => 2, "a" => 1];
asort($k);         // 按值排
var_dump($k);      // → ["a"]=>1 ["b"]=>2
ksort($k);         // 按键排
var_dump($k);      // → ["a"]=>1 ["b"]=>2

usort($s, fn($x, $y) => $y <=> $x);   // 降序
var_dump($s);      // → [3, 2, 1]
```

⚠️ **`sort()` 返回的是 `bool`，不是排好的数组**！

```php
$a = [3, 1, 2];
$b = sort($a);      // $b 是 true，$a 被原地排序
// ✗ 千万不要写 $a = sort($a);  这样 $a 会变成 true
```

⚠️ **默认排序区分大小写**，大写字母排在小写前面：

```php
sort(["banana", "apple", "Cherry"]);
// → ["Cherry", "apple", "banana"]     ⚠️ Cherry 跑到最前面了

sort($arr, SORT_FLAG_CASE | SORT_STRING);   // 忽略大小写
// → ["apple", "banana", "Cherry"]
```

### 多维数组

```php
$m = [
    [1, 2, 3],
    [4, 5, 6],
];
echo $m[1][0];      // → 4      第一层是行，第二层是列

$users = [
    ["name" => "A", "age" => 18],
    ["name" => "B", "age" => 20],
];
echo $users[0]["name"];      // → A
```

⚠️ 取不存在的键只产生 `Warning: Undefined array key`，值是 null，程序继续——所以拼错键名不会报错，只会「静默出错」。

---

## 10 循环

```php
for ($i = 0; $i < 3; $i++) {
    echo $i, " ";          // → 0 1 2
}

$i = 0;
while ($i < 3) {
    echo $i, " ";
    $i++;
}

$i = 0;
do {
    echo $i, " ";          // → 0   先执行一次，再判断
    $i++;
} while ($i < 0);
```

### foreach（PHP 最常用，必须熟练）

```php
// ① 只取值
foreach ([1, 2] as $v) {
    echo $v;               // → 12
}

// ② 同时取键和值（关联数组必用）
foreach (["a" => 1] as $k => $v) {
    echo "$k=$v";          // → a=1
}

// ③ 按引用遍历，才能修改原数组
$arr = [1, 2];
foreach ($arr as $v) {
    $v = $v * 10;          // 改的是副本
}
var_dump($arr);            // → [1, 2]    没变

foreach ($arr as &$v) {
    $v = $v * 10;          // 引用，改的就是原数组
}
unset($v);                 // ⚠️ 必须 unset，否则后面复用 $v 会改坏数组最后一个元素
var_dump($arr);            // → [10, 20]
```

⚠️ **`foreach` 按值遍历改不动原数组**，这是「为什么我改了但没生效」的头号原因。
⚠️ **按引用遍历后一定要 `unset($v)`**，否则 `$v` 仍然指向最后一个元素，下次 `foreach` 会串味。

### 解构（配合 foreach 遍历二维数组）

```php
$pairs = [[1, 2], [3, 4]];
foreach ($pairs as [$a, $b]) {
    echo "$a-$b ";          // → 1-2 3-4
}
```

### break / continue

```php
for ($i = 0; $i < 5; $i++) {
    if ($i == 2) continue;   // 跳过本次
    if ($i == 4) break;      // 结束整个循环
    echo $i, " ";            // → 0 1 3
}
```

⚠️ PHP 的 `break` 和 `continue` 可以带**层数**，一次跳出多层循环：

```php
for ($i = 0; $i < 3; $i++) {
    for ($j = 0; $j < 3; $j++) {
        if ($j == 1) break 2;    // 直接跳出两层
        echo "$i$j ";            // → 00
    }
}
```

### 两个模板

```php
// 1 到 100 求和
$sum = 0;
for ($i = 1; $i <= 100; $i++) $sum += $i;
echo $sum;                        // → 5050

// 遍历数组累加（更 PHP 的写法）
echo array_sum([1, 2, 3]);        // → 6
```
