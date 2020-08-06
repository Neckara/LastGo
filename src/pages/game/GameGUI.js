const $ = require('jquery');
import {Board} from 'calc/LastGo/Board.js';
import {Game} from 'calc/LastGo/Game.js';
import {ElementsList} from 'calc/LastGo/ElementsList.js';

import {download, upload} from 'GUI/Utils/Files.js';

window.$ = $;

export class GameGUI {
	
	constructor(game, game_rules, canvas) {

		this._canvas = canvas;
		this._game = game;
		this._game_rules = game_rules;

		/****** GAME EVENTS ******/

		this._game.addEventListener('Game.IMPORTED Game.STATE_CHANGED', () => {

			let players = $('#players');
			players.empty();

			let scores = this._game.scores();

			for(let [name, score, color] of scores)
				this._addPlayer(name, score, color);

			let current_player = this._game.currentPlayer();

			players.children().removeClass('selected');
			players.find('div[title="' + current_player + '"]').addClass('selected');
		});

		this._game.addEventListener('Game.STATE_CHANGED', () => {
			this._saveCurrent();
		});

		/****** PUT PAWN ******/

		// Put pawn
		$('canvas').mouseup( (ev) => {

			if( ev.which != 1 )
				return;

			if( this._game_rules.isEndOfGame() )
				return;

			let coords = this._canvas.PixelsToCoord( ...this._posFromMouseEvent(ev) );

			if(coords == null)
				return;
				
			this._game_rules.putPawn('Pawns', ['default', this._game.currentPlayer()], coords);
		});

		/****** MOUSE ACTIONS ******/

		$('canvas').on("contextmenu", (ev) => {

			let coords = this._canvas.PixelsToCoord( ...this._posFromMouseEvent(ev) );
			if(coords != null)
				ev.preventDefault();
		});

		$('canvas').mousemove( (ev) => {

			let new_pos = this._posFromMouseEvent(ev);

			this._updateHighlights(new_pos);
			this._updatePhantoms(new_pos);

			this._last_pos;
		});
		
		this._game.addEventListener('Game.FULLY_REDRAWED Game.STATE_CHANGED', () => {
			console.log('called');
			this._updateHighlights();
			this._updatePhantoms();
		});

		/****** Actions ******/

		$('#new-btn').click( (ev) => {

			ev.preventDefault();

			let current_map = this._game.map();

			let select = $('#loadmap-select');
			select.empty();

			for(let map in Board.maps)
				select.append( new Option(map, map) );

			select.val(current_map);

			$('#newgame-modal').modal('show');
		});

		$('#export-btn').click( (ev) => {

			ev.preventDefault();
			let data = this._game.export();

			download(data, 'game.json', 'json');
		});

		$('#import-btn').click( async (ev) => {

			ev.preventDefault();

			let [file, data] = await upload();

			let gameName = 'import:' + file;
			Game.games[gameName] = JSON.parse(data);
			this._modifySavedGames( games => games[gameName] = Game.games[gameName] );

			if( ! $("#selectGame option[value='"+ gameName +"']").length )
				$('#selectGame').append( new Option(gameName, gameName) );

			this.setGame(gameName);
		});

		$('#delete-btn').click( (ev) => {

			ev.preventDefault();

			if( ! confirm('Are you sure you want to delete this Game ?') )
				return;

			let game = this.currentGameName();

			delete this.Game.games[game];
			this._modifySavedGames( games => delete games[game] );

			$("#selectGame option[value='"+ game +"']").remove();

			this.setGame('current');
		});

		$('#save-btn').click( (ev) => {

			ev.preventDefault();
			let game = this.currentGameName();

			if( game == 'current' || game.startsWith('built-in:') || game.startsWith('import:') ) {
				
				game = prompt("Please enter a name for your game", "");
				if( ! game )
					return;

				game = 'saved:' + game;

				if( ! $("#selectGame option[value='"+ gameName +"']").length )
					$('#selectGame').append( new Option(gameName, gameName) );

				$('#selectGame').val(game);
				$('#delete-btn').prop('disabled', game == 'current' || game.startsWith('built-in:') );
			}

			Game.games[game] = JSON.parse(this._game.export());
			this._modifySavedGames( games => games[game] = Game.games[game] );
		});

		/****** History actions ******/

		$('#pass-btn').click( (ev) => {
			if( this._game_rules.pass( this._game.currentPlayer() ) );
		});

		$('#prev-btn').click( (ev) => {
			this._game.prev();
		});
		$('#next-btn').click( (ev) => {
			this._game.next();
		});

		/****** Change Map ******/

		// Load Maps
		let maps = JSON.parse(localStorage.getItem('maps') ) || {};
		for(let map in maps)
			Board.maps[map] = maps[map];

		// Change Map.
		$('#loadmap-select').on('change', () => {
			this._game.changeMap(  $('#loadmap-select').val()  );
		});

		/****** Change Game ******/

		let current_option = new Option('current', 'current');
		$('#selectGame').append( current_option );

		let games = JSON.parse(localStorage.getItem('games') ) || {};
		for(let game in games)
			Game.games[game] = games[game];

		for(let game in Game.games)
			$('#selectGame').append( new Option(game, game) );

		$('#selectGame').on('change', () => {
			this.setGame( this.currentGameName() );
		});

		/**********************/

		this.setGame('current');
	}

	/*========== METHODS ===========*/

	/***** Load/Save current *******/
	_saveCurrent() {

		let cur = $('#selectGame').val();
		if( cur.startsWith('built-in:') || cur.startsWith('import:') )
			$('#selectGame').val('current');

		localStorage.setItem('games.current', this._game.export() );
	}

	_loadCurrent() {

		let data = localStorage.getItem('games.current');

		if( ! data)
			return false;

		this._game.import(data);

		return true;
	}

	/******* *********/
	_addPlayer(name, score, color) {

		let player = $('<div/>');
		player.addClass('player');
		player.prop('title', name);

		let player_img = $('<span/>');
		player_img.addClass('player_img');
		player_img.css('background-color', color);

		player.append(player_img);

		let score_txt = $('<span/>');
		score_txt.addClass('score');
		score_txt.text(`Score : ${score}`);
		player.append(score_txt);
		$('#players').append(player);
	}

	_modifySavedGames( fct ) {
		let games = JSON.parse(localStorage.getItem('games') ) || {};
		fct(games);
		localStorage.setItem('games', JSON.stringify(games, null, 0));
	}

	setGame(game) {

		$('#selectGame').val(game);
		$('#delete-btn').prop('disabled', game == 'current' || game.startsWith('built-in:') );

		if( game == 'current') {
			
			if( ! this._loadCurrent() )
				this.setGame('built-in:default');
			return;
		}

		this._game.import( Game.games[game] );
	}

	currentGameName() {
		return $('#selectGame').val();
	}
	/****** Highlight/Phantoms ********/

	_posFromMouseEvent(ev) {
		return [
			ev.pageX,
			ev.pageY - $('#canvas').position().top
		];
	}

	_endOfGameHighlights() {

		let results = this._game_rules.finalResult();

		let test = $('<div></div>');

		for(let player in results ) {

			let [color, cases] = results[player];

			for(let i = 0; i < cases.length; ++i) {
				let hcolor = color.slice(0,-2) + '80';
				this._canvas.addHighlight( cases[i], hcolor );
			}

		}
	}

	_updateHighlights(new_pos = null) {

		let isMouse = new_pos !== null;

		if( !isMouse ) {
			this._canvas.clearHighlights();
			this._prev_highlight = null;
			new_pos = this._last_pos;
		}

		if( this._game_rules.isEndOfGame() ) {
			if( ! isMouse )
				this._endOfGameHighlights();
			return;
		}

		if( ! new_pos )
			return;

		let nextHighlight = this._canvas.PixelsToCoord(...new_pos);

		if( this._prevHighlight ) {

			if( ! nextHighlight
				|| ! ElementsList.areKeysEqual(nextHighlight, this._prevHighlight)
				|| ! isMouse
				) {

				if( isMouse )
					this._canvas.clearHighlights();
				this._prevHighlight = null;
			} else {
				nextHighlight = null;
			}
		}

		if( nextHighlight ) {
			this._neighboursHighlight(nextHighlight);
			this._prevHighlight = nextHighlight;
		}
	}

	_neighboursHighlight(idx) {

		let players = this._game.players();

		let current_player = this._game.currentPlayer();

		let limits = this._game_rules.getLimits(current_player, idx);

		if(limits) {

			for(let freedom of limits.freedoms)
				this._canvas.addHighlight(freedom, 'rgba( 255, 255, 255, 0.25 )');
			for(let friend of limits.group )
				this._canvas.addHighlight(friend, players[limits.player][1]);
			for(let enemy of limits.enemies )
				this._canvas.addHighlight(enemy[1], players[enemy[0]][1] );
		}

		this._canvas.addHighlight(idx);
	}

	_updatePhantoms(new_pos = null) {

		if( new_pos === null ) {
			this._canvas.clearPhantomElements();
			this._prev_phantoms = null;
			new_pos = this._last_pos;
		}

		if( this._game_rules.isEndOfGame() )
			return;

		if( ! new_pos )
			return;

		let nextPhantom = null;
		let coords = this._canvas.PixelsToCoord(...new_pos);
		if( coords ) {

			let name = 'default';
			let type = 'Pawns';
			let owner = this._game.currentPlayer();

			nextPhantom = [type, [name, owner], coords];

			if( ! this._game_rules.canPutPawn(...nextPhantom) )
				nextPhantom = null;
		}

		if( this._prevPhantom ) {

			if( ! nextPhantom
				|| nextPhantom[0]   !== this._prevPhantom[0]
				|| nextPhantom[1][0] != this._prevPhantom[1][0]
				|| nextPhantom[1][1] != this._prevPhantom[1][1]
				|| ! ElementsList.areKeysEqual(nextPhantom[2], this._prevPhantom[2])
				) {

				this._canvas.removePhantomElement(...this._prevPhantom );
				this._prevPhantom = null;
			} else {
				nextPhantom = null;
			}
		}

		if( nextPhantom ) {
			this._canvas.addPhantomElement(...nextPhantom);
			this._prevPhantom = nextPhantom;
		}
	}
}