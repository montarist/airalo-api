/**
 * Common pagination metadata
 * @interface PaginationMeta
 */
export interface PaginationMeta {
    /** Current page number */
    current_page: number;
    /** Last page number */
    last_page: number;
    /** Number of items per page */
    per_page: number;
    /** Total number of items */
    total: number;
}

/**
 * Generic paginated response wrapper
 * @interface PaginatedResponse
 * @template T - Type of items in the response
 */
export interface PaginatedResponse<T> {
    /** Array of items */
    data: T[];
    /** Pagination metadata */
    meta: PaginationMeta;
}

/**
 * Error codes returned by the Airalo API
 * @enum {number}
 */
export enum AiraloErrorCode {
    /** Insufficient credit balance */
    INSUFFICIENT_CREDIT = 11,
    /** Operator is under maintenance */
    OPERATOR_MAINTENANCE = 13,
    /** Invalid checksum provided */
    INVALID_CHECKSUM = 14,
    /** Topup functionality is disabled */
    TOPUP_DISABLED = 23,
    /** Insufficient stock of eSIMs */
    INSUFFICIENT_STOCK = 33,
    /** Package is invalid or out of stock */
    PACKAGE_INVALID = 34,
    /** Bad request parameters */
    BAD_REQUEST = 43,
    /** Unexpected system error */
    UNEXPECTED_ERROR = 53,
}

/**
 * Mapping of error codes to their messages
 * @const
 */
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

/**
 * Error response structure from the Airalo API
 * @interface AiraloErrorResponse
 */
export interface AiraloErrorResponse {
    /** Error message */
    message: string;
    /** Validation errors by field */
    errors?: Record<string, string[]>;
    /** Error code */
    code?: AiraloErrorCode;
    /** HTTP status code */
    status_code: number;
    /** Additional error information */
    additional_info?: string;
}

/**
 * Custom error class for Airalo API errors
 * @class AiraloError
 * @extends Error
 */
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

    /**
     * Converts the error to an API response format
     * @returns {AiraloErrorResponse} Formatted error response
     */
    toResponse(): AiraloErrorResponse {
        return {
            message: this.message,
            code: this.code,
            status_code: this.statusCode,
            additional_info: this.additionalInfo,
        };
    }
}

/**
 * Authentication response from the Airalo API
 * @interface AiraloAuthResponse
 */
export interface AiraloAuthResponse {
    /** Response data */
    data: {
        /** JWT access token */
        access_token: string;
        /** Token type (usually "Bearer") */
        token_type: string;
        /** Token expiration time in seconds */
        expires_in: number;
    };
}

/**
 * Parameters for listing orders
 * @interface AiraloOrderListParams
 */
export interface AiraloOrderListParams {
    /** Related resources to include */
    include?: string;
    /** Filter by creation date */
    createdAt?: string;
    /** Filter by order status */
    orderStatus?: AiraloOrderStatus;
    /** Filter by description */
    description?: string;
    /** Number of items per page */
    limit?: number;
    /** Page number */
    page?: number;
}

/**
 * Possible order statuses
 * @type AiraloOrderStatus
 */
export type AiraloOrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Order information
 * @interface AiraloOrder
 */
export interface AiraloOrder {
    /** Order ID */
    id: number;
    /** User ID */
    user_id: number;
    /** Order status */
    status: AiraloOrderStatus;
    /** Total amount */
    total: number;
    /** Currency code */
    currency: string;
    /** Order description */
    description?: string;
    /** Creation timestamp */
    created_at: string;
    /** Last update timestamp */
    updated_at: string;
    /** Associated SIMs */
    sims?: AiraloSIM[];
}

/**
 * Parameters for creating a new order
 * @interface AiraloOrderCreateParams
 */
export interface AiraloOrderCreateParams {
    /** Package ID to order */
    package_id: number;
    /** Number of packages to order */
    quantity: number;
    /** Order description */
    description?: string;
    /** Webhook URL for notifications */
    webhook_url?: string;
}

/**
 * Parameters for creating an async order
 * @interface AiraloOrderAsyncParams
 * @extends AiraloOrderCreateParams
 */
export interface AiraloOrderAsyncParams extends AiraloOrderCreateParams {
    /** Callback URL for async completion */
    callback_url: string;
}

/**
 * Parameters for creating a topup order
 * @interface AiraloTopupOrderParams
 */
export interface AiraloTopupOrderParams {
    /** ICCID of the SIM to top up */
    sim_iccid: string;
    /** Package ID for the topup */
    package_id: number;
    /** Webhook URL for notifications */
    webhook_url?: string;
}

/**
 * Order status information
 * @interface AiraloOrderStatusResponse
 */
export interface AiraloOrderStatusResponse {
    /** Status slug */
    slug: string;
    /** Status display name */
    name: string;
}

/**
 * SIM card information
 * @interface AiraloSIM
 */
export interface AiraloSIM {
    /** SIM ID */
    id: number;
    /** ICCID (Integrated Circuit Card Identifier) */
    iccid: string;
    /** SIM status */
    status: string;
    /** Activation code */
    activation_code: string;
    /** QR code for easy activation */
    qr_code: string;
    /** Manual activation details */
    manual_activation: {
        /** SM-DP+ address */
        sm_dp_address: string;
        /** Activation code */
        activation_code: string;
        /** Confirmation code */
        confirmation_code: string;
    };
    /** Associated order */
    order?: AiraloOrder;
}

/**
 * Parameters for listing SIMs
 * @interface AiraloSIMListParams
 */
export interface AiraloSIMListParams {
    /** Related resources to include */
    include?: string;
    /** Number of items per page */
    limit?: number;
    /** Page number */
    page?: number;
}

/**
 * SIM usage information
 * @interface AiraloSIMUsage
 */
export interface AiraloSIMUsage {
    /** Data used in MB */
    data_used: number;
    /** Total data allowance in MB */
    data_total: number;
    /** Days used */
    validity_used: number;
    /** Total validity period in days */
    validity_total: number;
    /** Usage status */
    status: string;
    /** Package expiry date */
    expiry_date: string;
}

/**
 * SIM brand information
 * @interface AiraloSIMBrand
 */
export interface AiraloSIMBrand {
    /** Brand name */
    name: string;
    /** Brand logo URL */
    logo_url: string;
    /** Primary brand color */
    primary_color: string;
    /** Secondary brand color */
    secondary_color: string;
}

/**
 * SIM installation instructions
 * @interface AiraloSIMInstructions
 */
export interface AiraloSIMInstructions {
    /** QR code for activation */
    qr_code: string;
    /** Manual activation details */
    manual: {
        /** SM-DP+ address */
        sm_dp_address: string;
        /** Activation code */
        activation_code: string;
        /** Confirmation code */
        confirmation_code: string;
    };
    /** Installation steps by platform */
    steps: {
        /** iOS installation steps */
        ios: string[];
        /** Android installation steps */
        android: string[];
    };
}

/**
 * SIM package information
 * @interface AiraloSIMPackage
 */
export interface AiraloSIMPackage {
    /** Package ID */
    id: number;
    /** Package title */
    title: string;
    /** Data amount with unit */
    data_amount: string;
    /** Validity period in days */
    validity_period: number;
    /** Package price */
    price: number;
    /** Currency code */
    currency: string;
    /** Package status */
    status: string;
    /** Activation date */
    activation_date?: string;
    /** Expiry date */
    expiry_date?: string;
}

/**
 * SIM topup transaction
 * @interface AiraloSIMTopup
 */
export interface AiraloSIMTopup {
    /** Topup ID */
    id: number;
    /** Associated order ID */
    order_id: number;
    /** Package details */
    package: AiraloSIMPackage;
    /** Creation timestamp */
    created_at: string;
    /** Topup status */
    status: string;
}

/**
 * Package information
 * @interface AiraloPackage
 */
export interface AiraloPackage {
    /** Package ID */
    id: number;
    /** Package title */
    title: string;
    /** Package description */
    description: string;
    /** Data amount with unit */
    data_amount: string;
    /** Validity period in days */
    validity_period: number;
    /** Package price */
    price: number;
    /** Currency code */
    currency: string;
    /** Package type */
    type: 'global' | 'local' | 'regional';
    /** Region name */
    region?: string;
    /** Country code */
    country?: string;
    /** Operator name */
    operator?: string;
    /** Coverage areas */
    coverage?: string[];
    /** Package features */
    features?: string[];
}

/**
 * Parameters for listing packages
 * @interface AiraloPackageListParams
 */
export interface AiraloPackageListParams {
    /** Filter by package type */
    type?: 'global' | 'local' | 'regional';
    /** Filter by country */
    country?: string;
    /** Number of items per page */
    limit?: number;
    /** Page number */
    page?: number;
}

/**
 * Device compatibility information
 * @interface AiraloCompatibleDevice
 */
export interface AiraloCompatibleDevice {
    /** Device brand */
    brand: string;
    /** Device model */
    model: string;
    /** Whether the device is compatible */
    is_compatible: boolean;
}

/**
 * Notification preferences
 * @interface AiraloNotificationOptIn
 */
export interface AiraloNotificationOptIn {
    /** Webhook URL for notifications */
    webhook_url: string;
    /** Event types to subscribe to */
    events: string[];
}

/**
 * Webhook simulation parameters
 * @interface AiraloWebhookSimulation
 */
export interface AiraloWebhookSimulation {
    /** Event type to simulate */
    event: string;
    /** Event payload */
    payload: Record<string, any>;
    /** Target webhook URL */
    webhook_url: string;
}

/**
 * Balance information
 * @interface AiraloBalance
 */
export interface AiraloBalance {
    /** Available balance */
    available: number;
    /** Currency code */
    currency: string;
    /** Reserved balance */
    reserved: number;
    /** Total balance */
    total: number;
}

/**
 * eSIM voucher redemption parameters
 * @interface AiraloVoucherESIM
 */
export interface AiraloVoucherESIM {
    /** Voucher code */
    code: string;
    /** Package ID to redeem */
    package_id: number;
}

/**
 * Airmoney voucher redemption parameters
 * @interface AiraloVoucherAirmoney
 */
export interface AiraloVoucherAirmoney {
    /** Voucher code */
    code: string;
    /** Amount to redeem */
    amount: number;
    /** Currency code */
    currency: string;
}
