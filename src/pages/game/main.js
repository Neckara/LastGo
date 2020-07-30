require('./index.html');
require('./main.css');

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'webpack-icons-installer/bootstrap'; // https://www.npmjs.com/package/webpack-icons-installer

const $ = require('jquery');

import {Game} from 'calc/LastGo/Game.js';
import {Board} from 'calc/LastGo/Board.js';
import {GameRules} from 'calc/LastGo/GameRules.js';


import {Ressources} from 'GUI/LastGo/Ressources.js';
import {BoardCanvas} from 'GUI/LastGo/BoardCanvas.js';
import {GameGUI} from './GameGUI.js';

$( async () => {

	await Ressources.loadAllDefaults();

	let canvas = $('canvas');

	let board = new Board();
	let game = new Game(board);
	let game_rules = new GameRules(game, board);
	let boardCanvas = new BoardCanvas( board, canvas, Ressources.index, 0 );


	let gg = new GameGUI(game, game_rules, boardCanvas);
});