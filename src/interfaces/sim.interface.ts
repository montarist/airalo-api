import { AiraloOrder } from './order.interface';

export interface AiraloSIM {
	id: number;
	iccid: string;
	status: string;
	activation_code: string;
	qr_code: string;
	manual_activation: {
		sm_dp_address: string;
		activation_code: string;
		confirmation_code: string;
	};
	order?: AiraloOrder;
}

export interface AiraloSIMListParams {
	include?: string;
	limit?: number;
	page?: number;
}

export interface AiraloSIMUsage {
	data_used: number;
	data_total: number;
	validity_used: number;
	validity_total: number;
	status: string;
	expiry_date: string;
}

export interface AiraloSIMBrand {
	name: string;
	logo_url: string;
	primary_color: string;
	secondary_color: string;
}

export interface AiraloSIMInstructions {
	qr_code: string;
	manual: {
		sm_dp_address: string;
		activation_code: string;
		confirmation_code: string;
	};
	steps: {
		ios: string[];
		android: string[];
	};
}

export interface AiraloSIMPackage {
	id: number;
	title: string;
	data_amount: string;
	validity_period: number;
	price: number;
	currency: string;
	status: string;
	activation_date?: string;
	expiry_date?: string;
}

export interface AiraloSIMTopup {
	id: number;
	order_id: number;
	package: AiraloSIMPackage;
	created_at: string;
	status: string;
}
