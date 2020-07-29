export class Ressources {

	constructor( content, path ) {

		this._path = path;
		this._type = path.split('.')[0];
		this._name = path.split('.').slice(1).join('.');

		this._img = new Image();

		this._content = content;

		this._loadPromise = new Promise( (resolve) => {

			this._img.onload = () => {
				resolve(this);
			}

			this._img.src = content; //"data:image/svg+xml;base64," + base64;
		});

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
	image() {
		return this._img;
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

	static async Color(base_img, new_color, targetColor) {

		let content = base_img._content.split(',');

		content[1] = atob(content[1]);
		content[1] = content[1].replace( new RegExp(targetColor,"g") , new_color);
		content[1] = btoa(content[1]);

		let img = new Ressources(content.join(','), base_img._path);
		return await img.waitLoad();
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