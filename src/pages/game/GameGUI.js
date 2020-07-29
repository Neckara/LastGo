const $ = require('jquery');
import {Board} from 'calc/LastGo/Board.js';

window.$ = $;

export class GameGUI {
	
	constructor(board, canvas, ressources) {

		this._board = board;
		this._canvas = canvas;
		this._ressources = ressources;
	

		let maps = JSON.parse(localStorage.getItem('maps') ) || {};
		for(let map in maps)
			Board.maps[map] = maps[map];

		this.changeMap('built-in:default');

		$('canvas').mousemove( (ev) => {
			let px = ev.pageX;
			let py = ev.pageY;
			let coords = this._canvas.PixelsToCoord(px, py);

			this._canvas.clearHighlights();

			if(coords !== null)
				this._canvas.highlight(...coords);
			
			this._canvas.draw();
		});

		$('#loadmap-select').on('change', () => {
			this.changeMap( $('#loadmap-select').val() );
		});

		$('#openmap-btn').click( (ev) => {

			ev.preventDefault();

			let select = $('#loadmap-select');
			select.empty();

			for(let map in Board.maps)
				select.append( new Option(map, map, map == 'built-in:default', map == 'built-in:default') );

			$('#loadmap-modal').modal('show');
		});
	}


	changeMap(map) {

		this._currentMap = Board.maps[map];
		this._board.import(this._currentMap);
		this._canvas.redraw();

		let players = $('#players');
		players.empty();
		
		for(let name in this._currentMap.players) {

			if(name == 'Neutral')
				continue;

			let player = $('<div/>');
			player.addClass('player');
			player.prop('title', name);

			let player_img = $('<span/>');
			player_img.addClass('player_img');
			player_img.css('background-color', this._currentMap.players[name]);

			player.append(player_img);

			let score = $('<span/>');
			score.addClass('score');
			score.text('Score: 0');
			player.append(score);
			players.append(player);
		}
		
		players.children().first().addClass('selected');
	}
}