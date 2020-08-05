import {ElementsList} from '../../ElementsList.js';


export default class Links {

	static getNeighbours(context, [name, owner], idx, neighbours = new Set() ) {

		let result = {
			neighbours: neighbours,
			visited: new Set([ ElementsList.getIDX(idx) ])
		};

		Links.visit(context, [name, owner], idx, result);

		return neighbours;
	}

	static visit(context, [name, owner], idx, data) {

		let direction = name.split('_').slice(-1)[0];

		let [x, y] = ElementsList.getXY(idx);

		if( direction[0] == 'l')
			--x;
		if( direction[0] == 'r')
			++x;
		if( direction[direction.length - 1] == 't')
			--y;
		if( direction[direction.length - 1] == 'b')
			++y;

		let new_pos = ElementsList.getIDX([x, y]);

		if( data.visited.has(new_pos) )
			return;
		data.visited.add(new_pos);

		if( context.board.getElements('Bases').has(new_pos) ) {
			data.neighbours.add(new_pos);
			return;
		}

		if( ! context.board.getElements('Links').has(new_pos) )
			return;

		let links = Object.values( context.board.getElements('Links').get(new_pos) );

		for(let [link_name, owner] of links) {

			let LINK = context.rules._getRule('Links', link_name);
			LINK.visit(context, [link_name, owner], new_pos, data);
		}
	}
}