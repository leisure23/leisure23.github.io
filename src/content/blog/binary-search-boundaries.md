---
title: 二分查找：把边界问题一次讲透
description: 二分查找最容易错的地方不是思路，而是区间定义。用「循环不变量」把闭区间、左闭右开和左右边界的三种写法彻底统一。
pubDate: 2026-10-30
tags: [算法, 数据结构]
emoji: 🔍
hue: 195
featured: true
---

二分查找的思路谁都会:每次砍掉一半。但真写起来,十个里有八个死在边界上——`left < right` 还是 `left <= right`?`mid + 1` 还是 `mid`?死循环是怎么来的?

问题不在玄学,在于**你一开始就没定义清楚自己在搜索哪个区间**。

## 循环不变量:先定规矩,再写代码

所谓循环不变量,就是「每次循环开始时,一定成立的那句断言」。

我们约定搜索区间是 `[left, right]`(**闭区间**,两端都能取到),那么不变量就是:

> 目标值如果存在,一定在 `[left, right]` 内。

有了这句话,后面全都能推出来。

### 推论一:循环继续的条件是 `left <= right`

因为区间两端都可取。当 `left == right` 时,区间是 `[3, 3]`,里面还有一个元素,还得比。

### 推论二:排除 mid 后,边界要跳过它

如果 `nums[mid] < target`,说明 `mid` 以及它左边全都不可能是答案。但 `mid` 已经排除,**新区间应包含 `mid + 1`**。

## 写法一:闭区间(最不容易错)

```cpp
int lowerBound(vector<int>& nums, int target) {
    int left = 0, right = nums.size() - 1;   // 闭区间 [left, right]

    while (left <= right) {                   // 区间非空就继续
        int mid = left + (right - left) / 2;  // 防溢出
        if (nums[mid] < target) {
            left = mid + 1;                   // mid 已排除
        } else if (nums[mid] > target) {
            right = mid - 1;                  // mid 已排除
        } else {
            return mid;
        }
    }
    return -1;
}
```

三个细节:

1. `mid = left + (right - left) / 2`,避免 `left + right` 在 `INT_MAX` 附近溢出;
2. `left = mid + 1` 和 `right = mid - 1`,因为 `mid` 已经检查过了;
3. 循环结束时 `left > right`,区间为空,说明没找到。

## 写法二:左闭右开(标准库风格)

C++ 的 `std::lower_bound` 用的是 `[left, right)` **左闭右开**。这种约定下:

- 数组为空时 `left == right`,所以 `right` 初值是 `nums.size()`;
- 循环条件是 `left < right`,因为 `[3, 3)` 是空区间;
- 缩小范围时 `right = mid`(**不是** `mid - 1`),因为 `mid` 本来就不在区间内。

```cpp
int lowerBound(vector<int>& nums, int target) {
    int left = 0, right = nums.size();  // 左闭右开 [left, right)

    while (left < right) {              // 区间非空就继续
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;             // mid 不可能,跳过
        } else {
            right = mid;                // mid 可能是答案,保留
        }
    }
    return left;                        // 第一个 >= target 的位置
}
```

注意这里没有 `return mid` 的分支——这个写法解的是**「第一个大于等于 target 的下标」**,不是「是否存在」。

## 最容易搞混的:`<` 和 `<=` 什么时候用

一句话记住:

| 区间写法 | 初值 | 循环条件 | 缩右边界 |
| --- | --- | --- | --- |
| 闭区间 `[l, r]` | `r = n - 1` | `l <= r` | `r = mid - 1` |
| 左闭右开 `[l, r)` | `r = n` | `l < r` | `r = mid` |

**初值和循环条件是配套的,不能混。** 如果你写 `r = n - 1` 却用 `l < r`,那当答案正好是最后一个元素时会漏掉。

## 两种「边界」要找的东西不一样

这是面试和课程作业里最爱考的区别:

- **下界(lower_bound)**:第一个 **>=** target 的位置。
- **上界(upper_bound)**:第一个 **>** target 的位置。

为什么要两个?因为有了它们,你才能直接回答:

- `count(target) = upper_bound - lower_bound`
- 第一个等于 target 的位置 = `lower_bound`
- 最后一个等于 target 的位置 = `upper_bound - 1`

找下界的关键改动只有一处:**相等时不能马上返回,要继续往左找**。

```cpp
int lowerBound(vector<int>& nums, int target) {
    int left = 0, right = nums.size();       // [left, right)
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;                     // 相等也往左收,逼出最左
        }
    }
    return left;
}

int upperBound(vector<int>& nums, int target) {
    int left = 0, right = nums.size();
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) {           // 唯一区别:<=
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}
```

两段代码只差一个 `=`。理解了这个「差一个等号」,比背十遍模板有用。

## 死循环是怎么产生的

最常见的死循环长这样:

```cpp
int mid = (left + right) / 2;
if (nums[mid] < target) left = mid;   // 错:没有排除 mid
```

当 `left == mid` 时(比如区间长度为 1 或 2),`left = mid` 什么也没干,区间不缩小,永远循环。

**记住:每一轮必须让区间严格变小。** 写完代码用长度为 1、2 的数组手动跑一遍,基本能抓住所有这类错误。

## 用二分「猜答案」

二分不只用在有序数组里。只要问题的答案满足**单调性**,就能二分。

典型题目:「最小化最大值」「最大化最小值」。比如把数组切成 k 段,让每段和的最大值尽可能小:

```cpp
// 判断:每段和不超过 limit 时,最少需要切几段
bool feasible(vector<int>& nums, int k, int limit) {
    int segments = 1, sum = 0;
    for (int x : nums) {
        if (x > limit) return false;
        if (sum + x > limit) {
            segments++;
            sum = x;
        } else {
            sum += x;
        }
    }
    return segments <= k;
}
```

然后二分 `limit`,范围是 `[max(nums), sum(nums)]`。这一类题的本质是:**把「求解」变成「判定」**,而判定是 O(n) 的,二分把外层压到 O(log S)。

## 一句话总结

- 先选定区间定义(闭 or 左闭右开),**初值和循环条件跟着定义走**;
- 每轮都要排除 `mid`,区间必须严格缩小;
- 找边界时,相等不要立刻返回,继续往答案方向收;
- 答案有单调性,就能二分答案。

二分查找看起来简单,但它是少数**能靠「默写模板」蒙混过关、却会在真实代码里反复咬你**的知识点。值得花半小时把上面的循环不变量自己在纸上推一遍。
