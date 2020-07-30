export default class Links {



	static getNeighbours(name, x, y, rules, board, neighbours = new Set() ) {

		let result = {
			neighbours: neighbours,
			visited: new Set([x + 'x' + y])
		};

		Links.visit(result, name, x, y, rules, board);

		return neighbours;
	}

	static visit(data, name, x, y, rules, board) {

		let direction = name.split('_').slice(-1)[0];

		if( direction[0] == 'l')
			--x;
		if( direction[0] == 'r')
			++x;
		if( direction[direction.length - 1] == 't')
			--y;
		if( direction[direction.length - 1] == 'b')
			++y;

		let new_pos = x + 'x' + y;

		if(data.visited.has(new_pos) )
			return;
		data.visited.add( new_pos );

		if( board.getElements('bases')[new_pos] !== undefined ) {
			data.neighbours.add(new_pos);
			return;
		}

		let links = board.getElements('links')[new_pos];

		if( links === undefined )
			return;

		if( typeof links === 'string')
			links = [links];
		else
			links = Object.values(links);

		for(let link of links) {

			let link_name = link.split('@')[0];
			let LINK = rules._getRuleFor('links', link_name);

			LINK.visit(data, link_name, x, y, rules, board);
		}
	}
}