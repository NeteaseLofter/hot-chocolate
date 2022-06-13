# hot-chocolate

## 0.2.15-beta.0

### Patch Changes

- 9606fd2: 修复监听 window 事件时，丢失 passive，优化了 window 监听和清理方法,暂时不考虑全部变量提升的影响

## 0.2.14

### Patch Changes

- 6c6f9cb: 更新 hot-chocolate proxy window 的 has 逻辑；更新 dispatch 会抛出\_\_sandbox

## 0.2.13

### Patch Changes

- e45182e: fix: document readyState 错误

## 0.2.12

### Patch Changes

- 兼容触发 document DOMContentLoaded 和 window load 事件

## 0.2.11

### Patch Changes

- 4828a6d: fix: 上一版本中 css 加载问题

## 0.2.10

### Patch Changes

- f9425ee: 修复字体图标的相对路径错误

## 0.2.9

### Patch Changes

- 支持解析沙箱中的相对路径资源

## 0.2.8

### Patch Changes

- d03c097: css 加载资源时相对路径错误

## 0.2.7

### Patch Changes

- 95155d7: 1. css font-face 相对路径支持
  2. link onload 支持
- 95155d7: link href 重复设置导致前缀丢失

## 0.2.6

### Patch Changes

- 62f2619: 1. css 内容支持 replaceCSSString 进行修改
  2. 自动替换:root 为:host
  3. 自动提升 font-face 以支持字体文件
  4. htmlString 中 style 和 link 标签的添加逻辑修改，和动态添加保持一致

## 0.2.5

### Patch Changes

- 0b4c249: 自动移除 noscript 标签

## 0.2.4

### Patch Changes

- 6579370: 添加 document.activeElement 支持
- 941b783: fix: with 在作用域提升后可能使得“a=1”的代码直接修改原始 window

## 0.2.3

### Patch Changes

- 支持 script type="application/json"

## 0.2.2

### Patch Changes

- 支持 hooks.sandbox 新增 loadResource 时点，可以自定义获取资源的方式
