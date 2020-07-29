export class BoardCanvas {

	constructor(board, canvas, ressources) {
		this._board = board;

		this._canvas = canvas;
		this._ressources = ressources;
		this._ctx = this._canvas[0].getContext("2d");

		this._highlights = [];
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
		let cw = this._cw = Math.floor( Math.min(
													(this._canvas[0].width - 2*boffset - size[0]*lw) / size[0],
													(this._canvas[0].height - 2*boffset- size[1]*lw) / size[1] )
												);
		let left_offset = this._loffset = Math.ceil( (this._canvas[0].width - lw - (cw+lw) * size[0])/2);
		let top_offset = this._toffset = Math.ceil( (this._canvas[0].height - lw - (cw+lw) * size[1])/2);

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

	// https://www.mathsisfun.com/polar-cartesian-coordinates.html
	PixelsToAngle(px, py) {

		let [x, y] = this.PixelsToCoord(px, py);
		let [tpx, tpy] = this._CoordToPixels(x, y);

		px -= tpx;
		py -= tpy;

		px = (px - this._cw/2);
		py = (py - this._cw/2);

		let angle = Math.atan( py / px ) / Math.PI * 180;
		if( px < 0)
			angle += 180;

		if( px > 0 &&  py < 0 )
			angle += 360;

		return 360 - angle;
	}

	_drawImage(img, x, y) {

		img = img.image() || img;

		let pos = this._CoordToPixels(x, y);
		this._ctx.drawImage(img, 0, 0, img.width, img.height, pos[0], pos[1], this._cw, this._cw);
	}

	clearHighlights() {
		this._highlights.length = 0;
	}

	highlight(x, y, beg_angle = null, end_angle = null, color = 'rgba(225,225,225,0.5)') {

		if( end_angle === null && beg_angle !== null) {
			color = beg_angle;
			beg_angle = null;
		}

		this._highlights.push([x, y, beg_angle, end_angle, color = 'rgba(225,225,225,0.5)']);
	}

	_angleToCoord(angle, cx, cy, cw) {

		let isCos = ! (angle > 45 && angle < 135 || angle > 225 && angle < 315);

		angle = 360 - angle;
		angle = angle / 180 * Math.PI;

		if( isCos )
			cw = cw / Math.cos(angle);
		else
			cw = cw / Math.sin(angle);

		cw = Math.abs(cw);

		let x = cw/2 * Math.cos(angle);
		let y = cw/2 * Math.sin(angle);

		return [cx + x, cy + y];
	}

	_drawHighlight() {

		for(let [x, y, beg_angle, end_angle, color] of this._highlights) {
			let pos = this._CoordToPixels(x, y);
			this._ctx.fillStyle = color;

			if( beg_angle == null)
				this._ctx.fillRect(pos[0], pos[1], this._cw, this._cw);
			else {

				let cx = pos[0] + this._cw/2;
				let cy = pos[1] + this._cw/2;

				this._ctx.beginPath();
			    this._ctx.moveTo(cx, cy);

				this._ctx.lineTo( ... this._angleToCoord(beg_angle, cx, cy, this._cw) );

				if( beg_angle < 45 && end_angle > 45)
					this._ctx.lineTo( ... this._angleToCoord(45, cx, cy, this._cw) );
				if( beg_angle < 135 && end_angle > 135)
					this._ctx.lineTo( ... this._angleToCoord(135, cx, cy, this._cw) );
				if( beg_angle < 225 && end_angle > 225)
					this._ctx.lineTo( ... this._angleToCoord(225, cx, cy, this._cw) );
				if( beg_angle < 315 && end_angle > 315)
					this._ctx.lineTo( ... this._angleToCoord(315, cx, cy, this._cw) );

			    this._ctx.lineTo( ... this._angleToCoord(end_angle, cx, cy, this._cw) );

			    //this._ctx.moveTo(pos[0], pos[1]);
			    //this._ctx.lineTo(pos[0], pos[1] + this._cw);
			    this._ctx.fill();
			}
		}
	}

	_drawElements(type) {

		let elements = this._board.getElements(type);

		let size = this._bsize;

		for(let key in elements) {

			let name = elements[key];
			let coords = Array.from( key.split('x'), e => parseInt(e) );

			if(coords[0] < 0 || coords[0] >= size[0] || coords[1] < 0 || coords[1] >= size[1])
				continue;

			let imgs = typeof name == 'string' ?
											  [ name ]
											: Object.values(elements[key])

			for(let img of imgs) {
				img = this._ressources[type][img];
				this._drawImage(img, ...coords);
			}
		}

	}

	redraw() {

		this._canvas[0].width = this._canvas.width();
		this._canvas[0].height = this._canvas.height();

		this._drawBackground();
		this._drawGrid();

		this._drawElements('links');
		this._drawElements('bases');
		this._drawElements('pawns');


		this._drawHighlight();
	}
}