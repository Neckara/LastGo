export class Game {

	constructor() {

	}

	_reset() {

	}

	changeMap(map) {
		this._reset();
		this._map = map;
	}

	map() {
		return this._map;
	}

	export() {

		let data = {
			map: this._map
		};

		return JSON.stringify(data, null, 0); //TODO - add MAP.
	}

	import(data) {

		if( typeof data == 'string' )
			data = JSON.parse(data);

		this.changeMap( data.map );
	}

	next() {
		console.log('next');
	}

	prev() {
		console.log('prev');
	}
}


Game.games = {};
{
	let req = require.context("./Games/", true, /\.json$/);
	req.keys().forEach(function(key){

		let name = key.slice(2,-5).replace(/\//g, '.');

		Game.games['built-in:' + name] = req(key);
	});
}