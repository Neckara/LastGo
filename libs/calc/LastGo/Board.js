import {ElementsList} from 'calc/LastGo/ElementsList';

export class Board {

	constructor() {

		this._boardSize = [9,9];
		this._elements = {};

		this._players = {};
	}

	boardSize() {
		return this._boardSize;
	}

	setBoardSize(w, h) {

		if( w > 0x7FFF || h > 0x7FFF )
			throw new Error(`Board size is too big ! ${w}x${h}`);

		this._boardSize = [w, h];
	}

	getValue( elem, owner = null) {

		if( owner !== null)
			return [elem, owner];

		if( Array.isArray(elem) )
			return elem;

		return elem.split('@');
	}

	getStrValue( elem, owner = null) {
		
		if( owner !== null)
			return elem + '@' + owner;

		if( Array.isArray(elem) )
			return elem.join('@');

		return elem;
	}

	getElements(type) {
		return this._elements[type] = this._elements[type] || new ElementsList(type);
	}

	clearElements() {
		this._elements = {};
	}

	symmetricalRemoveElement(owner, type, name, x, y, z = null) {
		return this.removeElement(type, x, y, z);
	}

	removeElement(type, x, y, z = null) {

		if( typeof y === 'string' )
			[y, z] = [undefined, y];

		if( type !== 'Links' )
			return this._elements[type].delete(x, y);
		
		if( ! this._elements[type].has(x, y) )
			return;

		delete this._elements[type].get(x, y)[z];
	}

	addElement(owner, type, name, x, y, z = null) {

		if( typeof y === 'string' )
			[y, z] = [undefined, y];
		
		this._elements[type] = this.getElements(type);
		let value = [name, owner];

		if(type !== 'Links')
			return this._elements[type].set(x, y, value);
		
		if( ! this._elements[type].has(x, y) )
			this._elements[type].set(x, y, {});

		return this._elements[type].get(x, y)[z] = value;
	}
	

	players() {
		return this._players;
	}

	modifyPlayer(name, color) {
		this.addPlayer(name, color);
	}

	addPlayer(name, color) {
		this._players[name] = color;
	}

	delPlayer(name) {

		console.log('del player');
		return;
		//TODO !!!
		for(let type in this._elements)
			for(let key in this._elements[type]) {

				let element = this._elements[type][key];
				let [x, y] = Array.from( key.split('x') , e => parseInt(e) );

				if( typeof element === 'string') {


					if( element.endsWith('@' + name) )
						this.removeElement(type, x, y);

					continue;
				}

				for(let z in element)
					if( element[z].endsWith('@' + name) )
						this.removeElement(type, x, y, z);
			}

		delete this._players[name];
	}

	export(sort = false) {

		let elements = {};

		for(let type in this._elements ) {

			elements[type] = {};

			for(let strIDX of this._elements[type].strIDX_keys() ) {

				elements[type][ strIDX ] = this._elements[type].get(strIDX);

				if( type !== 'Links') {

					elements[type][ strIDX ] = this.getStrValue( elements[type][ strIDX ] );
					continue;
				}
				if(sort) {

					for(let key in elements[type][ strIDX ] )
						elements[type][ strIDX ][key] = this.getStrValue( elements[type][ strIDX ][key] );
					elements[type][strIDX] = Object.fromEntries(Object.entries(elements[type][strIDX]).sort());
				}
			}

			if(sort)
				elements[type] = Object.fromEntries(Object.entries(elements[type]).sort());
		}

		if(sort)
			elements = Object.fromEntries(Object.entries(elements).sort());

		let json = {
			board_size: this.boardSize(),
			players: this.players(),
			elements: elements
		};
		
		return JSON.stringify(json, null, 0);
	}

	import( data ) {

		let json = data;

		if( typeof json == 'string')
			json = JSON.parse(data);

		this.setBoardSize( ... json.board_size );

		for(let player in json.players)
			this.addPlayer(player, json.players[player]);

		this._elements = {};
		for(let type in json.elements)
			this._elements[type] = new ElementsList(type);

		for(let type in this._elements)
			for(let key in json.elements[type]) {

				let value = json.elements[type][key];

				if(type !== 'Links') {
					this._elements[type].set(key, this.getValue(value) );
					continue;
				}

				let obj = {};
				for(let key in value)
					obj[key] = this.getValue( value[key] );
				this._elements[type].set(key, obj);
			}
	}
}



Board.maps = {};

{
	let req = require.context("./Maps/", true, /\.json$/);
	req.keys().forEach(function(key){

		let name = key.slice(2,-5).replace(/\//g, '.');

		Board.maps['built-in:' + name] = req(key);
	});
}