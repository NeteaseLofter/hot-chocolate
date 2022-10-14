import React,{ useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

import './style.css'

// const fetchDemo = () => {
//   console.log('发送一个请求')
//   fetch('http://localhost:10001/hello',{method:'Get'})
//     .then(function(response) {
//       return response.json();
//     })
//     .then(function(myJson) {
//       console.log(myJson.data);
//     });
// }
function Example() {
  // 声明一个新的叫做 “count” 的 state 变量
  const [count, setCount] = useState(0);
  // useEffect(() => {
  //   document.documentElement.addEventListener('click', e => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     console.log('prevent');
  //   }, {
  //     capture: true,
  //   })
  // }, [])
  return (
    <div className="box">
      <img
        src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/140px-React-icon.svg.png'
      />
      <p>React 16</p>
      <p>You clicked {count} times</p>
      <button
        onClick={() =>{
          const func = new Function(`console.log(window.test)`);
          const add = new Function('a', 'b', 'return a + b;');
          func();
          console.log('add result', add(1, 2));
          // const result = func(1, 2);
          // // console.log('result', result);
          // setCount(count + 1);
          // const box = document.querySelector('.box');
          // console.log(box.test);
          // localStorage.setItem('myCat', 'Tom');
          // console.log( localStorage.getItem('myCat'))
        }}
      >
        Click me count +1
      </button>
    </div>
  );
}

ReactDOM.render(
  <Example />,
  document.getElementById('root')
);
