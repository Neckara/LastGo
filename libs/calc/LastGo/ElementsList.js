export class ElementsList {

	constructor(type, ...args) {
		
		this._internal = new Map();
		this._type = type;
	}


	_cloneValue(value) {
		return this._type.endsWith('Links') ? {...value} : value;
	}

	clone() {

		let data = Array.from( this.entries(), e => [e[0], this._cloneValue(e[1])] );

		return new ElementsList( this._type, data );
	}

	set(idx, value) {

		idx = ElementsList.getIDX(idx);
		return this._internal.set(idx, value);
	}

	setFrom(elem_list, idx) {

		return this._internal.set( idx, this._cloneValue( elem_list.get(idx) ) );
	}

	get(idx) {

		idx = ElementsList.getIDX(idx);
		return this._internal.get( idx );
	}

	has(idx) {

		idx = ElementsList.getIDX(idx);
		return this._internal.has( idx );
	}

	delete(idx) {

		idx = ElementsList.getIDX(idx);
		return this._internal.delete( idx );
	}


	areEqual(a, b, __internal = false) {

		if( __internal || ! this._type.endsWith('Links') )
			return a[0] == b[0] && a[1] == b[1] && a[2] == b[2];

		if( Object.keys(a).length != Object.keys(b).length )
			return false;

		for(let key in a)
			if( ! this.areEqual(a[key], b[key], true) )
				return false;

		return true;
	}

	hasEntry(idx, value) {
		return this.has(idx) && this.areEqual( this.get(idx), value );
	}

	* keys(format = null) {

		if(format === null) {
			yield* this._internal.keys();
			return;
		}

		let formatter = ElementsList[`get${format}`];

		for(let key of this._internal.keys() )
			yield formatter(key);
	}

	* values() {
		yield* this._internal.values();
	}

	* entries(format = null) {

		if(format === null) {
			yield*  this._internal.entries();
			return;
		}

		let formatter = ElementsList[`get${format}`];

		for(let [key, value] of this._internal.entries() )
			yield [formatter(key), value];
	}

	static areKeysEqual(a, b) {

		if( !a && !b)
			return true;
		if( a && !b || !a && b)
			return false;
		return ElementsList.getIDX(a) === ElementsList.getIDX(b);
	}

	static getIDX(idx) {

		if( Number.isInteger(idx) )
			return idx;

		idx = ElementsList.getXY(idx);

		return (idx[0] << 16) + idx[1];
	}

	static getXY(idx) {

		if( Array.isArray(idx) )
			return idx;

		if( Number.isInteger(idx) )
			return [ (idx >> 16) & 0xFF, idx & 0xFF ];

		if(typeof idx === 'string')
			return Array.from( idx.split('x'), e => parseInt(e) );

		throw new Error('Unknown format: ' + idx); 
	}

	static getstrIDX(idx) {
		return ElementsList.getStrIDX(idx);
	}
	static getStrIDX(idx) {

		if( typeof idx === 'string')
			return idx;

		return ElementsList.getXY(idx).join('x');
	}
}