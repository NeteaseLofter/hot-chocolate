import React from 'react'
// BrowserRouter 地址栏 没有 #  是需要服务端配合, 是基于html5的pushState和replaceState的，很多浏览器不支持，存在兼容性问题。
import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch,
  Redirect
} from 'react-router-dom'
// HashRouter 地址栏 有 #  不需要服务端配合   是浏览器端解析路由
// import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom'

// 引入组件
import { MicroApplication } from './micro-app'

function App() {
  return (
    <div className="app">
      <Router>
        <div className="nav">
          <div className="nav-item">
            <Link to="/app1" >展示vue子应用</Link>
          </div>
          <div className="nav-item">
            <Link to="/app2">展示React15子应用</Link>
          </div>
          <div className="nav-item">
            <Link to="/app3">展示React16子应用</Link>
          </div>
          <div className="nav-item">
            <Link to="all">同时展示所有应用</Link>
          </div>
        </div>
        {/*  组件 <Switch> 只渲染出第一个与当前访问地址匹配的 <Route> 或 <Redirect> 否则你有几个 <Route> 都会显示 */}
        <Switch>
          {/* react 路由重定向 */}
          <Redirect exact from="/" to="/main" />
          <Route exact path="/:appName" component={MicroApplication} />
        </Switch>
      </Router>

    </div>
  );
}

export default App;
