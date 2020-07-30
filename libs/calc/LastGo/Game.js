import {Board} from 'calc/LastGo/Board.js';

export class Game {

	constructor(board) {
		this._board = board;
	}

	_reset() {

		this._board.import( Board.maps[this._map] );

		this._scores = Array.from( Object.entries(this._board.players()).filter(e => e[0] != 'Neutral'), e => [e[0], 0, e[1]]);

		let next_player = this._scores[0];

		this._history = [{
				action: { type: 'start' },
				consequencies: {
					added: [],
					deleted: [],
					scores: [],
					next_player: next_player[0]
				}
			}];
		this._cur = 0;
	}

	//TODO compare states (has same state = in rules)

	addAction(action) {

		if( typeof action == 'string')
			action = JSON.parse(action);

		action.action.timespamp = Date.now();
		action.action.date = new Date().toLocaleDateString('ja-JP') + ' ' + new Date().toLocaleTimeString('ja-JP');

		this._history.length = this._cur + 1;
		this._history.push(action);
		
		return this.next();
	}

	next() {
		return this.setCur(this._cur+1);
	}

	prev() {
		return this.setCur(this._cur-1);
	}

	setCur(cur) {

		if( cur < 0)
			return false;
		if( cur >= this._history.length)
			return false;

		let direction = this._cur < cur ? 1 : -1;

		while ( this._cur != cur ) {

			if( direction == 1)
				this._cur += direction;

			for(let score of this._history[this._cur].consequencies.scores) {
				let idx = this._scores.findIndex( e => e[0] == score[0]);
				this._scores[idx][1] += direction * score[1];
			}

			let {added, deleted} = this._history[this._cur].consequencies;

			if( direction == -1)
				[added, deleted] = [deleted, added];

			for(let del of deleted) {
				console.log('del');
				this._board.removeElement(...del);
			}

			for(let add of added) {
				console.log('add');
				this._board.addElement(...add);
			}

			if( direction == -1)
				this._cur += direction;
		}
		
		return true;
	}

	changeMap(map) {

		this._map = map;		
		this._reset();
	}

	map() {
		return this._map;
	}

	scores() {
		return this._scores;
	}

	currentPlayer() {
		return this._history[this._cur].consequencies.next_player;
	}

	export() {

		let data = {
			map: this._map,
			history: this._history,
			cur: this._cur
		};

		return JSON.stringify(data, null, 0); //TODO - add MAP.
	}

	import(data) {

		if( typeof data == 'string' )
			data = JSON.parse(data);

		this.changeMap( data.map );
		if(data.history) {
			this._history = data.history;
			this.setCur( data.cur );
		}
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