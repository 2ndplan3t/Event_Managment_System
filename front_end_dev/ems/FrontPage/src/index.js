import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Optional: for styling
import Home from './pages/home.js';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.render(
  <BrowserRouter>
    <Home/>
  </BrowserRouter>,

document.getElementById('root')
);
