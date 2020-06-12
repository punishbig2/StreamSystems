export interface MOStrategy {
	OptionProductType: string;
	description: string;
	name: string;
	pricerlegs: number;
	productid: string;
	shortname: string;
	source: string;
	spreadvsvol: "vol" | "spread";
	strike?: string;
}
