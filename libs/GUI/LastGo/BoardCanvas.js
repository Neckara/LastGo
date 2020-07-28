export class BoardCanvas {

	constructor(board, canvas) {
		this._board = board;

		this._canvas = canvas;
		this._ctx = this._canvas[0].getContext("2d");
	}


	drawBackground() {

		this._ctx.fillStyle = "green";
		this._ctx.fillRect(0, 0, this._canvas[0].width, this._canvas[0].height);
	}

	drawGrid() {

		let size = this._board.boardSize();

		this._ctx.fillStyle = "black";

		let boffset = 20;
		let lw = 1;

		let cw = Math.floor( Math.min( (this._canvas[0].width - 2*boffset) / size[0], (this._canvas[0].height - 2*boffset) / size[1] ) );

		let left_offset = Math.ceil( (this._canvas[0].width - cw * size[1])/2);
		let top_offset = Math.ceil( (this._canvas[0].height - cw * size[0])/2);

		// vlines
		for(let i = 0; i <= size[0]; ++i)
			this._ctx.fillRect(left_offset + cw * i, top_offset, lw, cw * size[1] );

		// hlines
		for(let i = 0; i <= size[1]; ++i)
			this._ctx.fillRect(left_offset, top_offset + cw * i, cw * size[0], lw);
	}


	redraw() {

		this._canvas[0].width = this._canvas.width();
		this._canvas[0].height = this._canvas.height();

		this.drawBackground();

		this.drawGrid();
	}
}