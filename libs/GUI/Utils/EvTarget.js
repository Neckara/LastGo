export class GameEvent extends Event {

	constructor(name, data ) {
		super(name);
		this.data = data;
	}
}

export class EvTarget extends EventTarget {

	constructor(TargetEvent = GameEvent) {
		super();
		this._TargetEvent = TargetEvent;
	}

	addEventListener(name, ...args) {

		let names = name.split(' ');
		for(let event of names)
			super.addEventListener(event, ...args);
	}

	dispatchTargetEvent( ...args ) {

		super.dispatchEvent( new this._TargetEvent(...args) );
	}
}