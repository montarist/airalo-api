# UNOFFICIAL AIRALO API INTEGRATION FOR JAVASCRIPT/TYPESCRIPT

An unofficial Airalo API integration for JavaScript/TypeScript.

[![Airalo API Pipeline](https://github.com/montarist/airalo-api/actions/workflows/pipeline.yml/badge.svg)](https://github.com/montarist/airalo-api/actions/workflows/pipeline.yml)

## Important Notice

This package is fully licensed under the MIT License and is created to assist developers in integrating Airalo for eSIM orders. While this package aims to simplify integration, the usage of this package comes with no warranty or liability.

This project is created without any commercial intent and solely to contribute to the developer community.

For any issues encountered, feel free to reach out. You can also support the project by forking and contributing. Together, we can make this library even better!

## Installation

```bash
npm install @montarist/airalo-api
```

## Usage

### Initialize the Service

```typescript
import { AiraloService, AiraloConfig } from '@montarist/airalo-api';

const config: AiraloConfig = {
	baseUrl: 'https://api.airalo.com',
	clientId: 'your_client_id',
	clientSecret: 'your_client_secret',
};

const airaloService = new AiraloService(config);
```

### Authentication

The service will automatically handle authentication when needed. However, you can also manually authenticate:

```typescript
await airaloService.authenticate();
```

### Order Management

```typescript
// List orders
const orders = await airaloService.getOrders({
	limit: 10,
	page: 1,
	orderStatus: 'completed',
});

// Get a specific order
const order = await airaloService.getOrder(123);

// Create a new order
const newOrder = await airaloService.createOrder({
	package_id: 456,
	quantity: 1,
	description: 'Test order',
});

// Create an async order
const asyncOrder = await airaloService.createAsyncOrder({
	package_id: 456,
	quantity: 1,
	callback_url: 'https://your-callback-url.com',
});

// Create a topup order
const topupOrder = await airaloService.createTopupOrder({
	sim_iccid: '8988228888888888888',
	package_id: 789,
});
```

### SIM Management

```typescript
// List SIMs
const sims = await airaloService.getSIMs({
	limit: 10,
	page: 1,
});

// Get a specific SIM
const sim = await airaloService.getSIM('8988228888888888888');

// Get SIM instructions
const instructions = await airaloService.getSIMInstructions('8988228888888888888');

// Get SIM usage
const usage = await airaloService.getSIMUsage('8988228888888888888');

// Get SIM brand
const brand = await airaloService.getSIMBrand('8988228888888888888');

// Get SIM packages
const packages = await airaloService.getSIMPackages('8988228888888888888');

// Get SIM topups
const topups = await airaloService.getSIMTopups('8988228888888888888');
```

### Package Management

```typescript
// List packages
const packages = await airaloService.getPackages({
	type: 'local',
	country: 'TR',
	limit: 10,
	page: 1,
});
```

### Device Management

```typescript
// Get compatible devices
const devices = await airaloService.getCompatibleDevices();
```

### Notification Management

```typescript
// Opt-in for notifications
await airaloService.optInNotifications({
	webhook_url: 'https://your-webhook-url.com',
	events: ['order.completed', 'sim.activated'],
});

// Opt-out from notifications
await airaloService.optOutNotifications();
```

### Balance Management

```typescript
// Get balance
const balance = await airaloService.getBalance();
```

### Voucher Management

```typescript
// Redeem eSIM voucher
const order = await airaloService.redeemESIMVoucher({
	code: 'VOUCHER123',
	package_id: 456,
});

// Redeem Airmoney voucher
await airaloService.redeemAirmoneyVoucher({
	code: 'AIRMONEY123',
	amount: 50,
	currency: 'USD',
});
```

### Error Handling

The service uses custom error types for better error handling:

```typescript
import { AiraloError, AiraloErrorCode } from '@montarist/airalo-api';

try {
	const order = await airaloService.createOrder({
		package_id: 456,
		quantity: 1,
	});
} catch (error) {
	if (error instanceof AiraloError) {
		switch (error.code) {
			case AiraloErrorCode.INSUFFICIENT_CREDIT:
				console.log('Not enough credit');
				break;
			case AiraloErrorCode.INSUFFICIENT_STOCK:
				console.log('Not enough stock');
				break;
			default:
				console.log('Other error:', error.message);
		}
	}
}
```

## License

MIT
