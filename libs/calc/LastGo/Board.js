import {ElementsList} from 'calc/LastGo/ElementsList';
import {Ev, EvTarget} from 'GUI/Utils/EvTarget.js';


class BoardEvent extends Ev {

	constructor(name, data ) {
		super('Board.' + name, data);
	}
}

export class Board extends EvTarget {

	constructor() {

		super(BoardEvent);

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

		this.dispatchTargetEvent( 'SIZE_CHANGED' );
	}

	getElement(elem) {

		if( Array.isArray(elem) )
			return elem;

		if( typeof elem == 'string')
			return elem.split('@');

		throw new Error('Unknown format: ' + elem); 
	}

	getElementName(elem) {

		return this.getElement(elem)[0];
	}

	getElementOwner(elem) {

		return this.getElement(elem)[1];
	}

	getStrElement(elem) {

		if( typeof elem == 'string' )
			return elem;

		return elem.join('@');
	}

	getElements(type) {
		return this._elements[type] || new ElementsList(type);
	}

	removeElement(type, elem, idx, z = null) {

		if( type !== 'Links' ) {
			this._elements[type].delete(idx);
		} else {
			if( ! this._elements[type].has(idx) )
				return;
			delete this._elements[type].get(idx)[z];
		}

		this.dispatchTargetEvent('ELEMENT_REMOVED', {type: type, elem: null, idx: idx});
	}

	clearElements() {
		this._elements = {};
		this.setBoardSize(...this.boardSize() ); // Force redraw h4ck.
	}

	addElement(type, elem, idx, z = null) {
		
		this._elements[type] = this.getElements(type);

		elem = this.getElement(elem);

		if(type !== 'Links') {
			this._elements[type].set(idx, elem);
		} else {
		
			if( ! this._elements[type].has(idx) )
				this._elements[type].set(idx, {});

			this._elements[type].get(idx)[z] = elem;
		}

		this.dispatchTargetEvent('ELEMENT_ADDED', {type: type, elem: elem, idx: idx});
	}
	

	players() {
		return this._players;
	}

	modifyPlayer(name, color) {

		if( color.length == 7)
			color = color + 'ff';

		this._players[name] = color;

		this.dispatchTargetEvent('PLAYER_MODIFIED', {name: name, color: color});

		// Force element recoloring.		
		for(let type in this._elements)
			for(let [idx, element] of this._elements[type].entries() ) {

				if( type !== 'Links') {

					if( this.getElementOwner(element) == name )
						this.addElement(type, element, idx);

					continue;
				}

				for(let key in element)
					if( this.getElementOwner(element[key]) == name )
						this.addElement(type, element[key], idx, key);
			}
	}

	addPlayer(name, color) {
		return this.modifyPlayer(name, color);
	}

	removePlayer(name) {

		if(name === 'Neutral')
			return false;

		for(let type in this._elements)
			for(let [idx, element] of this._elements[type].entries() ) {

				if( type !== 'Links') {

					if( this.getElementOwner(element) == name )
						this.removeElement(type, null, idx);

					continue;
				}

				for(let key in element)
					if( this.getElementOwner(element[key]) == name )
						this.removeElement(type, null, idx, key);
			}

		delete this._players[name];

		this.dispatchTargetEvent('PLAYER_REMOVED', {name: name});

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
		this._players = json.players; // prevent redraws.
		
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

		this._boardSize = json.board_size;
		this.dispatchTargetEvent('IMPORTED');
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