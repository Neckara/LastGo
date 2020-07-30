export class Board {

	constructor() {

		this._boardSize = [9,9];
		this._elements = {};


		this._players = {};

		this._changedCases = new Set();
	}

	addPlayer(name, color) {
		this._players[name] = color;
	}

	removeElement(type, x, y, z = null, extraY = null, extraZ = null) {

		if( extraY !== null) {
			type = x;
			x = z;
			y = extraY;
			z = extraZ;
		}

		if( z === null && this._elements[type][x + 'x' + y] === undefined)
			return;
		if( z !== null && (! this._elements[type][x + 'x' + y] || this._elements[type][x + 'x' + y][z] === undefined) )
			return;

		this._changedCases.add(x + 'x' + y);

		if( z === null )
			delete this._elements[type][x + 'x' + y];
		
		if(this._elements[type][x + 'x' + y])
			delete this._elements[type][x + 'x' + y][z];
	}

	removeAllElements() {
		this._elements = {};
		this._hasStructChanged = true;
	}

	addElement(owner, type, name, x, y, z = null) {

		this._elements[type] = this._elements[type] || {};

		let value = name + '@' + owner;

		if( z === null && this._elements[type][x + 'x' + y] == value)
			return;
		if( z !== null && this._elements[type][x + 'x' + y] && this._elements[type][x + 'x' + y][z] == value)
			return;

		this._changedCases.add(x + 'x' + y);

		if( z === null )
			return this._elements[type][x + 'x' + y] = value;
		
		this._elements[type][x + 'x' + y] = this._elements[type][x + 'x' + y] || {};
		return this._elements[type][x + 'x' + y][z] = value;
	}

	getElements(type) {
		return this._elements[type] || {};
	}
	
	boardSize() {
		return this._boardSize;
	}

	players() {
		return this._players;
	}

	setBoardSize(w, h) {
		this._boardSize = [w, h];
		this._hasStructChanged = true;
	}


	export() {

		let json = {
			board_size: this.boardSize(),
			players: this.players(),
			elements: this._elements
		};
		
		return JSON.stringify(json, null, 0);
	}

	import( data ) {

		let json = data;

		if( typeof json == 'string')
			json = JSON.parse(data);

		this.setBoardSize( ... json.board_size );

		for(let player in json.players)
			this.addPlayer(player, json.players[player]);

		this._elements = $.extend(true, {}, json.elements);

		this._hasStructChanged = true;
	}

	_structHasChangedSinceLastTime() {
		let changed = this._hasStructChanged;

		this._hasStructChanged = false;

		return changed;
	}

	_getModifiedCases() {

		let changes = new Set([...this._changedCases]);

		this._changedCases.clear();

		return changes;
	}
}



Board.maps = {};

{
	let req = require.context("./Maps/", true, /\.json$/);
	req.keys().forEach(function(key){

		let name = key.slice(2,-5).replace(/\//g, '.');

		Board.maps['built-in:' + name] = req(key);
	});
}