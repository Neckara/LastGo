require('./index.html');
require('./main.css');

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'webpack-icons-installer/bootstrap'; // https://www.npmjs.com/package/webpack-icons-installer

const $ = require('jquery');

import {Board} from 'calc/LastGo/Board.js';

import {Ressources} from 'GUI/LastGo/Ressources.js';
import {BoardCanvas} from 'GUI/LastGo/BoardCanvas.js';

import {Editor} from './Editor.js';

$( async () => {

	await Ressources.loadAllDefaults();

	let canvas = $('canvas');

	let board = new Board();
	let bc = new BoardCanvas( board, canvas, Ressources.index );

	let editor = new Editor(board, bc, Ressources.index);

	drawAgain();
	bc.redraw();

	function drawAgain() {

		board.addElement('Neutral', 'links', 'default_r', 7, 8, 'r');
		board.addElement('Neutral', 'links', 'default_l', 8, 8, 'l');
		board.addElement('Neutral', 'links', 'default_t', 8, 8, 't');
		board.addElement('Neutral', 'links', 'default_b', 8, 7, 'b');
		board.addElement('Neutral', 'links', 'default_l', 8, 7, 'l');
		board.addElement('Neutral', 'links', 'default_r', 7, 7, 'r');
		board.addElement('Neutral', 'links', 'default_l', 7, 7, 'l');
		board.addElement('Neutral', 'links', 'default_r', 6, 7, 'r');

		board.addElement('Neutral', 'bases', 'default', 7, 7);
		board.addElement('Neutral', 'bases', 'default', 7, 8);
		board.addElement('Neutral', 'bases', 'default', 8, 7);
		board.addElement('Neutral', 'bases', 'default', 8, 8);
		board.addElement('Neutral', 'bases', 'default', 6, 7);

		board.addElement('Player 1', 'pawns', 'default', 8, 8);
		board.addElement('Player 2', 'pawns', 'default', 7, 7);
		board.addElement('Player 1', 'pawns', 'default', 6, 7);
	}

});