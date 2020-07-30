export class GameRules {

	constructor(game, board) {

		this._board = board;
		this._game = game;
	}

	_getRuleFor(type, name) {

		let rule = GameRules.rules[type][name];
		if(rule)
			return rule;

		return GameRules.rules[type]['built-in:default'];
	}

	getLimits(current_player, x, y) {

		let pawn = this._board.getElements('pawns')[x + 'x' + y];
		if( pawn !== undefined ) {
			let [name, player] = pawn.split('@');
			let PAWN = this._getRuleFor('pawns', name);
			return PAWN.limits(player, x, y, this, this._board);
		}

		let base = this._board.getElements('bases')[x + 'x' + y];
		if( base === undefined)
			return false;

		let base_name = base.split('@')[0];
		let BASE = this._getRuleFor('bases', base_name);

		return BASE.limits(current_player, x, y, this, this._board);
	}

	canPutPawn(owner, type, name, x, y, z = null) {

		if( type != 'pawns')
			return false;
		if( z !== null)
			return false;

		let currentPlayer = this._game.currentPlayer();
		if( owner != currentPlayer )
			return false;

		let PAWN = this._getRuleFor('pawns', name);

		if( ! PAWN.canPut(currentPlayer, x, y, this, this._board) )
			return false;

		//TODO SIMULATE POSE FOR REPLAY RULES.
		//TODO VERIFY PREVIOUS STATE
		return true;
	}

	_nextPlayer() {

		let currentPlayer = this._game.currentPlayer();

		let scores = this._game.scores();
		let idx = scores.findIndex( e => e[0] == currentPlayer );
		idx = (idx + 1) % scores.length;
		
		return scores[idx][0];
	}

	putPawn(...args) {

		if( ! this.canPutPawn(...args) )
			return false;

		let action = {
			action: { type: 'put' },
			consequencies: {
				added: [ args ],
				deleted: [], // TODO EATED
				scores: [], //TODO SCORE EATED
				next_player: this._nextPlayer()
			}
		};

		this._game.addAction(action);

		return true;
	}

	pass() {

		//TODO RULE.

		return true;
	}
}


GameRules.rules = {};
{
	let req = require.context("./Elements/", true, /\.js$/);
	req.keys().forEach(function(key){


		let name = key.slice(2,-3).split('/');

		let type = name[0].toLowerCase();
		name = name.slice(1).join('.');

		GameRules.rules[type] = GameRules.rules[type] || {};
		GameRules.rules[type]['built-in:' + name] = req(key).default;
	});
}