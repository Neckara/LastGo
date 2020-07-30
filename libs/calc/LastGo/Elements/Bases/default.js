export default class Bases {


	static canPutPawn(player, x, y, rules, board) {

		if( board.getElements('pawns')[x + 'x' + y] !== undefined )
			return 'FULL';

		let limits = Bases.limits(player, x, y, rules, board);
		
		if( limits.freedoms.length > 0)
			return;

		for(let enemy of limits.enemies) {

			let enemy_limits = Bases.limits(...enemy, rules, board);

			if( enemy_limits.freedoms.length > 1)
				continue;

			let free = enemy_limits.freedoms[0];
			if( free[0] == x && free[1] == y )
				return;
		}

		return 'NO_FREEDOM';
	}


	static putPawn(consequencies, player, x, y, rules, board) {

		let limits = Bases.limits(player, x, y, rules, board);

		let to_eat = new Set();

		for(let enemy of limits.enemies) {

			let enemy_limits = Bases.limits(...enemy, rules, board);

			if( enemy_limits.freedoms.length > 1)
				continue;

			let free = enemy_limits.freedoms[0];
			if( free[0] == x && free[1] == y ) {

				to_eat.add( enemy[1] + 'x' + enemy[2] );

				for(let eat of enemy_limits.group)
					to_eat.add(eat[0] + 'x' + eat[1]);
			}
		}

		for(let eat of to_eat) {

			let base = board.getElements('bases')[eat];
			let base_name = base.split('@')[0];
			let BASE = rules._getRuleFor('bases', base_name);

			let [x, y] = Array.from( eat.split('x'), e => parseInt(e) );

			BASE.destroyPawn(player, consequencies, x, y, rules, board);

		}

		return;
	}

	static destroyPawn(player, consequencies, x, y, rules, board) {

		let pos = x + 'x' + y;
		let pawn = board.getElements('pawns')[pos];
		let pawn_name = pawn.split('@')[0];
		let PAWN = rules._getRuleFor('pawns', pawn_name);

		let pawn_consequencies = PAWN.destroyPawn(player, x, y, rules, board);

		for(let key in pawn_consequencies)
			consequencies[key].push( ...pawn_consequencies[key] );
	}

	static limits(player, x, y, rules, board) {

		let result = {
			player: player,
			freedoms: new Set(),
			group: new Set(),
			enemies: new Set(),
			visited: new Set([x + 'x' + y])
		};

		Bases.visit(result, x, y, rules, board);

		result.freedoms = Array.from( [...result.freedoms], e => Array.from(e.split('x'), e => parseInt(e) ) );
		result.group =    Array.from( [...result.group],    e => Array.from(e.split('x'), e => parseInt(e) ) );

		result.enemies = Array.from( [...result.enemies], e => {

			e = e.split('@');
			return [e[1], ...Array.from(e[0].split('x'), e => parseInt(e) )];
		});

		return result;
	}


	static visit(data, x, y, rules, board) {

		let pos = x + 'x' + y;

		let links = board.getElements('links')[pos];
		if( links === undefined)
			return;

		if( typeof links === 'string')
			links = [links];
		else
			links = Object.values(links);

		let neighbours = new Set();

		for(let link of links) {

			let link_name = link.split('@')[0];
			let LINK = rules._getRuleFor('links', link_name);

			LINK.getNeighbours(link_name, x, y, rules, board, neighbours);
		}

		let to_visits = [];

		for( let neighbour of neighbours ) {

			if(  board.getElements('pawns')[neighbour] === undefined ) {
				data.freedoms.add(neighbour);
				continue;
			}

			let player = board.getElements('pawns')[neighbour].split('@')[1];
			
			if( player != data.player) {
				data.enemies.add(neighbour + '@' + player);
				continue;
			}

			if( ! data.visited.has( neighbour ) ) {
				to_visits.push(neighbour);
				data.group.add( neighbour );
				data.visited.add( neighbour )
			}
		}

		for(let to_visit of to_visits ) {

			let base_name = to_visit.split('@')[0];
			let BASE = rules._getRuleFor('bases', to_visit);

			let [x, y] = Array.from( to_visit.split('x'), e => parseInt(e) );

			BASE.visit(data, x, y, rules, board)
		}
	}
}