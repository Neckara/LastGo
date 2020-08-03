export class Ressources {

	constructor( content, path, color = null ) {

		this._path = path;
		this._type = path.split('.')[0];
		this._name = path.split('.').slice(1).join('.');
		this._color = color;

		this._img = new Image();

		this._img._ressource = this;

		this._content = content;

		this._loadPromise = new Promise( (resolve) => {

			this._img.onload = () => {
				resolve(this);
			}

			this._img.src = content; //"data:image/svg+xml;base64," + base64;
		});

		this._colored = {};

	}

	color() {
		return this._color;
	}

	async waitLoad() {
		return await this._loadPromise;
	}

	type() {
		return this._type;
	}
	name() {
		return this._name;
	}

	image(owner = null) {

		if(owner == null)
			return this._img;

		return this._colored[owner].image();
	}


	static async loadAllDefaults() {

		let promises = new Array();
		
		for(let name in ressources) {

			let res = new Ressources(ressources[name], name);
			promises.push( res.waitLoad() );

			Ressources.index[res.type()] = Ressources.index[res.type()] || {};
			Ressources.index[res.type()][res.name()] = res;

		}

		await Promise.all(promises);
	}

	static async loadAllColored(index, players) {

		let promises = [];

		for(let type in index)
			for(let name in index[type])
				for(let player in players)
					promises.push( index[type][name].loadColored(player, players[player]) );

		await Promise.all(promises);
	}

	colorContent( new_color, targetColor = '#000080') {

		let content = this._content.split(',');

		content[1] = atob(content[1]);
		content[1] = content[1].replace( new RegExp(targetColor,"g") , new_color);
		content[1] = btoa(content[1]);

		return content.join(',');
	}

	async loadColored(name, color) {

		this._colored[name] = new Ressources( this.colorContent(color) , this._path + '@' + name, color);
		return await this._colored[name].waitLoad();
	}
}

Ressources.index = {};

let ressources = {};
{
	let req = require.context("./ressources/", true, /\.svg$/);
	req.keys().forEach(function(key){

		let name = key.slice(2,-4).replace(/\//g, '.');

		ressources[name] = req(key).default; // Already loaded in base64 like a boss ;)
	});
}