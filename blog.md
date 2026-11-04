## 博客的推送教程
---
1. 首先是如何搭建一个待上传文章的框架:

```powershell
cd "C:\Users\Leisure\Desktop\个人博客"
npm run post "Re0:从零开始" re0
```
cd是为了进入文件路径
下一句是创建一个**标题**为"Re0:从零开始", **文件名**为re0的md文件

2. 是编辑文章内容

```powershell
cd "C:\Users\Leisure\Desktop\个人博客"
npm run dev     # 本地先看运行效果
```

```powershell
cd "C:\Users\Leisure\Desktop\个人博客"
git add -A      # -A是all的简称,会检测所有变动内容
git commit -m "新增：Re0 从零开始"  # 引号里是每次更新的要点
git push        # 推送,过一两分钟就好了
```

