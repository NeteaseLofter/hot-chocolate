# @hot-chocolate/plugin-request


## 安装
```
npm install @hot-chocolate/plugin-dispatch
```

## 使用

### 主应用
```js
import {
  Manager
} from 'hot-chocolate';
import {
  createSandboxDispatchPlugin
} from '@hot-chocolate/plugin-dispatch';

new Manager(
  [
    {
      name: 'app-a' // 子应用A, 是公共组件提供方
    },
    {
      name: 'app-b' // 子应用B, 是公共组件使用方
    }
  ],
  [
    createSandboxDispatchPlugin() // 启动相互调用插件
  ]
)
```

### 子应用A 代码示例
比如 子应用A 提供了个 Table的渲染函数
```jsx
import {
  dispatchPluginExports
} from '@hot-chocolate/plugin-dispatch/export';

dispatchPluginExports.renderTable = () => {
  React.render(
    (<div>App1 Table</div>),
    document.body
  )
}
```

### 子应用B 代码示例
比如:  子应用B去加载 A的Table
```jsx
import {
  dispatchPluginImport
} from '@hot-chocolate/plugin-dispatch/import';

async () => {
  const appA = await dispatchPluginImport('app-a', {
    mountAt: document.body
  });

  appA.renderTable()
}

```
