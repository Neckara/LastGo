export default class {
	
	static canPut(player, x, y, rules, board) {

		let base = board.getElements('bases')[x + 'x' + y];
		if( base === undefined )
			return false;

		let base_name = base.split('@')[0];
		let BASE = rules._getRuleFor('bases', base_name);

		let reason = BASE.canPut(player, x, y, rules, board);

		return ! reason;
	}

	static limits(player, x, y, rules, board) {

		let base = board.getElements('bases')[x + 'x' + y];
		let base_name = base.split('@')[0];
		let BASE = rules._getRuleFor('bases', base_name);

		return BASE.limits(player, x, y, rules, board);
	}

}