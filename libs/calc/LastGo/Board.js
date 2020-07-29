export class Board {

	constructor() {

		this._boardSize = [9,9];
		this._elements = {};


		this._players = {};
	}

	addPlayer(name, color) {
		this._players[name] = color;
	}

	removeElement(type, x, y, z = null) {

		if( z === null )
			delete this._elements[type][x + 'x' + y];
		
		if(this._elements[type][x + 'x' + y])
			delete this._elements[type][x + 'x' + y][z];
	}

	addElement(owner, type, name, x, y, z = null) {

		this._elements[type] = this._elements[type] || {};

		if( z === null )
			return this._elements[type][x + 'x' + y] = name + '@' + owner;
		
		this._elements[type][x + 'x' + y] = this._elements[type][x + 'x' + y] || {};
		return this._elements[type][x + 'x' + y][z] = name + '@' + owner;
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
	}
}