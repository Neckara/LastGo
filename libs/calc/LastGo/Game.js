import {Board} from 'calc/LastGo/Board.js';

import {Ev, EvTarget} from 'GUI/Utils/EvTarget.js';


class GameEvent extends Ev {

	constructor(name, data ) {
		super('Game.' + name, data);
	}
}

export class Game extends EvTarget {

	constructor(board) {
		super(GameEvent);
		this._board = board;

		this._board.addEventListener('Board.FULLY_REDRAWED', () => {
			this.dispatchTargetEvent('FULLY_REDRAWED');
		});

	}

	hasIdenticalState(action) {

		let history = this._history;
		let cur = this._cur;

		let simulate = new Board();
		simulate.import( Board.maps[this._map] ); //TODO Optimize

		let states = new Set();

		for(let i = 0; i <= cur; ++i) {

			this._applyAction( simulate, this._history[i] );
			states.add( simulate.export(true) );
		}

		this._applyAction( simulate, action );

		return states.has( simulate.export(true) );
	}

	isEndOfGame() {
		return this._history[this._cur].action.type === 'end';
	}

	allPreviousPassed() {

		if(this._cur < this._scores.length - 1) // because first one is start
			return false;

		for(let i = 0; i < this._scores.length - 1; ++i)
			if( this._history[this._cur - i].action.type !== 'pass' )
				return false;

		return true;
	}

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


	_applyAction(board, action, direction = 1) {

		let {added, deleted} = action.consequencies;

		if( direction == -1)
			[added, deleted] = [deleted, added];

		for(let del of deleted)
			board.removeElement(...del);

		for(let add of added)
			board.addElement(...add);
	}

	setCur(cur) {
		return this._setCur(cur, false);
	}

	_setCur(cur, _imported) {

		if( cur < 0)
			return false;
		if( cur >= this._history.length)
			return false;

		let direction = this._cur < cur ? 1 : -1;

		while ( this._cur != cur ) {

			if( direction == 1)
				this._cur += direction;

			for(let score of this._history[this._cur].consequencies.scores) {
				let idx = this._players[score[0]][0];
				this._scores[idx][1] += direction * score[1];
			}

			this._applyAction(this._board, this._history[this._cur], direction);


			if( direction == -1)
				this._cur += direction;
		}

		if( ! _imported )
			this.dispatchTargetEvent('STATE_CHANGED', {});
		
		return true;
	}

	changeMap(map) {
		return this._changeMap(map);
	}

	_changeMap(map, _history = null, _new_cur = 0) {

		this._map = map;
		this._reset();

		if( _history )
			this._history = _history;

		this._setCur(_new_cur, !!_history);
	}

	map() {
		return this._map;
	}

	_reset() {

		this._board.import( Board.maps[this._map] );

		this._scores = Array.from( Object.entries(this._board.players()).filter(e => e[0] != 'Neutral'), e => [e[0], 0, e[1]]);

		this._players = {};
		for(let i = 0; i < this._scores.length; ++i)
			this._players[ this._scores[i][0] ] = [i, this._scores[i][2]];

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
		this._states = new Set();
	}

	neutralColor() {

		return this._board.players()['Neutral'];
	}

	scores() {
		return this._scores;
	}

	players() {
		return this._players;
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

		this._changeMap( data.map, data.history, data.cur );

		this.dispatchTargetEvent('IMPORTED', {});
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