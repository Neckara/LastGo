import {ElementsList} from 'calc/LastGo/ElementsList';


export let methods = {};

methods._CoordToPixels = function (idx) {

	let [x, y] = ElementsList.getXY(idx);

	let px = this._loffset + x * this._cw;
	let py = this._toffset + y * this._cw;

	return [px, py];
}

methods.PixelsToCoord = function (px, py) {

	let x = Math.floor( (px - this._loffset) / this._cw );
	let y = Math.floor( (py - this._toffset) / this._cw );

	let bs = this._board.boardSize();

	if( x < 0 || y < 0 || x >= bs[0] || y >= bs[1] )
		return null;

	return [x, y];
}

// https://www.mathsisfun.com/polar-cartesian-coordinates.html
methods.PixelsToAngle = function (px, py) {

	let [tpx, tpy] = this._CoordToPixels( this.PixelsToCoord(px, py) );

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

methods._angleToPixels = function (angle, cx, cy, cw) {

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