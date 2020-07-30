const $ = require('jquery');
import {Board} from 'calc/LastGo/Board.js';

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
			this._canvas.draw();
		});
		$('#board_width').trigger('input');

		$('canvas').on("contextmenu", (ev) => {

			let coords = this._canvas.PixelsToCoord(ev.pageX, ev.pageY);
			if(coords != null)
				ev.preventDefault();
		});

		$('canvas').mousemove( (ev) => {
			let px = ev.pageX;
			let py = ev.pageY;
			let coords = this._canvas.PixelsToCoord(px, py);

			this._canvas.clearHighlights();

			if(coords !== null) {

				let angle = [];
				if( this._selectedElement && this._selectedElement[0] == 'links') {
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

					angle = [beg_angle, end_angle];
				}


				this._canvas.highlight(...coords, ...angle);
			}
			
			this._canvas.draw();
		});



		$('canvas').mouseup( (ev) => {

			if(this._selectedElement === null)
				return;

			let px = ev.pageX;
			let py = ev.pageY;
			let coords = this._canvas.PixelsToCoord(px, py);

			if(coords == null)
				return;

			let z;
			if( this._selectedElement[0] == 'links')
				z = this._lastAngle;

			if( ev.which != 3 && ev.which != 1)
				return;

			if( ev.which == 1)
				this._board.addElement(this.selectedPlayer(), ... this._selectedElement, ...coords, z);
			if( ev.which == 3)
				this._board.removeElement(this._selectedElement[0], ...coords, z);

			this._canvas.draw();
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

			this._canvas.draw();
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

			this._board.delPlayer(name);
			this._updatePlayers();

			this._canvas.draw();
			this._saveCurrent();
		});

		// Select element
		$('#select_Elements').children().each( function() {

			let elem = $(this);

			let type = elem.attr('id').slice('select_'.length).toLowerCase();
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

				if(type == 'links')
					img.addClass('links_' + name.split('_').slice(-1)[0]);

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

			this._board.removeAllElements();
			this._canvas.draw();

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
			this._canvas.draw();
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
		this._canvas.draw();

		return true;
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
		$('#select_Links img.links_' + this._lastAngle).removeClass('d-none');

		if( this._selectedElement && this._selectedElement[0] == 'links') {

			let newSelected = this._selectedElement[1].split('_');
			newSelected[newSelected.length-1] = this._lastAngle;
			newSelected = newSelected.join('_')
			$('#select_Links img#Select_links-' + newSelected).trigger('click');
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