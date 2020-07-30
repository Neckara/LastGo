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

		if( this.isEndOfGame() )
			return false;

		if( type != 'pawns')
			return false;
		if( z !== null)
			return false;

		let currentPlayer = this._game.currentPlayer();
		if( owner != currentPlayer )
			return false;

		let PAWN = this._getRuleFor('pawns', name);

		if( ! PAWN.canPutPawn(currentPlayer, x, y, this, this._board) )
			return false;

		let simulate = this.putPawn(owner, type, name, x, y, z, true);

		return simulate;
	}

	_nextPlayer() {

		let currentPlayer = this._game.currentPlayer();

		let scores = this._game.scores();
		let idx = scores.findIndex( e => e[0] == currentPlayer );
		idx = (idx + 1) % scores.length;
		
		return scores[idx][0];
	}

	putPawn(owner, type, name, x, y, z = null, simulate = false) {

		if( ! simulate && ! this.canPutPawn(owner, type, name, x, y, z) )
			return false;

		let PAWN = this._getRuleFor('pawns', name);
		let consequencies = PAWN.putPawn(owner, type, name, x, y, this, this._board);

		let action = {
			action: {
				type: 'put',
				owner: owner,
				type: type,
				name: name,
				pos: [x, y]
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

		for(let i = 0; i < size[0]; ++i)
			for(let j = 0; j < size[0]; ++j) {

				let elem = this._board.getElements('pawns')[i + 'x' + j];
				if( elem !== undefined ) {
					elem = elem.split('@')[1];

					result[elem] = result[elem] || [];

					result[elem].push([i,j]);
					continue;
				}

				elem = this._board.getElements('bases')[i + 'x' + j];
				if( elem === undefined )
					continue;

				elem = elem.split('@')[1];

				if(elem == 'Neutral') {

					let limits = this.getLimits('Neutral', i, j );

					let others = [...new Set([... Array.from(limits.enemies, e => e[0])])];
				
					if(others.length == 1)
						elem = others[0];
				}

				result[elem] = result[elem] || [];
				result[elem].push([i,j]);
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

				for(let pos of final[player] ) {

					let base = this._board.getElements('bases')[ pos[0] + 'x' + pos[1] ];
					let base_name = base.split('@')[0];
					let BASE = this._getRuleFor('bases', base_name);
					sum += BASE.points(player, pos[0], pos[1], this, this._board);
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