import React from 'react';
import ReactDOM from 'react-dom';
import './style/index.css';
import App from './App';
import NavBar from './components/NavBar/NavBar';
import * as serviceWorker from './serviceWorker';

//ReactDOM.render(<NavBar />, document.getElementById('head'));
ReactDOM.render(<App />, document.getElementById('main'));
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
