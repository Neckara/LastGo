export class BoardCanvas {

	constructor(board, canvas) {
		this._board = board;

		this._canvas = canvas;
		this._ctx = this._canvas[0].getContext("2d");
	}


	_drawBackground() {

		this._ctx.fillStyle = "green";
		this._ctx.fillRect(0, 0, this._canvas[0].width, this._canvas[0].height);
	}

	_drawGrid() {

		this._ctx.fillStyle = "black";

		//TODO move own function.
		let size = this._bsize = this._board.boardSize();
		let boffset = 20;
		let lw = this._lw = 1;
		let cw = this._cw = Math.floor( Math.min( (this._canvas[0].width - 2*boffset) / size[0], (this._canvas[0].height - 2*boffset) / size[1] ) );
		let left_offset = this._loffset = Math.ceil( (this._canvas[0].width - cw * size[1])/2);
		let top_offset = this._toffset = Math.ceil( (this._canvas[0].height - cw * size[0])/2);

		// vlines
		for(let i = 0; i <= size[0]; ++i)
			this._ctx.fillRect(left_offset + (cw+lw) * i, top_offset, lw, lw + (cw+lw) * size[1] );

		// hlines
		for(let i = 0; i <= size[1]; ++i)
			this._ctx.fillRect(left_offset, top_offset + (cw+lw) * i, lw + (lw+cw) * size[0], lw);
	}

	_CoordToPixels(x, y) {

		let px = this._loffset + this._lw + x * (this._cw + this._lw);
		let py = this._toffset + this._lw + y * (this._cw + this._lw);

		return [px, py];
	}

	PixelsToCoord(px, py) {

		let x = Math.floor( (px - this._loffset - this._lw) / (this._cw + this._lw) );
		let y = Math.floor( (py - this._toffset - this._lw) / (this._cw + this._lw) );

		let bs = this._bsize;

		if( x < 0 || y < 0 || x >= bs[0] || y >= bs[1] )
			return null;

		return [x, y];
	}

	_drawImage(img, x, y) {
		let pos = this._CoordToPixels(x, y);
		this._ctx.drawImage(img, 0, 0, img.width, img.height, pos[0], pos[1], this._cw, this._cw);
	}

	_drawHighlight(x, y) { //TODO REMOVE.

		//TODO COLORS.
		let pos = this._CoordToPixels(x, y);
		this._ctx.fillStyle = 'rgba(225,225,225,0.5)'; //"black";
		this._ctx.fillRect(pos[0], pos[1], this._cw, this._cw);
	}

	redraw() {

		this._canvas[0].width = this._canvas.width();
		this._canvas[0].height = this._canvas.height();

		this._drawBackground();
		this._drawGrid();
	}
}