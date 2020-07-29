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

	let img_l = Ressources.index['links']['default_l'];
	let img_t = Ressources.index['links']['default_t'];
	let img_b = Ressources.index['links']['default_b'];
	let img_r = Ressources.index['links']['default_r'];

	let img_plinth = Ressources.index['bases']['default'];
	let img_pawn = Ressources.index['pawns']['default'];

	let img_pawn2 = await Ressources.Color( Ressources.index['pawns']['default'], '#ff0000', '#eeec80' );

	let canvas = $('canvas');

	let board = new Board();
	let bc = new BoardCanvas( board, canvas );

	let editor = new Editor(board, bc);

	canvas.mousemove( (ev) => {
		let px = ev.pageX;
		let py = ev.pageY;
		let coords = bc.PixelsToCoord(px, py);

		if(coords !== null) {

			bc.clearHighlights();
			bc.highlight(...coords);

			bc.redraw();

			drawAgain();
		}
	});

	canvas.mouseup( (ev) => {
		let px = ev.pageX;
		let py = ev.pageY;
		let coords = bc.PixelsToCoord(px, py);

		if(coords !== null) {
			bc._drawImage(img_pawn2, ...coords);
		}
	});


	bc.redraw();
	drawAgain();

	function drawAgain() {

		bc._drawImage(img_r, 7, 8);
		bc._drawImage(img_l, 8, 8);
		bc._drawImage(img_t, 8, 8);
		bc._drawImage(img_b, 8, 7);
		bc._drawImage(img_l, 8, 7);
		bc._drawImage(img_r, 7, 7);
		bc._drawImage(img_l, 7, 7);
		bc._drawImage(img_r, 6, 7);

		bc._drawImage(img_plinth, 7, 7);
		bc._drawImage(img_plinth, 7, 8);
		bc._drawImage(img_plinth, 8, 7);
		bc._drawImage(img_plinth, 8, 8);
		bc._drawImage(img_plinth, 6, 7);



		bc._drawImage(img_pawn, 8, 8);
		bc._drawImage(img_pawn, 7, 7);
		bc._drawImage(img_pawn2, 6, 7);

		bc._drawHighlight(8,8);
	}

});