import {ElementsList} from '../../ElementsList.js';

export default class Pawns {
	
	static canPutPawn(context, [name, owner], idx) {

		if( ! context.board.getElements('Bases').has(idx) )
			return false;

		let BASE = context.rules._getRuleAt('Bases', idx);

		let reason = BASE.canPutPawn(context, [name, owner], idx);

		return ! reason;
	}

	static points() {
		return 1;
	}

	static destroyPawn(context, player, idx) {

		let [pawn, owner] = context.board.getElements('Pawns').get(idx);

		return {
			added: [],
			deleted: [
				[ 'Pawns', [pawn, owner], idx ]
			],
			scores: [
				[player, Pawns.points()]
			]
		};
	}

	static putPawn(context, type, [name, player], idx ) {

		let consequencies = {
			added: [
				[type, [name, player], idx]
			],
			deleted: [],
			scores: [],
		}

		let BASE = context.rules._getRuleAt('Bases', idx);

		BASE.putPawn(context, type, [name, player], idx, consequencies);

		return consequencies;
	}

	static limits(context, player, idx) {

		let BASE = context.rules._getRuleAt('Bases', idx);

		return BASE.limits(context, player, idx);
	}

}