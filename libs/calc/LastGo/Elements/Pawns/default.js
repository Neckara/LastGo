export default class {
	
	static canPutPawn(player, x, y, rules, board) {

		let base = board.getElements('bases')[x + 'x' + y];
		if( base === undefined )
			return false;

		let base_name = base.split('@')[0];
		let BASE = rules._getRuleFor('bases', base_name);

		let reason = BASE.canPutPawn(player, x, y, rules, board);

		return ! reason;
	}

	static points() {
		return 0;
	}

	static destroyPawn(player, x, y, rules, board) {

		let pos = x + 'x' + y;
		let [pawn, owner] = board.getElements('pawns')[pos].split('@');

		return {
			added: [],
			deleted: [
				[
					owner,
					'pawns',
					pawn,
					x,
					y
				]
			],
			scores: [
				[player, 1]
			]
		};
	}

	static putPawn(player, type, name, x, y, rules, board) {

		let consequencies = {
			added: [
				[player, type, name, x, y]
			],
			deleted: [],
			scores: [],
		}

		let base = board.getElements('bases')[x + 'x' + y];
		let base_name = base.split('@')[0];
		let BASE = rules._getRuleFor('bases', base_name);

		BASE.putPawn(consequencies, player, x, y, rules, board);

		return consequencies;
	}

	static limits(player, x, y, rules, board) {

		let base = board.getElements('bases')[x + 'x' + y];
		let base_name = base.split('@')[0];
		let BASE = rules._getRuleFor('bases', base_name);

		return BASE.limits(player, x, y, rules, board);
	}

}