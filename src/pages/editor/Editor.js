const $ = require('jquery');
import {Board} from 'calc/LastGo/Board.js';
import {ElementsList} from 'calc/LastGo/ElementsList';
import {download, upload} from 'GUI/Utils/Files.js';

window.$ = $;

export class Editor {


	constructor(board, canvas, ressources) {

		this._board = board;
		this._canvas = canvas;
		this._ressources = ressources;

		/****** SAVE CURRENT ******/
		this._board.addEventListener('Board.SIZE_CHANGED Board.ELEMENT_ADDED Board.ELEMENT_REMOVED Board.PLAYER_MODIFIED Board.PLAYER_REMOVED', () => {
			this._saveCurrent();
		});

		/****** BOARD SIZE ******/
		$('#board_width, #board_height').on('input', () => {

			let w = parseInt( $('#board_width').val() );
			let h = parseInt( $('#board_height').val() );

			if( ! Number.isInteger(w) || w < 1)
				w = 1;
			if( ! Number.isInteger(h) || h < 1)
				h = 1;

			this._board.setBoardSize(w, h);
		});

		this._board.addEventListener('Board.SIZE_CHANGED', () => {
			let [w, h] = this._board.boardSize();
			$('#board_width').val(w);
			$('#board_height').val(h)
		});

		/****** MOUSE ACTIONS ******/
		$('canvas').on("contextmenu", (ev) => {

			let coords = this._canvas.PixelsToCoord(ev.pageX, ev.pageY);
			if(coords != null)
				ev.preventDefault();
		});

		$('canvas').mousemove( (ev) => {

			let new_pos = [ev.pageX, ev.pageY];

			this._updateAngle(new_pos);
			this._updateHighlights(new_pos);
			this._updatePhantoms(new_pos);

			this._last_pos = new_pos;
		});


		/****** LAYERS ******/
		this._override_layers = {};
		this._layers = ['Background', 'Grid', 'Links', 'Bases', 'Pawns'];
		this._current_level = this._layers.length - 1;

		$('#show_Grid').prop( "checked", true );
		$('#show_Grid').change( (ev) => {
			this._canvas.showLayer( 'Grid', ev.target.checked && this._layers.indexOf('Grid') <= this._current_level );

			this._override_layers['Grid'] = ! ev.target.checked;
		});

		let prev_time = Date.now();
		$('canvas, #canvas').on('wheel', (ev) => {

			ev.preventDefault();

			let cur_time = Date.now();
			if( cur_time - prev_time < 250)
				return;
			prev_time = cur_time;

			if( ev.originalEvent.deltaY > 0 )
				--this._current_level;
			else
				++this._current_level;

			this._changeLayerLevel(this._current_level);
			let layer = this._layers[this._current_level];

			this.selectType( layer != 'Grid' ? layer : 'Background' );
		});

		$('#select_Elements_menu > li > a').on('shown.bs.tab', (ev) => {

			let href = $(ev.target).attr('href');

			let type = href.slice('#select_'.length);
			let layer = this._layers.indexOf(type);

			if( layer > this._current_level )
				this._changeLayerLevel( layer );
		});

		/****** PLAYERS ******/
		this._board.addEventListener('Board.IMPORTED', () => {

			let players =  this._board.players();
			let prevSelected = this.selectedPlayer();

			let target = $('#players');
			target.empty();

			for(let playerName in players )
				this.createPlayer(playerName, players[playerName] );

			this.selectPlayer(prevSelected, this.firstPlayer() );
		});


		this._board.addEventListener('Board.PLAYER_MODIFIED', (ev) => {

			let {name, color} = ev.data;
			
			let icon = this.getPlayerIcon(name);
			if( ! icon.length )
				icon = this.createPlayer(name, color);
			else
				icon.css('background-color', color);

			if( icon.hasClass('selected') )
				this._recolorElements(color);
		});

		this._board.addEventListener('Board.PLAYER_REMOVED', (ev) => {

			let {name} = ev.data;
			let icon = this.getPlayerIcon(name);
			icon.remove();
			if( icon.hasClass('selected') )
				this.selectPlayer( $('.players .player').first() );
		});

		$('#addplayer-btn').click( ev => {

			ev.preventDefault();

			let playerName = prompt('Enter a name for your player');

			if( ! playerName )
				return;

			if( this._board.players()[playerName] !== undefined ) {
				alert('User already exists !');
				return;
			}

			let color = $('#player-color').val();
			this._board.addPlayer(playerName, color)

			this._askNewColor(playerName);
		});

		$('#delplayer-btn').click( ev => {

			ev.preventDefault();

			let playerName = this.selectedPlayer();

			if( playerName && playerName != 'Neutral') {
				this._board.removePlayer(playerName);
				this.selectPlayer( this.firstPlayer() );
			}
		});

		$('#player-color').on('change', () => {

			let color = $('#player-color').val();
			let playerName = this.selectedPlayer();

			this._board.modifyPlayer(playerName, color);
		});

		/****** ACTIONS ******/
		$('#clear-btn').click( (ev) => {
			ev.preventDefault();
			this._board.clearElements();
		});

		$('#delete-btn').click( (ev) => {

			ev.preventDefault();

			let map = this.currentMapName();

			delete Board.maps[map];
			this._modifySavedMaps( (maps) => delete maps[map] );
			$("#selectMap option[value='"+ map +"']").remove();

			this.changeMap('current');
		});

		$('#save-btn').click( (ev) => {

			ev.preventDefault();
			let map = this.currentMapName();

			let savedAs = map == 'current' || map.startsWith('built-in:') || map.startsWith('import:');

			if( savedAs ) {
				
				if( ! (map = prompt("Please enter a name for your map", "")) )
					return;

				map = 'saved:' + map;
			}

			let m = Board.maps[map] = JSON.parse(this._board.export());
			this._modifySavedMaps( (maps) => maps[map] = m );

			if(savedAs) {

				if( ! $("#selectMap option[value='"+ map +"']").length )
					$('#selectMap').append( new Option(map, map) );

				this.changeMap(map);
			}
		});

		$('#export-btn').click( (ev) => {

			ev.preventDefault();

			let data = this._board.export();
			download(data, 'map.json', 'json');
		});

		$('#import-btn').click( async (ev) => {

			ev.preventDefault();

			let [file, data] = await upload();

			let mapName = 'import:' + file;
			Board.maps[mapName] = JSON.parse(data);
			this._modifySavedMaps( maps => maps[mapName] = Board.maps[mapName] );

			if( ! $("#selectMap option[value='"+ mapName +"']").length )
				$('#selectMap').append( new Option(mapName, mapName) );

			this.changeMap(mapName);
		});


		/****** MAPS SELECTION ******/
		{ // Load Maps
			$('#selectMap').append( new Option('current', 'current') );

			let maps = JSON.parse(localStorage.getItem('maps') ) || {};
			for(let map in maps)
				Board.maps[map] = maps[map];

			for(let map in Board.maps)
				$('#selectMap').append( new Option(map, map) );
		}

		$('#selectMap').on('change', () => {
			this.changeMap();
		});

		/****** SELECT ELEMENT ******/

		// Show lists
		for(let typeTab of $('#select_Elements').children() ) {

			typeTab = $(typeTab);

			let type = typeTab.attr('id').slice('select_'.length);
			let res = this._ressources[type] || {};

			typeTab.empty();

			for(let name in res) {

				let img = res[name].image().cloneNode();

				img = $(img);
				img.attr('data-type', type);
				img.attr('data-name', name);
				img.attr('title', name);
				img.prop('id', 'Select_' + type + '-' + name.replace(/\./g, '-') );

				if(type == 'Links')
					img.addClass('Links_' + name.split('_').slice(-1)[0]);

				img.click( () => {
					this.selectElement(name);
				});

				typeTab.append( img );
			}

			typeTab.children().first().addClass('selected');
		}

		// Add element
		$('canvas').mouseup( (ev) => {

			let name = this.selectedName();
			if( ! name )
				return;

			let type = this.selectedType();
			let coords = this._canvas.PixelsToCoord(ev.pageX, ev.pageY);

			if(coords == null)
				return;

			let z;
			if( type == 'Links')
				z = this.currentAngle();

			if( ev.which == 1)
				this._board.addElement(type, [name, this.selectedPlayer()], coords, z);
			if( ev.which == 3)
				this._board.removeElement(type, null, coords, z);
		});

		this.changeMap('current');
		this.setCurrentAngle('r');
	}

	/* ============= METHODS ============ */

	/****** Players *********/

	createPlayer(playerName, color) {

		let player = $('<span/>');
		player.addClass('player');
		player.prop('title', playerName);
		player.css('background-color', color);

		player.on('dblclick', (ev) => {
			this._askNewColor(playerName);
		});
		player.on('click', (ev) => {
			this.selectPlayer( playerName );
		});

		$('#players').append(player);

		return player;
	}

	selectedPlayer() {
		return $('#players .player.selected').prop('title');
	}

	getPlayerIcon(playerName) {
		return $(`#players .player[title="${playerName}"]`);
	}

	selectPlayer(playerName, ifNot = null ) {

		$('#players .player').removeClass('selected');
		let player = this.getPlayerIcon(playerName);

		if( ! player.length ) {

			if( ! ifNot ) // SHOULD NOT OCCURS
				return;

			player = this.getPlayerIcon(ifNot);
		}

		player.addClass('selected');
		this._recolorElements( player.css('background-color') );
	}

	firstPlayer() {
		return $('#players .player').first().prop('title');
	}

	/****** PLAYER COLOR *********/

	_askNewColor(playerName) {

		this.selectPlayer(playerName);
		$('#player-color').focus();
		$('#player-color').click();
	}

	_recolorElements(color) {

		for(let elem of $('#select_Elements img') ) {

			elem = $(elem);

			let type = elem.attr('data-type');
			let name = elem.attr('data-name');

			let new_content = this._ressources[type][name].colorContent(color);
			elem.attr('src', new_content);
		}

		this._updatePhantoms();
		this._updateHighlights();
	}

	/****** MAPS ********/

	currentMapName() {
		return $('#selectMap').val();
	}

	changeMap(mapName = this.currentMapName() ) {

		$('#selectMap').val(mapName);
		$('#delete-btn').prop('disabled', mapName == 'current' || mapName.startsWith('built-in:') );

		if( mapName == 'current') {
			if( ! this._loadCurrent() )
				this.changeMap('built-in:default');
			return;
		}

		this._board.import( Board.maps[mapName] );
	}

	_modifySavedMaps( fct ) {
		let maps = JSON.parse(localStorage.getItem('maps') ) || {};
		fct(maps);
		localStorage.setItem('maps', JSON.stringify(maps, null, 0));
	}

	_saveCurrent() {

		let cur = $('#selectMap').val();
		if( cur.startsWith('built-in:') || cur.startsWith('import:') )
			$('#selectMap').val('current');

		localStorage.setItem('maps.current', this._board.export() );
	}

	_loadCurrent() {

		let data = localStorage.getItem('maps.current');

		if( ! data)
			return false;

		this._board.import(data);

		return true;
	}

	selectedType() {

		let activeTab = $('#select_Elements_menu > li > a.active');

		return activeTab.attr('href').slice('#select_'.length);

	}

	selectedName() {
		let type = this.selectedType();
		if(type === 'Background')
			return null;
		return $(`#select_${type} .selected`).prop('id').slice(`Select_${type}-`.length);
	}

	selectType(type) {
		$(`#select_Elements_menu a[href="#select_${type}"]`).tab('show');

		this._updatePhantoms();
		this._updateHighlights();
	}

	selectElement(name) {
		
		let type = this.selectedType();

		$(`#select_${type} .selected`).removeClass('selected');
		$(`#Select_${type}-${name}`).addClass('selected');

		this._updatePhantoms();
		this._updateHighlights();
	}

	/****** LAYERS ********/
	_changeLayerLevel(layer_level) {

		this._current_level = layer_level;
		
		if(this._current_level < 0)
			this._current_level = 0;
		if(this._current_level >= this._layers.length)
			this._current_level = this._layers.length - 1;

		for(let i = 0; i < this._layers.length; ++i)
			this._canvas.showLayer(this._layers[i], i <= this._current_level && ! this._override_layers[this._layers[i]] );
	}

	/****** Highlight/Phantoms ********/

	_updateHighlights(new_pos = null) {

		if( new_pos === null ) {
			this._canvas.clearHighlights();
			this._prev_highlight = null;
			new_pos = this._last_pos;
		}

		if( ! new_pos )
			return;

		let nextHighlight = null;
		let coords = this._canvas.PixelsToCoord(...new_pos);
		if( coords ) {

			let angle = [null, null];
			if( this.selectedType() == 'Links' )
				angle = this._computeAngle( this._canvas.PixelsToAngle(...new_pos) );

			nextHighlight = [coords, ...angle];
		}

		if( this._prevHighlight ) {

			if( ! nextHighlight
				|| ! ElementsList.areKeysEqual(nextHighlight[0], this._prevHighlight[0])
				|| nextHighlight[1] != this._prevHighlight[1]
				|| nextHighlight[2] != this._prevHighlight[2]
				) {

				this._canvas.removeHighlight(...this._prevHighlight );
				this._prevHighlight = null;
			} else {
				nextHighlight = null;
			}
		}

		if( nextHighlight ) {
			this._canvas.addHighlight(...nextHighlight);
			this._prevHighlight = nextHighlight;
		}
	}

	_updatePhantoms(new_pos = null) {

		if( new_pos === null ) {
			this._canvas.clearPhantomElements();
			this._prev_phantoms = null;
			new_pos = this._last_pos;
		}

		if( ! new_pos )
			return;

		let nextPhantom = null;
		let coords = this._canvas.PixelsToCoord(...new_pos);
		if( coords && this.selectedName() ) {

			let name = this.selectedName();
			let type = this.selectedType();
			let owner = this.selectedPlayer();

			nextPhantom = [type, [name, owner], coords];
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

	_updateAngle(new_pos) {

		if( ! new_pos )
			return;

		let angle = this._canvas.PixelsToAngle(...new_pos);

		if( ! angle )
			return;

		angle = this._computeAngle( angle );
		this.setCurrentAngle(angle);
	}

	_computeAngle(angle) {

		let prec = 360/8;
		let offset = prec/2;

		angle = (angle - offset) % 360;

		let beg_angle = Math.floor( angle / prec) * prec;
		let end_angle = Math.ceil( angle / prec) * prec;


		beg_angle = (beg_angle + offset) % 360;
		end_angle = (end_angle + offset) % 360;

		return [beg_angle, end_angle];
	}

	currentAngle() {
		return this._lastAngle || 'r';
	}

	setCurrentAngle( angle ) {

		let angles = {
			'-22.5': 'r',
			'337.5': 'r',
			'22.5': 'rt',
			'67.5': 't',
			'112.5': 'lt',
			'157.5': 'l',
			'202.5': 'lb',
			'247.5': 'b',
			'292.5': 'rb'
		};

		if( typeof angle !== 'string')
			angle = angles[angle[0]];

		if(this._lastAngle == angle )
			return;

		this._lastAngle = angle;

		$('#select_Links img').addClass('d-none');
		$(`.Links_${angle}`).removeClass('d-none');

		let current = $('#select_Links .selected').attr('data-name');
		current = current.split('_');
		current[current.length - 1] = angle;
		current = current.join('_');
/*
		if( this.selectedType() == 'Links' )
			this.selectElement(current);
		else {*/
			$('#select_Links .selected').removeClass('selected');
			$(`#Select_Links-${current}`).addClass('selected');
		/*}*/
	}
}