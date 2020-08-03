import {Ressources} from './Ressources.js';
import {ElementsList} from 'calc/LastGo/ElementsList';

const $ = require('jquery');

export class BoardCanvas {

	constructor(board, target, ressources, gridWidth = 1) {

		this._ressources = ressources;
		this._board = board;
		this._gw = gridWidth;

		this._target = target;

		let layers = [
						'Background',
						'Links', 'PhantomLinks',
						'Bases', 'PhantomBases',
						'Pawns', 'PhantomPawns',
						'Highlights',
						'Grid'
					];

		this._layers = {};
		this._canvas = {};

		for(let layer_name of layers ) {
			let layer = $('<canvas/>');
			this._canvas[layer_name] = layer[0];
			this._layers[layer_name] = layer[0].getContext("2d");
			this._target.append(layer);
		}

		this._highlights = new ElementsList('Highlights');
		this._phantomElements = {};

		let handleFrame = () => {

			window.requestAnimationFrame( handleFrame );

			this._draw();
		};

		window.requestAnimationFrame( handleFrame );
	}

	showLayer(layer, show = true) {
		$(this._canvas[layer]).toggleClass('d-none', ! show );
	}

	_draw() {

		let fulldraw = false;

		let new_w = this._target.width();
		let new_h = this._target.height();

		if( this._w !== new_w || this._h !== new_h ) {

			this._w = new_w;
			this._h = new_h
			fulldraw = true;
		}

		if( this._boardSize !== this._board.boardSize() ) {

			this._boardSize = this._board.boardSize();
			fulldraw = true;
		}

		if( fulldraw ) {

			for(let layer in this._layers) {
				
				this._canvas[layer].width = this._w;
				this._canvas[layer].height = this._h;

				this._layers[layer].clearRect(0, 0, this._w, this._h);
			}

			this._prevElements = {};
			this._prev_highlights = new ElementsList('Highlights');
			this._drawBackground();
			this._drawGrid();
		}

		this._playersToRedraw = Ressources.loadAllColored(this._ressources, this._board.players() );

		for(let type of ['Links', 'Bases', 'Pawns'] ) {

			this._drawElements(type, fulldraw);
			this._drawPhantomElements(type, fulldraw);
		}

		this._drawHighlights( fulldraw );
	}


	_drawImage(type, img, owner, idx) {

		img = img.image(owner) || img;

		if( ! img || ! img.complete )
			return false;

		let [px, py] = this._CoordToPixels(idx);
		this._layers[type].drawImage(img, 0, 0, img.width, img.height, px, py, this._cw, this._cw);

		return true;
	}

	_clearCase(layer, idx) {

		if( typeof layer === 'string')
			layer = this._layers[layer];

		let [px, py] = this._CoordToPixels(idx);
		layer.clearRect( px, py, this._cw, this._cw );
	}

	_drawPhantomElements(type, fulldraw = false) {

		return this._drawElements('Phantom' + type, fulldraw, new ElementsList( type ) ); //TODO
	}

	_hasToRedraw( type, element ){

		if( ! type.endsWith('Links') )
			return this._playersToRedraw.has( type + '.' + element[0] + '.' + element[1] );

		for(let key in element)
			if( this._playersToRedraw.has( type + '.' + element[key][0] + '.' + element[key][1]) )
				return true;
		return false;
	}

	_drawElements(type, fulldraw = false, elements = this._board.getElements(type) ) {

		let prev = this._prevElements[type] = this._prevElements[type] || new ElementsList( type );


		for(let idx of prev.keys() ) {

			if( ! elements.hasEntry(idx, prev.get(idx) ) || this._hasToRedraw(type, prev.get(idx) ) ) {
				this._clearCase(type, idx);
				prev.delete(idx);
			}
		}

		let size = this._boardSize;
		for(let idx of elements.keys() ) {

			if( prev.hasEntry(idx, elements.get(idx) ) )
				continue;

			let coords = ElementsList.getXY(idx);

			if(coords[0] < 0 || coords[0] >= size[0] || coords[1] < 0 || coords[1] >= size[1]) {
				this._clearCase(type, idx);
				continue;
			}

			let succeed = true;

			if( ! type.endsWith('Links') ) {

				let [name, owner] = elements.get(idx);
				let img = this._ressources[type][name];
				if( ! this._drawImage(type, img, owner, coords) )
					succeed = false;
			} else {

				this._clearCase(type, idx);

				for(let [name, owner] of Object.values(elements.get(idx) ) ) {

					let img = this._ressources[type][name];
					if( ! this._drawImage(type, img, owner, coords) )
						succeed = false;
				}
			}

			if( succeed )
				prev.setFrom(elements, idx);
		}
	}

	_drawBackground() {
		//TODO personnalize backgrounds.
		let layer = this._layers.Background;
		layer.fillStyle = "green";
		layer.fillRect(0, 0, this._w, this._h);
	}

	_drawGrid() {

		let size = this._boardSize;
		let boffset = 20;

		let gw = this._gw;
		let cw = this._cw = Math.floor( Math.min(
										(this._w - 2*boffset) / size[0],
										(this._h - 2*boffset) / size[1] )
									);

		let left_offset = this._loffset = Math.ceil( (this._w - cw * size[0])/2);
		let top_offset =  this._toffset = Math.ceil( (this._h - cw * size[1])/2);

		let layer = this._layers.Grid;
		layer.fillStyle = "black";

		// vlines
		for(let i = 0; i <= size[0]; ++i)
			layer.fillRect(left_offset + i * cw - gw, top_offset - gw, gw, gw + cw * size[1] );

		// hlines
		for(let i = 0; i <= size[1]; ++i)
			layer.fillRect(left_offset - gw, top_offset + cw * i - gw, gw + cw * size[0], gw);
	}
}

{
	let req = require.context("./BoardCanvas/", true, /\.js$/);
	req.keys().forEach(function(key){

		let methods = req(key).methods;

		for(let name in methods)
			BoardCanvas.prototype[name] = methods[name];
	});
}