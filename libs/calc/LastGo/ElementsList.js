export class ElementsList extends Map {

	constructor(type, ...args) {
		super(...args);
		this._type = type;
	}


	clone() {

		let data = Array.from( this.entries(), e => this._type.endsWith('Links') ? [e[0], {...e[1]}] : e );

		return new ElementsList( this._type, data );
	}

	set(...args) {

		let value = args[args.length - 1];
		let idx = ElementsList.getIDX( ...args.slice(0, -1) );

		return super.set(idx, value);
	}

	get(...args) {

		let idx = ElementsList.getIDX(...args);
		return super.get( idx );
	}

	has(...args) {

		let idx = ElementsList.getIDX(...args);
		return super.has( idx );
	}

	delete(...args) {

		let idx = ElementsList.getIDX(...args);
		return super.delete( idx );
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

	* strIDX_keys() {
		for(let key of super.keys() )
			yield ElementsList.getStrIDX(key);
	}

	* XY_keys() {
		for(let key of super.keys() )
			yield ElementsList.getXY(key);
	}

	static getIDX(x, y = null) {

		if( y === null) {

			if( typeof x === 'string')
				[x, y] = Array.from(x.split('x'), e => parseInt(e) );
			else if( Array.isArray(x) )
				[x, y] = x;
			else
				return x;
		}

		return (x << 16) + y;
	}

	static getXY(idx, y = null) {

		if( y !== null)
			return [idx, y];

		if( Array.isArray(idx) )
			return idx;

		if(typeof idx === 'string')
			idx = ElementsList.getIDX(idx);

		return [ (idx >> 16) & 0xFF, idx & 0xFF ];
	}

	static getStrIDX(x, y) {

		[x, y] = ElementsList.getXY(x, y);
		return x + 'x' + y;
	}
}