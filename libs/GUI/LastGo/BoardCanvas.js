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
						'Highlights',
						'Links', 'PhantomLinks',
						'Bases', 'PhantomBases',
						'Pawns', 'PhantomPawns',
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

		$(window).on('resize', () => {
			this._fullDraw();
		});

		this._board.addEventListener('Board.SIZE_CHANGED Board.IMPORTED', (ev) => {
			this._fullDraw();
		});

		this._board.addEventListener('Board.ELEMENT_ADDED Board.ELEMENT_REMOVED', (ev) => {
			this._partialDrawElement(ev.data);
		});

		this._board.addEventListener('Board.PLAYER_MODIFIED', (ev) => {
			this._partialDraw();
		});

		this._board.addEventListener('Board.PLAYER_REMOVED', (ev) => {
			
			delete this._players[ev.data.name];
			this._unloadUnusedColored();
		});

		this._fullDraw();
	}

	showLayer(layer, show = true) {
		$(this._canvas[layer]).toggleClass('d-none', ! show );
	}

	_missingPlayers() {

		let players = {...this._board.players()};

		if( ! this._players )
			return this._players = players;

		let missing = {};

		for(let player in players )
			if( ! this._players[player] || this._players[player] != players[player] )
				missing[player] = players[player];

		this._players = players;
		return missing;
	}

	_partialDrawElement({type, idx}) {

		if( this._waitingForFulldraw )
			return;

		if( this._waitingForPartialDraw ) {
			(this._partialOperations[type] = this._partialOperations[type] || new Set()).add(idx);
			return;
		}

		let isPhantom = type.startsWith('Phantom');
		let elements = isPhantom ? this._phantomElements[type] : this._board.getElements(type);

		this._drawElement(type, elements.get(idx), idx);
	}

	async _partialDraw() {

		if( this._waitingForFulldraw || this._waitingForPartialDraw)
			return;

		this._waitingForPartialDraw = true;

		let missing_players;
		while( ! $.isEmptyObject(missing_players = this._missingPlayers() ) ) {

			this._partialLoadAllColored = Ressources.loadAllColored(this._ressources, missing_players );
			await this._partialLoadAllColored;
			this._partialLoadAllColored = undefined;

			if( this._cancelPartialDraw ) {
				this._cancelPartialDraw = false;
				return;
			}
		}

		for(let type in this._partialOperations ) {
			let elements = type.startsWith('Phantom') ? this._phantomElements[type] : this._board.getElements(type);
			for(let idx of this._partialOperations[type] )
				this._drawElement(type, elements.get(idx), idx);
		}
	
		this._waitingForPartialDraw = false;
	}

	_unloadUnusedColored() {
		Ressources.unloadUnusedColored(this._ressources, this._players);
	}

	async _fullDraw() {

		if( this._waitingForFulldraw )
			return;
		this._waitingForFulldraw = true;

		this._partialOperations = {};
		this._phantomElements = {};

		if( this._waitingForPartialDraw ) {
			this._cancelPartialDraw = true;
			this._waitingForPartialDraw = false;
		}

		if( this._partialLoadAllColored !== undefined )
			await this._partialLoadAllColored;

		let missing_players;
		while( ! $.isEmptyObject(missing_players = this._missingPlayers() ) )
			await Ressources.loadAllColored(this._ressources, missing_players );

		this._unloadUnusedColored();

		this._w = this._target.width();
		this._h = this._target.height();
		this._boardSize = this._board.boardSize();

		for(let layer in this._layers) {

			this._canvas[layer].width = this._w;
			this._canvas[layer].height = this._h;

			this._layers[layer].clearRect(0, 0, this._w, this._h);
		}

		this._drawBackground();
		this._drawGrid();

		for(let type of ['Links', 'Bases', 'Pawns'] )
			this._drawElements(type);

		this._waitingForFulldraw = false;

		this._board.dispatchTargetEvent('FULLY_REDRAWED', {});
	}

	_drawImage(type, img, owner, idx) {

		let [px, py] = this._CoordToPixels(idx);

		img = img.image(owner) || img;

		if( type.startsWith('Phantom') )
			this._layers[type].globalAlpha = 0.75;
		this._layers[type].drawImage(img, 0, 0, img.width, img.height, px, py, this._cw, this._cw);
		if( type.startsWith('Phantom') )
			this._layers[type].globalAlpha = 1;
	}

	_drawElement(type, elements, idx, clear = true) {

		if(clear)
			this._clearCase(type, idx);

		if( ! elements )
			return;

		let size = this._boardSize;
		let coords = ElementsList.getXY(idx);

		if(coords[0] < 0 || coords[0] >= size[0] || coords[1] < 0 || coords[1] >= size[1])
			return;

		let to_draws = type === 'Links' ? Object.values(elements ) : [ elements ];

		let isPhantom = type.startsWith('Phantom');
		let ptype = isPhantom ? type.slice('Phantom'.length) : type;

		for(let [name, owner] of to_draws) {
			let img = this._ressources[ptype][name];
			this._drawImage(type, img, owner, coords);
		}
	}

	_clearCase(layer, idx) {

		if( typeof layer === 'string')
			layer = this._layers[layer];

		let [px, py] = this._CoordToPixels(idx);
		layer.clearRect( px, py, this._cw, this._cw );
	}

	_drawElements(type, elements = this._board.getElements(type) ) {

		for(let idx of elements.keys() )
			this._drawElement(type, elements.get(idx), idx, false);
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