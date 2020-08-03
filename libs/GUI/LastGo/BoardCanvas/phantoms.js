import {ElementsList} from 'calc/LastGo/ElementsList.js';

export let methods = {};

methods['clearPhantomElements'] = function() {

	this._phantomElements = {};

	for(let layer in this._layers)
		if(layer.startsWith('Phantom') )
			this._layers[layer].clearRect(0, 0, this._w, this._h);
}

methods['addPhantomElement'] = function(type, elem, idx) {

	let ptype = `Phantom${type}`;

	this._phantomElements[ptype] = this._phantomElements[ptype] || new ElementsList(ptype);

	this._phantomElements[ptype].set(idx, elem);
	this._partialDrawElement({type: ptype, idx: idx});
}

methods['removePhantomElement'] = function(type, elem, idx) {

	let ptype = `Phantom${type}`;

	this._phantomElements[ptype].delete(idx);
	this._partialDrawElement({type: ptype, idx: idx});
}