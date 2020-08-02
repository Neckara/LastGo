/*
	addPhantomElement(type, name, owner, x,y,z = null) {

		this._phantomElements[type] = this._phantomElements[type] || {};

		if( z === null)
			this._phantomElements[type][x + 'x' + y] = name + '@' + owner;
		else
			this._phantomElements[type][x + 'x' + y][z] = name + '@' + owner;
	}

	removePhantomElement(type, x,y,z = null) {

		if(z === null)
			delete this._phantomElements[type][x + 'x' + y];
		else
			delete this._phantomElements[type][x + 'x' + y][z];
	}

	clearPhantomElements() {
		this._phantomElements = {};
	}


	_phantomElement_changes() {

		let changes = [];

		let types = new Set(...Object.keys(this._prevPhantomElements),
							...Object.keys(this._phantomElements) );

		for(let type of types) {

			let ptype = this._prevPhantomElements[type] || {};
			let ctype = this._phantomElements[type] || {};

			let keys = new Set(	...Object.keys(ptype),
								...Object.keys(ctype) );

			for(let key of keys) {

				if(ptype[key] === undefined || ctype[key] === undefined ) {
					changes.push(key);
					continue;
				}

				if( typeof ptype[key] == 'string' && typeof ctype[key] == 'string') {

					if( ptype[key] != ctype[key] )
						changes.push(key);
					continue;
				}

				if(		typeof ptype[key] == 'string' && typeof ctype[key] != 'string'
					||  typeof ptype[key] != 'string' && typeof ctype[key] == 'string') {
					changes.push(key);
					continue;
				}

				let zs = new Set(	...Object.keys(ptype[key]),
									...Object.keys(ctype[key]) );

				for(let z of zs)
					if( ptype[key][z] != ctype[key][z])
						changes.push(key);
			}
		}

		return changes;
	}*/