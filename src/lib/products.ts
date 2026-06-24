// Static product catalogue for the Frost Tech ecosystem homepage.
// Marketing copy (tagline / description / feature labels) lives in i18n under
// `home.products.<key>.*`; this file holds only the structural/brand data.
// `name` must match AppIcon's detection (Investory / Blades of Hex / PP Typeset).

export interface Product {
	/** i18n + AppIcon key */
	key: 'investory' | 'blades' | 'pp' | 'boen';
	/** Display name (also drives AppIcon logo selection) */
	name: string;
	/** Primary brand colour — used ONLY as a restrained accent on the card */
	brand: string;
	/** Optional secondary brand colour (gradient/glow) */
	brandAlt?: string;
	/** Public hosted URL */
	url: string;
	/** Owned product vs strategic partner */
	kind: 'owned' | 'partner';
	/** Number of feature chips to read from i18n (home.products.<key>.f1..fN) */
	featureCount: number;
}

export const products: Product[] = [
	{
		key: 'investory',
		name: 'Investory',
		brand: '#863bff',
		brandAlt: '#47bfff',
		url: 'https://investory.frostrain.tech',
		kind: 'owned',
		featureCount: 3
	},
	{
		key: 'blades',
		name: 'Blades of Hex',
		brand: '#ffd700',
		brandAlt: '#ffe066',
		url: 'https://boh.frostrain.tech',
		kind: 'owned',
		featureCount: 3
	},
	{
		key: 'pp',
		name: 'PP Typeset',
		brand: '#ea580c',
		brandAlt: '#fb923c',
		url: 'https://pptypeset.frostrain.tech',
		kind: 'partner',
		featureCount: 3
	},
	{
		key: 'boen',
		name: 'Boen',
		brand: '#d99a4e',
		brandAlt: '#f0c275',
		url: 'https://boen.frostrain.tech',
		kind: 'owned',
		featureCount: 3
	}
];
