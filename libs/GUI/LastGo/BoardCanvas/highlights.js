import {ElementsList} from 'calc/LastGo/ElementsList';

export let methods = {};



methods['clearHighlights'] = function() {
	this._highlights = new ElementsList('Highlights');
}

let default_color = 'rgba(225,225,225,0.5)';

methods['addHighlight'] = function(x, y, color, beg_angle, end_angle ) {

	if( Array.isArray(x) || typeof x === 'string' || typeof x === 'integer' && typeof y !== 'integer' )
		[ x, y, color, beg_angle, end_angle ] = [x, null, y, color, beg_angle, end_angle ];

	if( ! color )
		color = default_color;

	this._highlights.set(x, y, [color, beg_angle, end_angle] );
}

methods['removeHighlight'] = function(x, y) {
	this._highlights.delete(x, y);
}

methods['_drawHighlights'] = function(fulldraw = false) {

	let prev_highlights = this._prev_highlights;

	let layer = this._layers.Highlights;

	for( let idx of prev_highlights.keys() )
		if( ! this._highlights.hasEntry(idx, prev_highlights.get(idx) ) ) {
			this._clearCase(layer, idx);
			prev_highlights.delete(idx);
		}

	for( let idx of this._highlights.keys() )
		if( ! prev_highlights.hasEntry( idx, this._highlights.get(idx) ) ) {

			prev_highlights.set(idx, this._highlights.get(idx) );

			let [px, py] = this._CoordToPixels(idx);
			let [color, beg_angle, end_angle] = this._highlights.get(idx);
			layer.fillStyle = color;

			if( beg_angle == null ) {
				layer.fillRect(px, py, this._cw, this._cw);
				continue;
			}

			let cx = px + this._cw/2;
			let cy = py + this._cw/2;

			layer.beginPath();
			layer.moveTo(cx, cy);

			layer.lineTo( ... this._angleToCoord(beg_angle, cx, cy, this._cw) );

			if( beg_angle < 45 && end_angle > 45)
				layer.lineTo( ... this._angleToCoord(45, cx, cy, this._cw) );
			if( beg_angle < 135 && end_angle > 135)
				layer.lineTo( ... this._angleToCoord(135, cx, cy, this._cw) );
			if( beg_angle < 225 && end_angle > 225)
				layer.lineTo( ... this._angleToCoord(225, cx, cy, this._cw) );
			if( beg_angle < 315 && end_angle > 315)
				layer.lineTo( ... this._angleToCoord(315, cx, cy, this._cw) );

			layer.lineTo( ... this._angleToCoord(end_angle, cx, cy, this._cw) );

			layer.fill();
		}
}