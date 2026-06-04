---
"hot-chocolate": patch
---

修复 script 的 load 事件触发,之前依赖于绑定 onload,现在都会发出 load 事件
