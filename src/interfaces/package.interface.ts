export interface AiraloPackage {
	id: number;
	title: string;
	description: string;
	data_amount: string;
	validity_period: number;
	price: number;
	currency: string;
	type: 'global' | 'local' | 'regional';
	region?: string;
	country?: string;
	operator?: string;
	coverage?: string[];
	features?: string[];
}

export interface AiraloPackageListParams {
	type?: 'global' | 'local' | 'regional';
	country?: string;
	limit?: number;
	page?: number;
}
