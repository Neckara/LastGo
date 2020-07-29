const $ = require('jquery');

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
			this._canvas.redraw();
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
			
			this._canvas.redraw();
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

			if( ev.which == 3) {

				this._board.removeElement(this._selectedElement[0], ...coords, z);
				this._canvas.redraw();
			}

			if( ev.which == 1) {
				this._board.addElement(... this._selectedElement, ...coords, z);
				this._canvas.redraw();
			}
		});

		let pthis = this;

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


		this._showLinks();
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