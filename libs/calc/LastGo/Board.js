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

	setBoardSize(w, h) { //TODO HOOK

		if( w > 0x7FFF || h > 0x7FFF )
			throw new Error(`Board size is too big ! ${w}x${h}`);

		this._boardSize = [w, h];
	}

	getElement(elem) {

		if( Array.isArray(elem) )
			return elem;

		if( typeof elem == 'string')
			return elem.split('@');

		throw new Error('Unknown format: ' + elem); 
	}

	getElementName(elem) {

		return this.getValue(elem)[0];
	}

	getElementOwner(elem) {

		return this.getValue(elem)[1];
	}

	getStrElement(elem) {

		if( typeof elem == 'string' )
			return elem;

		return elem.join('@');
	}

	getElements(type) {
		return this._elements[type] || new ElementsList(type);
	}

	removeElement(type, elem, idx, z = null) { //TODO HOOK

		if( type !== 'Links' )
			return this._elements[type].delete(idx);
		
		if( ! this._elements[type].has(idx) )
			return;

		delete this._elements[type].get(idx)[z];
	}

	clearElements() {
		this._elements = {};

		this.setBoardSize(...this.boardSize() ); // Force redraw h4ck.
	}

	addElement(type, elem, idx, z = null) { //TODO HOOK
		
		this._elements[type] = this.getElements(type);

		elem = this.getElement(elem);

		if(type !== 'Links')
			return this._elements[type].set(idx, elem);
		
		if( ! this._elements[type].has(idx) )
			this._elements[type].set(idx, {});

		return this._elements[type].get(idx)[z] = elem;
	}
	

	players() {
		return this._players;
	}

	modifyPlayer(name, color) {
		this._players[name] = color; //TODO HOOK => Change colors

		// Force element recoloring.		
		for(let type in this._elements)
			for(let [key, element] of this._elements[type].entries() ) {

				if( type !== 'Links') {

					if( this.getElementOwner(element) == name )
						this.addElement(type, idx);

					continue;
				}

				for(let key in element)
					if( this.getElementOwner(element[key]) == name )
						this.addElement(type, idx, key);
			}
	}

	addPlayer(name, color) {
		return this.modifyPlayer(name, color);
	}

	removePlayer(name) { //TODO HOOK => Remove colors.

		if(name === 'Neutral')
			return false;

		for(let type in this._elements)
			for(let [key, element] of this._elements[type].entries() ) {

				if( type !== 'Links') {

					if( this.getElementOwner(element) == name )
						this.removeElement(type, idx);

					continue;
				}

				for(let key in element)
					if( this.getElementOwner(element[key]) == name )
						this.removeElement(type, idx, key);
			}

		delete this._players[name];

		return true;
	}

	export(sort = false) {

		let elements = {};

		for(let type in this._elements ) {

			elements[type] = {};

			for(let strIDX of this._elements[type].keys('strIDX') ) {

				elements[type][ strIDX ] = this._elements[type].get(strIDX);

				if( type !== 'Links') {

					elements[type][ strIDX ] = this.getStrElement( elements[type][ strIDX ] );
					continue;
				}
				if(sort) {

					for(let key in elements[type][ strIDX ] )
						elements[type][ strIDX ][key] = this.getStrElement( elements[type][ strIDX ][key] );
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

		this._elements = {}; // prevent redraws.

		for(let old_player in this.players() )
			this.removePlayer(old_player);

		for(let player in json.players)
			this.addPlayer(player, json.players[player]);
		
		for(let type in json.elements)
			this._elements[type] = new ElementsList(type);

		for(let type in this._elements)
			for(let key in json.elements[type]) {

				let value = json.elements[type][key];

				if(type !== 'Links') {
					this._elements[type].set(key, this.getElement(value) );
					continue;
				}

				let obj = {};
				for(let key in value)
					obj[key] = this.getElement( value[key] );
				this._elements[type].set(key, obj);
			}

		this.setBoardSize( ... json.board_size ); // Force redraw.
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