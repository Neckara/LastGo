export class Board {

	constructor() {

		this._boardSize = [9,9];
	}
	
	boardSize() {
		return this._boardSize;
	}

	setBoardSize(w, h) {
		this._boardSize = [w, h];
	}
}