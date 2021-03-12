import React from 'react';
import ReactDOM from 'react-dom';
import printMe from './print.js';
import './style.css'

const element = React.createElement;
const e = React.createElement;
console.log(printMe)
printMe();
class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return e('div', {className: "hello"}, 'Hello React15');
    }
    return element(
      'button',
      { onClick: () => {this.setState({ liked: true });} },
      '点我一下',
    );
  }
}
ReactDOM.render(
  element(LikeButton),
  document.getElementById('root')
);
