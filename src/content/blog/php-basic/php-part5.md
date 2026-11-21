---
title: "php基础语法 part5"
description: "主要内容是php的基础语法"
pubDate: 2026-11-21T16:48
tags: [php基础]
---

# PHP（基础篇）· part5 函数与类

> [← php-part4 数据结构](../php-part4/) · [总目录](../php-part1/#目录) · [下一份 php-part6 表单与文件](../php-part6/) →

---

## 11 函数

### 定义与调用

```php
function add($a, $b) {
    return $a + $b;
}

echo add(1, 2);      // → 3
```

- 函数名**不区分大小写**（`add()` 和 `ADD()` 同一个函数），但**变量名区分**。
- 没有 `return` 时返回 `null`。
- 函数不能在调用之后才定义吗？——在同一个文件里可以（PHP 会先编译整个文件），但**在 `if` 里定义的条件函数不行**。

```php
function noReturn() {}
var_dump(noReturn());     // → NULL
```

### 参数默认值

```php
function add2($a, $b = 2) {
    return $a + $b;
}
add2(1);        // → 3
add2(1, 5);     // → 6
```

⚠️ **有默认值的参数必须放在没有默认值的参数后面**，否则 PHP 8 会报 Deprecated：

```
Deprecated: f(): Optional parameter $b declared before required parameter $c
    is implicitly treated as a required parameter
```

### 可变参数

```php
function total(...$nums) {        // 收集成数组
    return array_sum($nums);
}
total(1, 2, 3);                   // → 6

$args = [1, 2, 3];
total(...$args);                  // 反过来：把数组展开成参数
```

### 命名参数（PHP 8）

```php
function named($a, $b = 10, $c = 20) {
    return "$a-$b-$c";
}
named(1, c: 99);        // → "1-10-99"    跳过 $b，直接指定 $c
```

参数多的时候（尤其一堆布尔开关）很好用。

### 引用传参

```php
function byRef(&$v) {
    $v = 99;
}
$q = 1;
byRef($q);
var_dump($q);        // → 99    函数改了外面的变量
```

⚠️ 只有加了 `&` 才能改实参，否则改的是副本（和 C 传指针一个道理，但 PHP 不用自己取地址）。

### 返回值类型与严格模式

```php
function addInt(int $a, int $b): int {
    return $a + $b;
}
```

`declare(strict_types=1);` 放在文件第一行，会让类型检查变严格（见 [php-part2 第 4 章](../php-part2/)）。

### 闭包与箭头函数

```php
$factor = 3;

$f = function ($x) use ($factor) {     // 闭包要 use 才能拿到外部变量
    return $x * $factor;
};
echo $f(2);                             // → 6

$g = fn($x) => $x * $factor;            // 箭头函数（PHP 7.4+）自动捕获外部变量
echo $g(2);                             // → 6
```

⚠️ 箭头函数只能写**一个表达式**，多行逻辑还是用 `function`。

### 作用域与静态

```php
function counter() {
    static $n = 0;      // 只初始化一次，跨调用保留
    $n++;
    return $n;
}
counter(); counter(); counter();   // → 1 2 3
```

---

## 12 类与对象

PHP 的面向对象和 Java/C++ 很像，但有几个 PHP 特有的写法。

### 最简单的类

```php
class User
{
    public $name;                    // 属性（要写可见性，PHP 8 建议写类型）
    private $password = "secret";    // 外部和子类不能访问
    protected $role = "user";        // 外部不能访问
    const VERSION = "1.0";
    public static $count = 0;

    public function __construct($name)     // 构造函数
    {
        $this->name = $name;               // $this 指当前对象
        self::$count++;                    // 访问静态属性用 self::
    }

    public function greet()                // 方法
    {
        return "你好，{$this->name}\n";
    }

    public function getPassword()
    {
        return $this->password;            // 内部可以访问 private
    }

    public static function total()
    {
        return self::$count;
    }
}

$u = new User("小明");        // 实例化
echo $u->greet();             // → 你好，小明
echo $u->name;                // → 小明      外部访问 public 属性用 ->
echo $u->getPassword();       // → secret
echo User::VERSION;           // → 1.0       类常量
echo User::$count;            // → 1         静态属性
echo User::total();           // → 1         静态方法
```

要点：

- 属性/方法**必须写可见性关键字**（`public`/`private`/`protected`），不写默认 `public`。
- 属性和方法都用 `->` 访问（不是 `.`），**属性名不带 `$`**：`$u->name` 而不是 `$u->$name`。
- 静态成员用 `::`，静态属性要带 `$`：`User::$count`。
- 类名一般首字母大写。

### 可见性

| 关键字 | 谁能访问 |
|---|---|
| `public` | 任何地方 |
| `protected` | 本类 + 子类 |
| `private` | 只有本类 |

```php
$u = new User("x");
echo $u->password;
// Fatal error: Uncaught Error: Cannot access private property User::$password

echo $u->role;
// Fatal error: Uncaught Error: Cannot access protected property User::$role
```

⚠️ 访问私有/受保护成员是**致命错误（`Error`）**，会直接中断程序，不是警告。

### 属性提升（PHP 8，能少写一半代码）

```php
class Point
{
    // 直接在构造函数参数上声明属性，不用再写属性 + 赋值
    public function __construct(public int $x = 0, public int $y = 0) {}

    public function str(): string
    {
        return "({$this->x},{$this->y})";
    }
}

$p = new Point(1, 2);
echo $p->str();      // → (1,2)
$p->x = 9;
echo $p->str();      // → (9,2)
```

### 继承与重写

```php
class Animal
{
    public function __construct(public string $name) {}

    public function speak(): string { return "..."; }

    public function intro(): string
    {
        return "我是" . $this->name . "，" . $this->speak();
    }
}

class Dog extends Animal                  // extends 继承
{
    public function speak(): string { return "汪汪"; }        // 重写父类方法

    public function intro(): string
    {
        return "[子类] " . parent::intro();   // parent:: 调用父类版本
    }
}

$d = new Dog("旺财");
echo $d->speak();     // → 汪汪
echo $d->intro();     // → [子类] 我是旺财，汪汪
var_dump($d instanceof Animal);   // → true   子类对象也是父类类型
```

- 子类重写方法时，**参数和返回类型要保持兼容**，否则报错。
- `parent::method()` 调父类实现，`self::` 指本类，`static::` 指运行时实际类。

### 抽象类与接口

```php
abstract class Shape                     // 抽象类：不能直接 new
{
    abstract public function area(): float;          // 抽象方法没有实现
    public function describe(): string
    {
        return "面积是 " . $this->area();
    }
}

interface Jsonable                       // 接口：只定义"必须有什么"
{
    public function toJson(): string;
}

class Circle extends Shape implements Jsonable
{
    public function __construct(private float $r) {}

    public function area(): float { return round(3.14159 * $this->r ** 2, 2); }

    public function toJson(): string
    {
        return json_encode(["r" => $this->r, "area" => $this->area()]);
    }
}

$c = new Circle(2);
echo $c->area();        // → 12.57
echo $c->describe();    // → 面积是 12.57
echo $c->toJson();      // → {"r":2,"area":12.57}
var_dump($c instanceof Jsonable);   // → true
```

区别一句话：**抽象类是「继承」关系（is-a），接口是「能力」约定（can-do）**。一个类只能继承一个父类，但能实现多个接口。

### 魔术方法 __toString

```php
class Money
{
    public function __construct(public int $amount) {}

    public function __toString(): string
    {
        return "¥{$this->amount}";
    }
}

$m = new Money(100);
echo "价格：$m\n";       // → 价格：¥100     对象能直接当字符串用
```

没有 `__toString` 的话，`echo $obj` 会报 `Object of class X could not be converted to string`。

### 对象比较

```php
$m1 = new Money(100);
$m2 = new Money(100);

var_dump($m1 == $m2);    // → true    同一类 + 属性值相同
var_dump($m1 === $m2);   // → false   不是同一个对象
var_dump($m1 === $m1);   // → true
```

⚠️ 对象用 `==` 比较的是「属性是否都相等」，用 `===` 才是「是不是同一个实例」。判等对象一般用 `===`。

### 类型化属性的坑

```php
class Typed
{
    public int $a;          // 声明了类型但没给默认值
    public ?int $b = null;  // 可空要写 ?int
    public string $c = "hi";
}

$t = new Typed();
var_dump($t->b, $t->c);     // → NULL "hi"

var_dump($t->a);
// Fatal error: Uncaught Error: Typed property Typed::$a must not be accessed before initialization
```

⚠️ 类型化属性**没初始化就用会致命报错**（不是返回 null）。给个默认值或者写 `?int $a = null`。

### 其他常用

```php
get_class($obj);           // 取类名
method_exists($obj, "m");  // 方法是否存在
property_exists($obj, "p");
get_object_vars($obj);     // 公有属性转数组
(array) $obj;              // 强制转数组
$obj->nope;                // Warning: Undefined property（是警告，不会崩）
```

⚠️ 静态方法里**不能用 `$this`**（没有具体对象），只能用 `self::`。
