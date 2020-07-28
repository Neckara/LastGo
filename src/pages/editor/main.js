require('./index.html');
require('./main.css');

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'webpack-icons-installer/bootstrap'; // https://www.npmjs.com/package/webpack-icons-installer

const $ = require('jquery');



import {BoardCanvas} from 'GUI/LastGo/BoardCanvas.js';
import {Board} from 'calc/LastGo/Board.js';


$( () => {

	let bc = new BoardCanvas( new Board(), $('canvas') );

	bc.redraw();

});