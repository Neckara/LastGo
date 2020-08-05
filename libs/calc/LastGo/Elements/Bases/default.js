import {ElementsList} from '../../ElementsList.js';


export default class Bases {


	static canPutPawn(context, [name, player], idx) {

		if( context.board.getElements('Pawns').has(idx) )
			return 'FULL';

		let limits = Bases.limits(context, player, idx);
		
		if( limits.freedoms.length > 0)
			return;

		//TODO EATED ENNEMIS UNI-DIRECTIONNAL LINK.
		for(let enemy of limits.enemies) {

			let enemy_limits = Bases.limits(context, ...enemy);

			if( enemy_limits.freedoms.length > 1)
				continue;

			let free = enemy_limits.freedoms[0];
			if( ElementsList.areKeysEqual(free, idx) )
				return;
		}

		return 'NO_FREEDOM';
	}


	static putPawn(context, type, [name, player], idx, consequencies) {

		let limits = Bases.limits(context, player, idx);

		let to_eat = new Set();

		for(let enemy of limits.enemies) {

			let enemy_limits = Bases.limits(context, ...enemy); //TODO unidirectionnal eats...

			if( enemy_limits.freedoms.length > 1)
				continue;

			let free = enemy_limits.freedoms[0];
			if( ElementsList.areKeysEqual(free, idx) ) {

				to_eat.add( ElementsList.getIDX(enemy[1]) );

				for(let eat of enemy_limits.group)
					to_eat.add( ElementsList.getIDX(eat) );
			}
		}

		for(let eat of to_eat) {

			let BASE = context.rules._getRuleAt(eat);
			BASE.destroyPawn(context, player, idx, consequencies);

		}
	}

	static points(context, player, idx) {

		let points = 0;

		if( context.board.getElements('Pawns').has(idx) ) {

			let PAWN = context.rules._getRuleAt('Pawns', idx);
			points += PAWN.points(context, player, idx);
		} else {
			points += 1;
		}

		return points;
	}

	static destroyPawn(context, player, idx, consequencies) {

		let PAWN = context.rules._getRuleAt('Pawns', idx);

		let pawn_consequencies = PAWN.destroyPawn(context, player, idx);

		for(let key in pawn_consequencies)
			consequencies[key].push( ...pawn_consequencies[key] );
	}

	static limits(context, player, idx) {

		let result = {
			player: player,
			freedoms: new Set(),
			group: new Set(),
			enemies: new Set(),
			visited: new Set([ ElementsList.getIDX(idx) ])
		};

		Bases.visit(context, idx, result);

		result.freedoms = [...result.freedoms];
		result.group =    [...result.group];

		result.enemies = Array.from( [...result.enemies], e => [
																	context.board.getElements('Pawns').get(e)[1],
																	e]);

		return result;
	}

	static visit(context, idx, data) { //TODO unidirectional links...

		if( ! context.board.getElements('Links').has(idx) )
			return;

		let links = Object.values( context.board.getElements('Links').get(idx) );

		let neighbours = new Set();

		for(let [name, owner] of links) {

			let LINK = context.rules._getRule('Links', name);

			LINK.getNeighbours(context, [name, owner], idx, neighbours);
		}

		let to_visits = [];

		for( let neighbour of neighbours ) { // freedom

			neighbour = ElementsList.getIDX(neighbour);

			if( ! context.board.getElements('Pawns').has(neighbour) ) {

				if( data.player != 'Neutral' ) {
					data.freedoms.add(neighbour);
					continue;
				}

			} else { // enemy

				let [name, player] = context.board.getElements('Pawns').get(neighbour);
				
				if( player != data.player) {
					data.enemies.add(neighbour);
					continue;
				}
			}

			if( data.visited.has( neighbour ) )
				continue;

			to_visits.push(neighbour);
			data.group.add( neighbour);
			data.visited.add( neighbour);
		}

		for(let to_visit of to_visits ) {
			let BASE = context.rules._getRuleAt('Bases', to_visit);
			BASE.visit(context, to_visit, data);
		}
	}
}