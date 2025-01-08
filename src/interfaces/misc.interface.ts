export interface AiraloAuthResponse {
	data: {
		access_token: string;
		token_type: string;
		expires_in: number;
	};
}

export interface AiraloCompatibleDevice {
	brand: string;
	model: string;
	is_compatible: boolean;
}

export interface AiraloNotificationOptIn {
	webhook_url: string;
	events: string[];
}

export interface AiraloWebhookSimulation {
	event: string;
	payload: Record<string, any>;
	webhook_url: string;
}

export interface AiraloBalance {
	available: number;
	currency: string;
	reserved: number;
	total: number;
}

export interface AiraloVoucherESIM {
	code: string;
	package_id: number;
}

export interface AiraloVoucherAirmoney {
	code: string;
	amount: number;
	currency: string;
}
