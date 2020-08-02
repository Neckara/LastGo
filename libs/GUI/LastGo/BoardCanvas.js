import {Ressources} from './Ressources.js';
import {ElementsList} from 'calc/LastGo/ElementsList';

const $ = require('jquery');

export class BoardCanvas {

	constructor(board, target, ressources, gridWidth = 1) {

		this._ressources = ressources;
		this._board = board;
		this._lw = gridWidth;

		this._target = target;

		let layers = [
						'Background', 'Grid',
						'Links', 'PhantomLinks',
						'Bases', 'PhantomBases',
						'Pawns', 'PhantomPawns',
						'Highlights'
					];

		this._layers = {};
		this._layersID = {};
		this._canvas = {};

		let layerID = 0;
		for(let layer_name of layers) {
			let layer = $('<canvas/>');
			this._canvas[layer_name] = layer[0];
			this._layers[layer_name] = layer[0].getContext("2d");
			this._target.append(layer);
			this._layersID[layer_name] = ++layerID;
		}
		this._drawLevel = layers.length;

		this._highlights = new ElementsList('Highlights');
		this._phantomElements = {};

		let handleFrame = () => {

			window.requestAnimationFrame( handleFrame );

			this._draw();
		};

		window.requestAnimationFrame( handleFrame );
	}

	setDrawLevel(drawLevel) {

		if( typeof drawLevel === 'string')
			drawLevel = this._layersID[drawLevel] + 1;

		this._drawLevel = drawLevel;
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

		//TODO LOAD RESSOURCES => IF NOT LOADED : DO NOT ADD IT !!/ => Will force redraw next frame.
		//TODO PUT COLORS AGAIN.
		// await Ressources.loadAllColored(this._ressources, this._board.players() );
		//  player changed => Elements associated to player (only).

		for(let type of ['Links', 'Bases', 'Pawns'] ) {

			this._drawElements(type, fulldraw);
			this._drawPhantomElements(type, fulldraw);
		}

		this._drawHighlights( fulldraw );
	}


	_drawImage(type, img, owner, x, y) {

		img = img.image() || img; //TODO OWNER

		let [px, py] = this._CoordToPixels(x, y);
		this._layers[type].drawImage(img, 0, 0, img.width, img.height, px, py, this._cw, this._cw);
	}

	_clearCase(layer, x, y = null) {

		if( typeof layer === 'string')
			layer = this._layers[layer];

		let [px, py] = this._CoordToPixels(x, y);
		layer.clearRect( px, py, this._cw, this._cw );
	}

	_drawPhantomElements(type, fulldraw = false) {

		return this._drawElements('Phantom' + type, fulldraw, new ElementsList( type ) );
	}

	_drawElements(type, fulldraw = false, elements = this._board.getElements(type) ) {

		if( this._drawLevel <= this._layersID[type] )
			return;

		let prev = this._prevElements[type] || new ElementsList( type );

		for(let idx of prev.keys() ) {

			if( ! elements.hasEntry(idx, prev.get(idx) ) )
				this._clearCase(type, idx);
		}


		let nextElements = elements.clone();

		let size = this._boardSize;
		for(let idx of elements.keys() ) {

			if( prev.hasEntry(idx, elements.get(idx) ) ) //TODO PLAYER COLORS ???
				continue;

			let coords = ElementsList.getXY(idx);

			if(coords[0] < 0 || coords[0] >= size[0] || coords[1] < 0 || coords[1] >= size[1])
				continue;

			if( ! type.endsWith('Links') ) {

				let [name, owner] = elements.get(idx);
				let img = this._ressources[type][name];
				this._drawImage(type, img, owner, ...coords);
			} else {

				for(let [name, owner] of Object.values(elements.get(idx) ) ) {

					let img = this._ressources[type][name];
					this._drawImage(type, img, owner, ...coords);
				}
			}
		}

		this._prevElements[type] = nextElements;
	}

	_drawBackground() {
		//TODO personnalize backgrounds.

		if( this._drawLevel <= this._layersID.Background )
			return;

		let layer = this._layers.Background;
		layer.fillStyle = "green";
		layer.fillRect(0, 0, this._w, this._h);
	}

	_drawGrid() {


		if( this._drawLevel <= this._layersID.Grid )
			return;

		let size = this._boardSize;
		let boffset = 20;
		let lw = this._lw;
		let cw = this._cw = Math.floor( Math.min(
													(this._w - 2*boffset - size[0]*lw) / size[0],
													(this._h - 2*boffset- size[1]*lw) / size[1] )
												);
		let left_offset = this._loffset = Math.ceil( (this._w - lw - (cw+lw) * size[0])/2);
		let top_offset = this._toffset = Math.ceil( (this._h - lw - (cw+lw) * size[1])/2);


		let layer = this._layers.Grid;
		layer.fillStyle = "black";

		// vlines
		for(let i = 0; i <= size[0]; ++i)
			layer.fillRect(left_offset + (cw+lw) * i, top_offset, lw, lw + (cw+lw) * size[1] );

		// hlines
		for(let i = 0; i <= size[1]; ++i)
			layer.fillRect(left_offset, top_offset + (cw+lw) * i, lw + (lw+cw) * size[0], lw);
	}
}

window.__test = false;

{
	let req = require.context("./BoardCanvas/", true, /\.js$/);
	req.keys().forEach(function(key){

		let methods = req(key).methods;

		for(let name in methods)
			BoardCanvas.prototype[name] = methods[name];
	});
}