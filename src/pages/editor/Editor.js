const $ = require('jquery');
import {Board} from 'calc/LastGo/Board.js';
import {ElementsList} from 'calc/LastGo/ElementsList';

window.$ = $;

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

export class Editor {


	constructor(board, canvas, ressources) {

		this._board = board;
		this._canvas = canvas;
		this._ressources = ressources;

		this._selectedElement = null;
		this._lastAngle = 'r';

		// Grid size
		$('#board_width, #board_height').on('input', () => {

			let w = parseInt( $('#board_width').val() );
			let h = parseInt( $('#board_height').val() );

			if( ! Number.isInteger(w) || w < 1)
				w = 1;
			if( ! Number.isInteger(h) || h < 1)
				h = 1;

			this._board.setBoardSize(w, h);
		});

		let setBoardSize = this._board.setBoardSize;
		this._board.setBoardSize = function(w, h) {
			setBoardSize.call(this, w, h);
			$('#board_width').val(w);
			$('#board_height').val(h)
		}

		$('canvas').on("contextmenu", (ev) => {

			let coords = this._canvas.PixelsToCoord(ev.pageX, ev.pageY);
			if(coords != null)
				ev.preventDefault();
		});

		$('canvas').mousemove( (ev) => {
			let px = ev.pageX;
			let py = ev.pageY;

			this._prev_highlight = this._prev_highlight || [null, [null, null] ];

			let coords = this._canvas.PixelsToCoord(px, py);

			let current_highlight = [coords, [null, null]];

			if( coords === null && this._prev_highlight[0] !== null )
				this._canvas.removeHighlight(this._prev_highlight[0]);

			if(coords !== null) {

				let angle = [null, null];
				if( this._selectedElement && this._selectedElement[0] == 'Links') {
					angle = this._canvas.PixelsToAngle(px, py);

					let prec = 360/8;
					let offset = prec/2;

					angle = (angle - offset) % 360;

					let beg_angle = Math.floor( angle / prec) * prec;
					let end_angle = Math.ceil( angle / prec) * prec;


					beg_angle = (beg_angle + offset) % 360;
					end_angle = (end_angle + offset) % 360;

					this._lastAngle = angles[beg_angle];
					this._showLinks();

					angle = current_highlight[1] = [beg_angle, end_angle];
				}

				if( 	this._prev_highlight[0] === null
					||	! ElementsList.areKeysEqual(coords, this._prev_highlight[0])
					||  angle[0] !==  this._prev_highlight[1][0]
					||	angle[1] !==  this._prev_highlight[1][1]
					) {

					if( this._prev_highlight[0] !== null )
						this._canvas.removeHighlight(this._prev_highlight[0]);
					this._canvas.addHighlight(coords, ...angle);
				}
			}

			this._prev_highlight = current_highlight;
		});

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
			if( layer == 'Grid')
				layer = 'Background';

			let tab = $(`#select_Elements_menu a[href="#select_${layer}"]`);
			if( ! tab.hasClass('active') )
				tab.click();
		});

		$('canvas').mouseup( (ev) => {

			if(this._selectedElement === null)
				return;

			let [type, name] = this._selectedElement;

			let px = ev.pageX;
			let py = ev.pageY;
			let coords = this._canvas.PixelsToCoord(px, py);

			if(coords == null)
				return;

			let z;
			if( type == 'Links')
				z = this._lastAngle;

			if( ev.which != 3 && ev.which != 1)
				return;

			if( ev.which == 1)
				this._board.addElement(type, [name, this.selectedPlayer()], coords, z);
			if( ev.which == 3)
				this._board.removeElement(type, null, coords, z);

			this._saveCurrent();
		});

		let pthis = this;

		this._last_color_change = null;

		$('#player-color').on('change', () => {

			let color = $('#player-color').val();

			let name = this._last_color_change;

			let player = $('#players .player[title="'+ name +'"]');

			this._board.modifyPlayer(name, color);
			this._updatePlayers();

			this._saveCurrent();
		});


		$('#addplayer-btn').click( ev => {

			ev.preventDefault();

			let player = prompt('Enter a name for your player');

			if( ! player )
				return;

			if( this._board.players()[player] !== undefined ) {
				alert('User already exists !');
				return;
			}

			let color = $('#player-color').val();
			this._board.addPlayer(player, color)
			this._updatePlayers();

			this._saveCurrent();

			let element = $('#players .player[title="'+ player +'"]');
			element.trigger('dblclick');
		});

		$('#delplayer-btn').click( ev => {

			ev.preventDefault();

			let name = $('#players .player.selected').attr('title');

			if(! name || name == 'Neutral')
				return;

			this._board.removePlayer(name);
			this._updatePlayers();

			this._saveCurrent();
		});

		// Select element
		$('#select_Elements_menu > li > a').on('shown.bs.tab', (ev) => {

			let href = $(ev.target).attr('href');

			let type = href.slice('#select_'.length);
			let layer = this._layers.indexOf(type);

			if( layer < this._currentLayer )
				this._changeLayerLevel( layer );

			if( type === 'Background') {

				this._selectedElement = null;
				return;
			}

			$( href ).children().first().trigger('click');

			if( type === 'Links')
				this._showLinks();
		});

		$('#select_Elements').children().each( function() {

			let elem = $(this);

			let type = elem.attr('id').slice('select_'.length);
			let res = pthis._ressources[type] || {};

			elem.empty();

			for(let name in res) {

				let img = res[name].image().cloneNode();
				elem.append( img );

				img = $(img);
				img.attr('data-type', type);
				img.attr('data-name', name);
				img.attr('title', name);
				img.prop('id', 'Select_' + type + '-' + name.replace(/\./g, '-') );

				if(type == 'Links')
					img.addClass('Links_' + name.split('_').slice(-1)[0]);

				img.click( () => {

					if( pthis._selectedElement !== null) {
						let id = '#Select_' + pthis._selectedElement.join('.').replace(/\./g, '-');
						$( id ).removeClass('selected');
					}
					pthis._selectedElement = [img.attr('data-type'), img.attr('data-name')];
					img.addClass('selected');
				});
			}

		});

		$('#clear-btn').click( (ev) => {

			ev.preventDefault();

			this._board.clearElements();
			this._saveCurrent();
		});

		$('#delete-btn').click( (ev) => {

			ev.preventDefault();

			let map = $('#selectMap').val();

			let maps = JSON.parse(localStorage.getItem('maps') ) || {};
			delete maps[map];
			localStorage.setItem('maps', JSON.stringify(maps, null, 0));

			$("#selectMap option[value='"+ map +"']").remove();

			$('#selectMap').val('current');
			$('#selectMap').trigger('change');
		});

		$('#save-btn').click( (ev) => {

			ev.preventDefault();
			let map = $('#selectMap').val();

			if( map == 'current' || map.startsWith('built-in:') || map.startsWith('import:') ) {
				
				map = prompt("Please enter a name for your map", "");
				if( ! map )
					return;

				map = 'saved:' + map;

				$("#selectMap option[value='"+ map +"']").remove();
				$('#selectMap').append( new Option(map, map, true, true) );
				$('#selectMap').val(map);

				$('#delete-btn').prop('disabled', map == 'current' || map.startsWith('built-in:') );
			}

			let maps = JSON.parse(localStorage.getItem('maps') ) || {};
			maps[map] = Board.maps[map] = JSON.parse(this._board.export());
			localStorage.setItem('maps', JSON.stringify(maps, null, 0));
		});

		$('#export-btn').click( (ev) => {

			ev.preventDefault();
			let data = this._board.export();

			download(data, 'map.json', 'json');
		});

		$('#import-btn').click( async (ev) => {

			ev.preventDefault();

			let [file, data] = await upload();

			file = 'import:' + file;
			Board.maps[file] = JSON.parse(data);

			$("#selectMap option[value='"+ map +"']").remove();
			let current_option = new Option(file, file, true, true);
			$('#selectMap').append( current_option );
			$('#selectMap').trigger('change');

			let maps = JSON.parse(localStorage.getItem('maps') ) || {};
			maps[file] = Board.maps[file];
			localStorage.setItem('maps', JSON.stringify(maps, null, 0));
		});

		this._showLinks();

		let current_option = new Option('current', 'current', true, true);
		$('#selectMap').append( current_option );


		let maps = JSON.parse(localStorage.getItem('maps') ) || {};
		for(let map in maps)
			Board.maps[map] = maps[map];

		for(let map in Board.maps)
			$('#selectMap').append( new Option(map, map) );

		$('#selectMap').on('change', () => {

			let selected = $('#selectMap').val();

			$('#delete-btn').prop('disabled', selected == 'current' || selected.startsWith('built-in:') );

			if( selected == 'current') {
				
				if( ! this._loadCurrent() ) {
					$('#selectMap').val('built-in:default');
					$('#selectMap').trigger('change');
				}
				return;
			}

			this._board.import( Board.maps[selected] );
			this._updatePlayers();
		});

		$('#selectMap').trigger('change');
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
		this._updatePlayers();

		return true;
	}

	_changeLayerLevel(layer_level) {

		this._current_level = layer_level;
		
		if(this._current_level < 0)
			this._current_level = 0;
		if(this._current_level >= this._layers.length)
			this._current_level = this._layers.length - 1;

		for(let i = 0; i < this._layers.length; ++i)
			this._canvas.showLayer(this._layers[i], i <= this._current_level && ! this._override_layers[this._layers[i]] );
	}

	selectedPlayer() {
		return $('#players .player.selected').prop('title');
	}

	_updatePlayers() {

		let selected = $('#players .player.selected').attr('title');

		$('#players').empty();

		let players =  this._board.players();

		for(let name in players ) {

			let color = players[name];

			let parent = $('#players');

			let player = $('<span/>');
			player.addClass('player');
			player.prop('title', name);

			player.css('background-color', color);

			player.on('dblclick', (ev) => {
				
				this._last_color_change = name;

				$('#player-color').focus();
				$('#player-color').click();

			});

			player.click( (ev) => {

				$('#players .player').removeClass('selected');
				player.addClass('selected');

				let pthis = this;
				$('#select_Elements img').each( function () {

					let elem = $(this);

					let type = elem.attr('data-type');
					let name = elem.attr('data-name');

					let new_content = pthis._ressources[type][name].colorContent( player.css('background-color') );
					elem.attr('src', new_content);
				});
			});

			parent.append(player);
		}

		selected = $('#players .player[title="' + selected + '"');

		if( selected.length > 0)
			selected.trigger('click');
		else 
			$('#players .player').first().trigger('click');
	}

	_showLinks() {

		$('#select_Links img').addClass('d-none');
		$('#select_Links img.Links_' + this._lastAngle).removeClass('d-none');

		if( this._selectedElement && this._selectedElement[0] == 'Links') {

			let newSelected = this._selectedElement[1].split('_');
			newSelected[newSelected.length-1] = this._lastAngle;
			newSelected = newSelected.join('_')
			$('#select_Links img#Select_Links-' + newSelected).trigger('click');
		}
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