export let methods = {};

methods['clearHighlights'] = function() {
	this._layers.Highlights.clearRect(0, 0, this._w, this._h);
}

let default_color = 'rgba(225,225,225,0.5)';

methods['addHighlight'] = function(idx, color = null, beg_angle = null, end_angle = null) {

	if( beg_angle !== null && end_angle === null)
		[color, beg_angle, end_angle] = [null, color, beg_angle];

	if( ! color )
		color = default_color;

	this._clearCase('Highlights', idx);
	this._drawHighlight(idx, color, beg_angle, end_angle);
}

methods['removeHighlight'] = function(idx) {
	this._clearCase('Highlights', idx);
}

methods['_drawHighlight'] = function (idx, color, beg_angle, end_angle) {

	let layer = this._layers.Highlights;
	let [px, py] = this._CoordToPixels(idx);

	layer.fillStyle = color;

	if( beg_angle == null ) {
		layer.fillRect(px, py, this._cw, this._cw);
		return;
	}

	let cx = px + this._cw/2;
	let cy = py + this._cw/2;

	layer.beginPath();
	layer.moveTo(cx, cy);

	layer.lineTo( ... this._angleToPixels(beg_angle, cx, cy, this._cw) );

	if( beg_angle < 45 && end_angle > 45)
		layer.lineTo( ... this._angleToPixels(45, cx, cy, this._cw) );
	if( beg_angle < 135 && end_angle > 135)
		layer.lineTo( ... this._angleToPixels(135, cx, cy, this._cw) );
	if( beg_angle < 225 && end_angle > 225)
		layer.lineTo( ... this._angleToPixels(225, cx, cy, this._cw) );
	if( beg_angle < 315 && end_angle > 315)
		layer.lineTo( ... this._angleToPixels(315, cx, cy, this._cw) );

	layer.lineTo( ... this._angleToPixels(end_angle, cx, cy, this._cw) );

	layer.fill();
}