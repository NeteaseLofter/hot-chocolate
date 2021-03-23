import React,{ useState } from 'react';
import ReactDOM from 'react-dom';

import './style.css'

const fetchDemo = () => {
  console.log('发送一个请求')
  fetch('http://localhost:10001/hello',{method:'Get'})
    .then(function(response) {
      return response.json();
    })
    .then(function(myJson) {
      console.log(myJson.data);
    });
}
function Example() {
  // 声明一个新的叫做 “count” 的 state 变量
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>You clicked {count} times</p>
      {/* 验证插件CustomPlugin作用 */}
      <button
        onClick={() =>{
          setCount(count + 1);
          localStorage.setItem('myCat', 'Tom');
          console.log( localStorage.getItem('myCat'))
        }}
      >
        Click me count +1
      </button>
      <button onClick={fetchDemo}>
       点击我发送一个请求
      </button>
    </div>
  );
}

ReactDOM.render(
  <Example />,
  document.getElementById('root')
);
