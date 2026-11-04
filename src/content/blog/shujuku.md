---
title: "MySQL数据库基础"
description: 这是一篇数据库基础内容,
pubDate: 2026-11-04
tags: [数据库, MySQL, sql, web]
emoji: "😊"
hue: 255
featured: false
draft: false
---

## 数据库
### 导引
数据库（Database）是按照数据结构来组织、存储和管理数据的仓库。

我们可以把数据存储在文件中,但是读取速度就会很慢,所以，现在我们使用**关系型数据库管理系统**（RDBMS）来存储和管理大数据量。

### RDBMS特点：
1. 数据以表格的形式出现
2. 每行为各种记录名称
3. 每列为记录名称所对应的数据域
4. 许多的行和列组成一张表单
5. 若干的表单组成database

### 关系型数据库
一个关系型数据库由一个或数个表格组成,表格由下面五个部分组成.
1. 表头(header): 每一列的名称;
2. 列(col): 具有相同数据类型的数据的集合;
3. 行(row): 每一行用来描述某条记录的具体信息;
4. 值(value): 行的具体信息, 每个值必须与该列的数据类型相同;
5. 键(key): 键的值在当前列中具有唯一性。

### 用python管理数据库
#### 安装依赖库
```powershell
pip install pymysql
```

#### 连接MySQL
```python
import pymysql

# 创建数据库连接
conn = pymysql.connect(
    host="localhost",
    user="yourusername",
    password="yourpassword",
    # database="yourdatabase",
    charset = "utf8mb4"     # 这里单双引号都行
)
print("数据库连接成功!")
```
参数说明:
host:MySQL服务所在地址,如果在本机可以写127.0.0.1
user: 数据库用户名
password: 用户密码
database: 要连接的数据库名称 (可选)
charset:设置字符集,它规定用哪一套字符编码规则,这个对于不同的字符的编码适配度很高,不会乱码

> 注意: 我们的脚本里**故意没有传**`database`参数,因为库还没建出来,下一步要自己`CREATE DATABASE`。如果库已经存在,也可以在这里直接写`database="test_db"`,那就相当于省掉了后面的`USE`。

#### 用 .env 管理账号密码
真正写东西的时候,密码不能直接写死在代码里(不然代码一分享,密码就跟着泄露了),这时候用`python-dotenv`把账号密码单独放在一个`.env`文件里。

```powershell
pip install python-dotenv
```

工作目录下新建一个`.env`文件(注意文件名前面有个点),里面写键值对,等号两边不要加空格,值也不要加引号:

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=qwe123
```

```python
import os
from dotenv import load_dotenv

load_dotenv()       # 读取 .env,把里面的键值对塞进环境变量

host = os.getenv("DB_HOST")
port = int(os.getenv("DB_PORT"))    # os.getenv 取出来永远是字符串,端口要转成整数
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
```

- 代码里只留下变量名,密码藏在`.env`里,这样脚本就可以随便发
- `load_dotenv()`不给参数时,会从当前目录开始找`.env`,找不到就往上层目录继续找
- `.env`不要提交到 git,记得写进`.gitignore`

#### 创建数据库
首先要创建一个"光标", 这个可以理解为鼠标. 有了鼠标,以后的操作都需要他参与
```python
cursor = conn.cursor()      # 我们将其赋值为变量cursor,方便后续调用
cursor.execute("CREATE DATABASE IF NOT EXISTS test_db DEFAULT CHARSET utf8mb4")# 
print("数据库test_db创建成功")
```
- CREATE DATABASE test_db是创建数据库,并将其命名为test_db
> 这里用大写是一个不成文的规定,增加代码可读性
- IF NOT EXISTS是如果不存在,连起来就是,如果test_db这个库不存在,就创建一个,反之不创建
- DEFAULT CHARSET utf8mb4是将默认字符集设置为utf8mb4,刚说了这个字符集的兼容性很好

#### 创建表
```python
cursor.execute("USE test_db;") 
create_table = """
CREATE TABLE IF NOT EXISTS users(
id INT AUTO_INCREMENT PRIMARY KEY,
user_name VARCHAR(50) NOT NULL,
password VARCHAR(50) NOT NULL);
"""
cursor.execute(create_table)
```
- 这个use相当于是"双击鼠标"的意思,那么这一行就是相当于是双击点开"test_db"
- 接下来是重头戏,建表
  1. 我们将一长串字符串指令赋值给变量create_table
  2. cursor.execute(create_table)就是执行这个变量, 那就相当于执行这个指令
> 三双引号是为了代码美观,可以在这中间随意打回车,意味着可以打双引号,但那样只能有一行

- CREATE TABLE IF NOT EXISTS users()跟刚才建库一个道理,不过这里是建表
- 括号里面的内容是表的不同列,括号里面有几行,创建的表就有几列
- 括号里面内容的规范是这样的:第一个是列的名字,第二个是列的类型,第三个是列的其他属性(可要可不要)

| id | user_name | password |
| :---: | :---: | :---: |
| 1 | lay | qwe123 |

- auto_increment是自动增加,primary key是主键
- 这个int就是整数,varchar()就是字符串,括号里面写它的长度, not null代表不能为空

#### 插入数据(增)
```python
insert_table = "INSERT INTO users (user_name, password) VALUES (%s,%s);"
cursor.execute(insert_table, ("lay","qwe123"))
conn.commit()
print("成功插入了一条数据")
```

- `INSERT INTO 表名 (列1, 列2) VALUES (%s, %s)`是插入一行的固定格式:前面的括号里写要填哪几列,后面的括号里写对应的值,两边顺序必须一一对应
- 无论是什么数据类型,都用`%s`占位即可,不要用其他的(`%d`、f 字符串都不行)
- 这里只给两个参数,是因为 id 那一列用了`AUTO_INCREMENT`,数据库会自动填数字
- `cursor.execute(sql, 参数元组)`的第二个参数是**元组**,pymysql 会把里面的值安全转义后再填进`%s`,这就是防 SQL 注入的标准写法
- `conn.commit()`就相当于"保存",不写这一行,内容就存不到硬盘里去

| id | user_name | password |
| :---: | :---: | :---: |
| 1 | lay | qwe123 |

#### 查询数据(查)
```python
cursor.execute("SELECT id, user_name, password FROM users;")
results = cursor.fetchall()
print("\n-----接下来是列表内容-----")
for row in results:
    print(f"id:{row[0]}| name:{row[1]}| password:{row[2]}")
```

- `SELECT id, user_name, password FROM users`是选择 users 表里这三列的内容,如果写`SELECT *`就是所有列
- `cursor.execute()`只是把查询做了,结果还在数据库那边;`cursor.fetchall()`才是把结果全部取出来,存到 results 这个变量里
- 取出来的结构是"元组的元组":一行就是一个元组,元组里按`SELECT`的列顺序排,索引从 0 开始
- 查询不用`commit()`,因为只读,没改数据

常用的取结果方法:

| 方法 | 作用 |
| :---: | :---: |
| `fetchall()` | 取出全部结果,返回元组的元组,结果为空时是空元组 |
| `fetchone()` | 只取一行,没有数据时返回`None` |
| `fetchmany(n)` | 取 n 行 |
| `cursor.rowcount` | 上一条语句影响的行数,增删改后常用它确认改到了几条 |

#### 更新数据(改)
```python
update_table = "UPDATE users SET password = %s WHERE user_name = %s;"
cursor.execute(update_table, ("888888", "lay"))
conn.commit()
print("密码已成功修改")
```

- `UPDATE 表名 SET 列 = 新值 WHERE 条件`:`SET`后面写要改的列和新值,`WHERE`指定改谁
- **极其重要:写完 update 或 delete 之后一定要写 WHERE,不然会修改或者删掉所有人的数据**
- 参数的顺序跟`%s`出现的顺序一致:`"888888"`对应 password,`"lay"`对应 user_name
- 改完一样要`commit()`,否则只在事务里,不算真正改掉

#### 删除数据(删)
```python
delete_table = "DELETE FROM users WHERE user_name = %s;"
cursor.execute(delete_table, ("lay",))
conn.commit()
print("成功删除")
```

- `DELETE FROM 表名 WHERE 条件`用来删掉满足条件的行
- 如果删除库里没有的元素,不会有任何问题(影响 0 行,不报错)
- **逗号陷阱**:只有一个参数的时候一定要写成`("lay",)`,末尾这个逗号才是元组的标志;写成`("lay")`只是加了括号的字符串,Python 会把它当成字符序列,执行时就报错
- 同样必须`commit()`

#### 关闭连接与异常处理
一段完整的数据库操作要放进`try`里面,这样出错不会让程序直接崩掉:

```python
try:
    conn = pymysql.connect(host=host, port=port, user=user, password=password, charset='utf8mb4')
    cursor = conn.cursor()
    # ......中间所有的增删改查......

except pymysql.Error as e:
    print(f"数据库操作失败: {e}")
    # 将失败原因存到e中,再打印出来

finally:
    if "cursor" in locals():
        cursor.close()
    if "conn" in locals():
        conn.close()
```

- `except pymysql.Error as e`捕获的是 pymysql 的数据库异常(比如密码错、库不存在、SQL 语法错),`as e`把失败原因存到变量 e 里
- `finally`不管成功还是失败都会执行,专门用来收尾
- `"cursor" in locals()`是检查这个变量有没有创建成功:如果第一步连数据库就失败了,cursor 根本不存在,直接`cursor.close()`会再报一个 NameError,把真正的错误盖掉
- 关闭的顺序是先关光标,再关连接,不能反
- 更严谨的写法是在`except`里加上`conn.rollback()`回滚,避免只执行了一半的数据留在事务里

#### 完整代码
```python
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("DB_HOST")
port = int(os.getenv("DB_PORT"))
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")

try:
    # 1. 连接 MySQL 服务(先不指定 database,因为库还没建)
    conn = pymysql.connect(host=host, port=port, user=user, password=password, charset='utf8mb4')
    print("成功连接!")
    cursor = conn.cursor()

    # 2. 建库并选中
    cursor.execute("CREATE DATABASE IF NOT EXISTS test_db DEFAULT CHARSET utf8mb4")
    cursor.execute("USE test_db;")

    # 3. 建表
    create_table = """
    CREATE TABLE IF NOT EXISTS users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL);
    """
    cursor.execute(create_table)

    # 4. 增
    cursor.execute("INSERT INTO users (user_name, password) VALUES (%s, %s);", ("lay", "qwe123"))
    conn.commit()

    # 5. 查
    cursor.execute("SELECT id, user_name, password FROM users;")
    for row in cursor.fetchall():
        print(f"id:{row[0]}| name:{row[1]}| password:{row[2]}")

    # 6. 改
    cursor.execute("UPDATE users SET password = %s WHERE user_name = %s;", ("888888", "lay"))
    conn.commit()

    # 7. 删
    cursor.execute("DELETE FROM users WHERE user_name = %s;", ("lay",))
    conn.commit()

except pymysql.Error as e:
    print(f"数据库操作失败: {e}")
    if "conn" in locals():
        conn.rollback()     # 出错回滚,不留半截数据
finally:
    if "cursor" in locals():
        cursor.close()
    if "conn" in locals():
        conn.close()
```

### 语句速查

| 操作 | SQL 开头 | 要不要 commit | 怎么拿结果 |
| :---: | :---: | :---: | :---: |
| 建库 | `CREATE DATABASE IF NOT EXISTS` | 否 | - |
| 选库 | `USE` | 否 | - |
| 建表 | `CREATE TABLE IF NOT EXISTS` | 否 | - |
| 增 | `INSERT INTO ... VALUES` | 是 | `cursor.rowcount` |
| 查 | `SELECT ... FROM` | 否 | `fetchall()` / `fetchone()` |
| 改 | `UPDATE ... SET ... WHERE` | 是 | `cursor.rowcount` |
| 删 | `DELETE FROM ... WHERE` | 是 | `cursor.rowcount` |

### 特别注意
1. 将长串指令赋值给变量的时候,指令的末尾是有`;`的
2. 占位符一律用`%s`,不管什么数据类型,不要用`%d`或 f 字符串拼 SQL
3. 只有一个参数时,元组千万别忘了结尾的逗号:`("lay",)`
4. 写`UPDATE`和`DELETE`必须带`WHERE`,否则全表数据一起没
5. 增、删、改必须`commit()`,查询不用
6. 收尾时先关`cursor`再关`conn`,并且用`locals()`判断变量是否存在
7. 连接数据库时如果还不确定库名,就先不传`database`,连上再`CREATE DATABASE` + `USE`
