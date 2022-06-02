import React from 'react';
import ReactDOM from 'react-dom';

import {
  dispatchPluginImport
} from '@hot-chocolate/plugin-dispatch/import';

import './style.css'

console.log(window);

class Example extends React.Component {
  state = {
    count: 0
  }

  react16Box = null;


  renderReact16 = async () => {
    if (this.react16app) {
      this.react16app.__sandbox.destroy();
    }

    this.react16app = await dispatchPluginImport('app3', {
      mountAt: this.react16Box
    });

  }

  render () {
    const {
      count
    } = this.state;

    return (
      <div className="box">
        <img
          src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/140px-React-icon.svg.png'
        />
        <p>React 15</p>
        <p>You clicked {count} times</p>
        <button
          onClick={() =>{
            this.setState({
              count: count + 1
            });
          }}
        >
          Click me count +1
        </button>

        <button
          onClick={() => {
            localStorage.setItem('count', count)
          }}
        >设置localStorage</button>

        <button
          onClick={this.renderReact16}
        >点一下在react15里运行react16的沙箱</button>
        <div
          className="react16-box"
          ref={(div) => { this.react16Box = div }}
        />
      </div>
    );
  }
}

ReactDOM.render(
  <Example />,
  document.getElementById('root')
);
