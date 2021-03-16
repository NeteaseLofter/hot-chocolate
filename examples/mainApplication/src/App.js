import './App.css';

import React from 'react'
// BrowserRouter 地址栏 没有 #  是需要服务端配合, 是基于html5的pushState和replaceState的，很多浏览器不支持，存在兼容性问题。
import { BrowserRouter as Router, Route, Link, Switch, Redirect } from 'react-router-dom'
// HashRouter 地址栏 有 #  不需要服务端配合   是浏览器端解析路由
// import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom'
 
// 引入组件
import VueApplication from './show-vue'
import ReactApplication from './show-react15'
import ReactApplicationAnother  from './show-react16'
import BothApplication from './both-show'
function App() {
  return (
    <div className="App">
      <Router>
        <div>
          <li  style={{padding:'20px'}}>
            {/* link 生成路由链接 */}
            <Link to="/vue" >展示vue子应用</Link>
          </li>
          <li style={{padding:'20px'}}>
            <Link to="/react15">展示React15子应用</Link>
          </li>
          <li style={{padding:'20px'}}>
            <Link to="/react16">展示React16子应用</Link>
          </li>
          <li style={{padding:'20px'}}>
            <Link to="both">同时展示所有应用</Link>
          </li>
          {/*  组件 <Switch> 只渲染出第一个与当前访问地址匹配的 <Route> 或 <Redirect> 否则你有几个 <Route> 都会显示 */}
          <Switch>
            {/* react 路由重定向 */}
            <Redirect exact from="/" to="/main" />
            {/* 输入 localhost:3000/ 路由指向 localhost:3000/main去  */}
            <Route exact path="/" component={ VueApplication} />
            {/* exact=false 的时候 path 等于 /login /login/me 都能匹配   但是 exact=true 的时候 只匹配 path 等于 /login */}
            <Route exact path="/vue" component={VueApplication} />
            <Route  exact path="/react15" component={ReactApplication} />
            <Route   exact path="/react16" component={ReactApplicationAnother} />
            <Route  exact path="/both" component={BothApplication} />
          </Switch>
        </div>
      </Router>

    </div>
  );
}

export default App;
