import {ElementsList} from './ElementsList.js';

export class GameRules {

	constructor(game, board) {

		this._board = board;
		this._game = game;
	}

	getLimits(current_player, idx) {

		if( this._board.getElements('Pawns').has(idx) ) {

			let [name, player] = this._board.getElements('Pawns').get(idx);
			let PAWN = this._getRule('Pawns', name);
			return PAWN.limits(this._context(), player, idx);	
		}

		if( ! this._board.getElements('Bases').has(idx) )
			return false;

		let BASE = this._getRuleAt('Bases', idx);

		return BASE.limits(this._context(), current_player, idx);
	}

	canPutPawn(type, [name, owner], idx, z = null) {

		if( this.isEndOfGame() )
			return false;

		if( type != 'Pawns' || z !== null || owner != this._game.currentPlayer() )
			return false;

		let PAWN = this._getRule('Pawns', name);
		if( ! PAWN.canPutPawn(this._context(), [name, owner], idx) )
			return false;

		let simulate = this.putPawn(type, [name, owner], idx, z, true);

		return simulate;
	}

	_nextPlayer() {

		let currentPlayer = this._game.currentPlayer();

		let players = this._game.players();
		let scores = this._game.scores();

		let idx = (players[currentPlayer][0] + 1) % scores.length;
		
		return scores[idx][0];
	}

	putPawn(type, [name, owner], idx, z = null, simulate = false) {

		if( ! simulate && ! this.canPutPawn(type, [name, owner], idx, z) )
			return false;

		let PAWN = this._getRule('Pawns', name);
		let consequencies = PAWN.putPawn(this._context(), type, [name, owner], idx);

		let action = {
			action: {
				type: 'put',
				what: {
					type: type,
					name: name,
					player: owner
				},
				where: idx
			},
			consequencies: {
				...consequencies,
				next_player: this._nextPlayer()
			}
		};

		if( simulate )
			return ! this._game.hasIdenticalState(action);

		return this._game.addAction(action);
	}

	isEndOfGame() {
		return this._game.isEndOfGame();
	}

	_computeFinalBases() {

		let size = this._board.boardSize();

		let result = {};
		for(let player in this._game.players() )
			result[player] = [];
		result['Neutral'] = [];

		for(let i = 0; i < size[0]; ++i)
			for(let j = 0; j < size[0]; ++j) {

				let idx = ElementsList.getIDX([i,j]); // optimize

				if( this._board.getElements('Pawns').has(idx) ) {
					let [name, owner] = this._board.getElements('Pawns').get(idx);
					result[owner].push(idx);
					continue;
				}
				
				if( ! this._board.getElements('Bases').has(idx) )
					continue;

				let [name, owner] = this._board.getElements('Bases').get(idx);

				if(owner == 'Neutral') {

					let limits = this.getLimits('Neutral', idx );

					let others = [...new Set([... Array.from(limits.enemies, e => e[0])])];
				
					if(others.length == 1)
						owner = others[0];
				}

				result[owner].push(idx);
			}

		return result;
	}

	finalResult() {

		let result = this._computeFinalBases();

		for(let key in result)
			result[key] = [ key === 'Neutral' ? this._game.neutralColor(): this._game.players()[key][1],   result[key] ];

		return result;
	}

	pass(player) {

		if( this.isEndOfGame() )
			return false;

		if( player != this._game.currentPlayer() )
			return false;

		if( this._game.allPreviousPassed() ) {

			let final = this._computeFinalBases();

			let scores = {};

			for(let player in final) {

				if(player == 'Neutral')
					continue;

				let sum = 0;

				for(let idx of final[player] ) {

					let BASE = this._getRuleAt('Bases', idx);
					sum += BASE.points(this._context(), player, idx);
				}

				scores[player] = sum;
			}

			this._game.addAction({
				action: { type: 'end' },
				consequencies: {
					added: [],
					deleted: [],
					scores: Object.entries(scores),
					next_player: this._nextPlayer()
				}
			});

			return true;
		}

		this._game.addAction({
			action: { type: 'pass' },
			consequencies: {
				added: [],
				deleted: [],
				scores: [],
				next_player: this._nextPlayer()
			}
		});

		return true;
	}




	_context() {
		return {
			rules: this,
			board: this._board
		}
	}

	_getRule(type, name) {

		let rule = GameRules.rules[type][name];
		if(rule)
			return rule;

		return GameRules.rules[type]['built-in:default'];
	}

	_getRuleAt(type, idx) {

		let [name, owner] = this._board.getElements(type).get(idx);

		return this._getRule(type, name);
	}
}


GameRules.rules = {};
{
	let req = require.context("./Elements/", true, /\.js$/);
	req.keys().forEach(function(key){


		let name = key.slice(2,-3).split('/');

		let type = name[0];
		name = name.slice(1).join('.');

		GameRules.rules[type] = GameRules.rules[type] || {};
		GameRules.rules[type]['built-in:' + name] = req(key).default;
	});
}