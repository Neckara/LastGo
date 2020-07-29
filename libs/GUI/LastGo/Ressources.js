export class Ressources {

	constructor( content, path ) {

		this._path = path;
		this._type = path.split('.')[0];
		this._name = path.split('.').slice(1).join('.');

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

		if( this._colored[owner] === undefined ) {
			console.log(owner, this._path);
		}
		return this._colored[owner]._img;
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
				promises.push( index[type][name].loadAllColored(players) );

		await Promise.all(promises);
	}

	colorContent( new_color, targetColor = '#000080') {

		let content = this._content.split(',');

		content[1] = atob(content[1]);
		content[1] = content[1].replace( new RegExp(targetColor,"g") , new_color);
		content[1] = btoa(content[1]);


		return content.join(',');
	}

	async loadAllColored( players ) {

		let promises = [];

		for(let player in players) {

			promises.push( new Promise( async (r) => {

				let newContent = this.colorContent(players[player]);
				let img = new Ressources(newContent, this._path + '@' + player);

				img = await img.waitLoad();

				this._colored[player] = img;

				r( img );
			}) );
		}

		return await Promise.all(promises);
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