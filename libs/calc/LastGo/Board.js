export class Board {

	constructor() {

		this._boardSize = [9,9];
		this._elements = {};
	}

	addElement(type, name, x, y, z = null) {

		this._elements[type] = this._elements[type] || {};

		if( z === null )
			return this._elements[type][x + 'x' + y] = name;
		
		this._elements[type][x + 'x' + y] = this._elements[type][x + 'x' + y] || {};
		return this._elements[type][x + 'x' + y][z] = name;
	}

	getElements(type) {
		return this._elements[type] || {};
	}
	
	boardSize() {
		return this._boardSize;
	}

	setBoardSize(w, h) {
		this._boardSize = [w, h];
	}
}