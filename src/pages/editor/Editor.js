const $ = require('jquery');


export class Editor {


	constructor(board, canvas) {
		this._board = board;
		this._canvas = canvas;

		// Grid size
		$('#board_width, #board_height').on('input', () => {

			let w = parseInt( $('#board_width').val() );
			let h = parseInt( $('#board_height').val() );

			if( ! Number.isInteger(w) || w < 1)
				w = 1;
			if( ! Number.isInteger(h) || h < 1)
				h = 1;

			this._board.setBoardSize(w, h);
			this._canvas.redraw();
		});
		$('#board_width').trigger('input');


	}
}