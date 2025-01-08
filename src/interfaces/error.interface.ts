export enum AiraloErrorCode {
	INSUFFICIENT_CREDIT = 11,
	OPERATOR_MAINTENANCE = 13,
	INVALID_CHECKSUM = 14,
	TOPUP_DISABLED = 23,
	INSUFFICIENT_STOCK = 33,
	PACKAGE_INVALID = 34,
	BAD_REQUEST = 43,
	UNEXPECTED_ERROR = 53,
}

export const AiraloErrorMessages: Record<AiraloErrorCode, string> = {
	[AiraloErrorCode.INSUFFICIENT_CREDIT]: 'Insufficient Airalo Credit',
	[AiraloErrorCode.OPERATOR_MAINTENANCE]: 'The requested operator is currently undergoing maintenance. Please try again later.',
	[AiraloErrorCode.INVALID_CHECKSUM]: 'Invalid checksum',
	[AiraloErrorCode.TOPUP_DISABLED]: 'The requested top-up has been disabled by the operator',
	[AiraloErrorCode.INSUFFICIENT_STOCK]: 'Insufficient stock of eSIMs remaining',
	[AiraloErrorCode.PACKAGE_INVALID]: 'The requested eSIM package is invalid or it is currently out of stock. Please try again later.',
	[AiraloErrorCode.BAD_REQUEST]: 'Bad request',
	[AiraloErrorCode.UNEXPECTED_ERROR]: "Something unexpected happened. We're working to resolve the issue. Please try again later.",
};

export interface AiraloErrorResponse {
	message: string;
	errors?: Record<string, string[]>;
	code?: AiraloErrorCode;
	status_code: number;
	additional_info?: string;
}

export class AiraloError extends Error {
	constructor(
		public readonly code: AiraloErrorCode,
		public readonly additionalInfo?: string,
		public readonly statusCode: number = 422,
	) {
		const baseMessage = AiraloErrorMessages[code];
		const fullMessage = additionalInfo ? `${baseMessage}: ${additionalInfo}` : baseMessage;
		super(fullMessage);
		this.name = 'AiraloError';
	}

	toResponse(): AiraloErrorResponse {
		return {
			message: this.message,
			code: this.code,
			status_code: this.statusCode,
			additional_info: this.additionalInfo,
		};
	}
}
