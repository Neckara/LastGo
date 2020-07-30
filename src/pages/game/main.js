require('./index.html');
require('./main.css');

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'webpack-icons-installer/bootstrap'; // https://www.npmjs.com/package/webpack-icons-installer

const $ = require('jquery');

import {Board} from 'calc/LastGo/Board.js';

import {Ressources} from 'GUI/LastGo/Ressources.js';
import {BoardCanvas} from 'GUI/LastGo/BoardCanvas.js';

import {GameGUI} from './GameGUI.js';

$( async () => {

	await Ressources.loadAllDefaults();

	let canvas = $('canvas');

	let board = new Board();
	let boardCanvas = new BoardCanvas( board, canvas, Ressources.index, 0 );

	let gg = new GameGUI(board, boardCanvas, Ressources.index);
});