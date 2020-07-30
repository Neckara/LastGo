const $ = require('jquery');
import {Board} from 'calc/LastGo/Board.js';
import {Game} from 'calc/LastGo/Game.js';

window.$ = $;

export class GameGUI {
	
	constructor(game, game_rules, canvas) {

		this._canvas = canvas;
		this._game = game;
		this._game_rules = game_rules;

		let maps = JSON.parse(localStorage.getItem('maps') ) || {};
		for(let map in maps)
			Board.maps[map] = maps[map];


		$('canvas').mouseup( (ev) => {

			let px = ev.pageX;
			let py = ev.pageY - $('canvas').position().top;;
			let coords = this._canvas.PixelsToCoord(px, py);

			if(coords == null)
				return;

			if( ev.which != 3 && ev.which != 1)
				return;

			if( ev.which == 1) {
				
				if( this._game_rules.putPawn(this._game.currentPlayer(), 'pawns', 'default', ...coords) ) {
					this._saveCurrent();
					this._updateGame();
				}				
			}

			/*
			if( ev.which == 1) {
				action.consequencies.added.push([currentPlayer, 'pawns', 'default', ...coords]);
				//this._game._board.addElement(this._game.currentPlayer(), 'pawns', 'default', ...coords);
			}*/

			/*
			if( ev.which == 3) {

				action.consequencies.scores.push([currentPlayer, 1]);
				action.consequencies.next_player = currentPlayer;
				// TODO get owner + draw...
				//action.consequencies.deleted.push(...coords);
				//this._game._board.removeElement('pawns', ...coords);
			}*/

		});

		$('canvas').mousemove( (ev) => {
			let px = ev.pageX;
			let py = ev.pageY - $('canvas').position().top;
			let coords = this._canvas.PixelsToCoord(px, py);

			this._canvas.clearHighlights();
			this._canvas.clearPhantomElements();

			if(coords !== null) {

				let players = this._game.players();

				let current_player = this._game.currentPlayer();

				let limits = this._game_rules.getLimits(current_player, ...coords);

				if(limits) {

					for(let freedom of limits.freedoms)
						this._canvas.highlight(...freedom, players[limits.player][1]);
					for(let friend of limits.group )
						this._canvas.highlight(...friend, players[limits.player][1]);
					for(let enemy of limits.enemies )
						this._canvas.highlight(...enemy.slice(1), players[enemy[0]][1] );
				}
				
				this._canvas.highlight(...coords);

				if( this._game_rules.canPutPawn(current_player, 'pawns', 'default', ...coords) ) {
					this._canvas.addPhantomElement('pawns', 'default', current_player, ...coords);
				}
			}
			
			this._canvas.draw();
		});

		$('canvas').on("contextmenu", (ev) => {

			let coords = this._canvas.PixelsToCoord(ev.pageX, ev.pageY - $('canvas').position().top);
			if(coords != null)
				ev.preventDefault();
		});

		$('#loadmap-select').on('change', () => {

			this._game.changeMap(  $('#loadmap-select').val()  );
			this._initGame();
			this._saveCurrent();
		});

		$('#export-btn').click( (ev) => {

			ev.preventDefault();
			let data = this._game.export();

			download(data, 'game.json', 'json');
		});

		$('#import-btn').click( async (ev) => {

			ev.preventDefault();

			let [file, data] = await upload();

			file = 'import:' + file;
			Game.games[file] = JSON.parse(data);

			$("#selectGame option[value='"+ file +"']").remove();
			let current_option = new Option(file, file, true, true);
			$('#selectGame').append( current_option );
			$('#selectGame').trigger('change');

			let games = JSON.parse(localStorage.getItem('games') ) || {};
			games[file] = Game.games[file];
			localStorage.setItem('games', JSON.stringify(games, null, 0));
		});

		$('#delete-btn').click( (ev) => {

			ev.preventDefault();

			let game = $('#selectGame').val();

			let games = JSON.parse(localStorage.getItem('games') ) || {};
			delete games[game];
			localStorage.setItem('games', JSON.stringify(games, null, 0));

			$("#selectGame option[value='"+ game +"']").remove();

			$('#selectGame').val('current');
			$('#selectGame').trigger('change');
		});

		$('#save-btn').click( (ev) => {

			ev.preventDefault();
			let game = $('#selectGame').val();

			if( game == 'current' || game.startsWith('built-in:') || game.startsWith('import:') ) {
				
				game = prompt("Please enter a name for your game", "");
				if( ! game )
					return;

				game = 'saved:' + game;

				$("#selectGame option[value='"+ game +"']").remove();
				$('#selectGame').append( new Option(game, game, true, true) );
				$('#selectGame').val(game);

				$('#delete-btn').prop('disabled', game == 'current' || game.startsWith('built-in:') );
			}

			let games = JSON.parse(localStorage.getItem('games') ) || {};
			games[game] = Game.games[game] = JSON.parse(this._game.export());
			localStorage.setItem('games', JSON.stringify(games, null, 0));
		});

		let current_option = new Option('current', 'current', true, true);
		$('#selectGame').append( current_option );


		let games = JSON.parse(localStorage.getItem('games') ) || {};
		for(let game in games)
			Game.games[game] = games[game];

		for(let game in Game.games)
			$('#selectGame').append( new Option(game, game) );

		$('#selectGame').on('change', () => {

			let selected = $('#selectGame').val();

			$('#delete-btn').prop('disabled', selected == 'current' || selected.startsWith('built-in:') );

			if( selected == 'current') {
				
				if( ! this._loadCurrent() ) {
					$('#selectGame').val('built-in:default');
					$('#selectGame').trigger('change');
				}
				return;
			}

			this._game.import( Game.games[selected] );
			this._initGame();
		});

		$('#pass-btn').click( (ev) => {

			let scores = this._game.scores();

			let idx = scores.findIndex( e => e[0] == this._game.currentPlayer() );
			idx = (idx + 1) % scores.length;

			let next_player = scores[idx][0];

			this._game.addAction({
				action: { type: 'pass' },
				consequencies: {
					added: [],
					deleted: [],
					scores: [],
					next_player: next_player
				}
			});

			this._saveCurrent();
			this._updateGame();
		});

		$('#prev-btn').click( (ev) => {
			this._game.prev();
			this._saveCurrent();

			this._updateGame();
		});
		$('#next-btn').click( (ev) => {
			this._game.next();
			this._saveCurrent();

			this._updateGame();
		});

		$('#new-btn').click( (ev) => {

			ev.preventDefault();

			let select = $('#loadmap-select');

			let current_map = this._game.map();

			select.empty();

			for(let map in Board.maps)
				select.append( new Option(map, map, map == current_map, map == current_map) );

			$('#newgame-modal').modal('show');
		});


		
		$('#selectGame').trigger('change');
	}

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
		this._initGame();

		return true;
	}

	_updateGame() {

		let players = $('#players');
		let scores = this._game.scores();

		let current_player = this._game.currentPlayer();

		for(let [name, score, color] of scores)
			players.find('div[title="' + name + '"] .score').text('Score:' + score);

		players.children().removeClass('selected');
		players.find('div[title="' + current_player + '"]').addClass('selected');

		this._canvas.draw();
	}

	_initGame() {

		let players = $('#players');
		players.empty();

		let scores = this._game.scores();

		for(let [name, score, color] of scores) {

			let player = $('<div/>');
			player.addClass('player');
			player.prop('title', name);

			let player_img = $('<span/>');
			player_img.addClass('player_img');
			player_img.css('background-color', color);

			player.append(player_img);

			let score = $('<span/>');
			score.addClass('score');
			player.append(score);
			players.append(player);
		}
		
		this._updateGame();
	}
}



// https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
// Function to download data to a file
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}


async function upload() {

	let input = $('<input type="file" id="file-selector">');

	$('body').append(input);
	
	let p = new Promise( (r) => {

		input.on('change', () => {
			
			let file = event.target.files[0];
			let filename = file.name.split('.').slice(0,-1).join('.');

    		const reader = new FileReader();
			reader.addEventListener('load', (event) => {
				r([filename, event.target.result]);
			});
			reader.readAsText(file);
		});
		input.click();
	});

	return await p;
}