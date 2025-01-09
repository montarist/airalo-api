import axios, { AxiosInstance } from 'axios';
import {
    AiraloAuthResponse,
    AiraloBalance,
    AiraloCompatibleDevice,
    AiraloError,
    AiraloErrorCode,
    AiraloNotificationOptIn,
    AiraloOrder,
    AiraloOrderAsyncParams,
    AiraloOrderCreateParams,
    AiraloOrderListParams,
    AiraloOrderStatusResponse,
    AiraloPackage,
    AiraloPackageListParams,
    AiraloSIM,
    AiraloSIMBrand,
    AiraloSIMInstructions,
    AiraloSIMListParams,
    AiraloSIMPackage,
    AiraloSIMTopup,
    AiraloSIMUsage,
    AiraloTopupOrderParams,
    AiraloVoucherAirmoney,
    AiraloVoucherESIM,
    AiraloWebhookSimulation,
    PaginatedResponse,
} from '../interfaces';

/**
 * Configuration interface for the Airalo service
 * @interface AiraloConfig
 */
export interface AiraloConfig {
    /** Base URL of the Airalo API */
    baseUrl: string;
    /** Client ID for authentication */
    clientId: string;
    /** Client secret for authentication */
    clientSecret: string;
}

/**
 * Service for interacting with the Airalo API
 * @class AiraloService
 * @description Provides methods to interact with Airalo's eSIM services, including order management, SIM management, and more
 */
export class AiraloService {
    private readonly axiosInstance: AxiosInstance;
    private accessToken?: string;
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000; // 1 second

    /**
     * Creates an instance of AiraloService
     * @param {AiraloConfig} config - Configuration object containing API credentials and settings
     */
    constructor(private readonly config: AiraloConfig) {
        this.axiosInstance = axios.create({
            baseURL: this.config.baseUrl,
            headers: {
                Accept: 'application/json',
            },
        });

        this.axiosInstance.interceptors.response.use(
            (response: any) => response,
            (error: any) => this.handleAxiosError(error),
        );
    }

    /**
     * Handles Axios errors and converts them to AiraloError instances
     * @private
     * @param {any} error - The error from Axios
     * @throws {AiraloError} Throws a standardized AiraloError
     */
    private async handleAxiosError(error: any): Promise<never> {
        if (error.response?.status === 422 && error.response?.data?.code) {
            const errorCode = error.response.data.code as number;
            const additionalInfo = error.response.data.additional_info || error.response.data.message;

            if (Object.values(AiraloErrorCode).includes(errorCode)) {
                throw new AiraloError(errorCode, additionalInfo);
            }
        }

        throw new AiraloError(AiraloErrorCode.UNEXPECTED_ERROR, error.message, error.response?.status || 500);
    }

    /**
     * Gets authentication headers for API requests
     * @private
     * @returns {Promise<Record<string, string>>} Headers object with authorization token
     */
    private async getHeaders(): Promise<Record<string, string>> {
        if (!this.accessToken) {
            await this.authenticate();
        }
        return {
            Authorization: `Bearer ${this.accessToken}`,
        };
    }

    /**
     * Generic request handler with retry logic
     * @private
     * @template T - The expected response type
     * @param {() => Promise<{ data: T }>} requestFn - The request function to execute
     * @param {number} retryCount - Current retry attempt count
     * @returns {Promise<T>} The response data
     */
    private async handleRequest<T>(requestFn: () => Promise<{ data: T }>, retryCount = 0): Promise<T> {
        try {
            const response = await requestFn();
            return response.data;
        } catch (error) {
            if (error.response?.status === 401 && retryCount < 1) {
                // Reset access token and retry once
                this.accessToken = undefined;
                await this.authenticate();
                return this.handleRequest(requestFn, retryCount + 1);
            }

            if (error.response?.status === 429 && retryCount < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
                return this.handleRequest(requestFn, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Authenticates with the Airalo API
     * @description Obtains an access token using client credentials
     * @returns {Promise<void>}
     * @throws {AiraloError} If authentication fails
     */
    async authenticate(): Promise<void> {
        const formData = new FormData();
        formData.append('client_id', this.config.clientId);
        formData.append('client_secret', this.config.clientSecret);
        formData.append('grant_type', 'client_credentials');

        const response = await this.handleRequest<AiraloAuthResponse>(() =>
            this.axiosInstance.post('/v2/token', formData),
        );

        this.accessToken = response.data.access_token;
    }

    /**
     * Retrieves a list of orders
     * @param {AiraloOrderListParams} params - Parameters for filtering and pagination
     * @returns {Promise<PaginatedResponse<AiraloOrder>>} Paginated list of orders
     */
    async getOrders(params: AiraloOrderListParams): Promise<PaginatedResponse<AiraloOrder>> {
        const headers = await this.getHeaders();
        return this.handleRequest(() =>
            this.axiosInstance.get('/v2/orders', {
                headers,
                params: {
                    include: params.include,
                    'filter[created_at]': params.createdAt,
                    'filter[order_status]': params.orderStatus,
                    'filter[description]': params.description,
                    limit: params.limit,
                    page: params.page,
                },
            }),
        );
    }

    /**
     * Retrieves a specific order by ID
     * @param {number} orderId - The ID of the order to retrieve
     * @param {string} [include] - Related resources to include in the response
     * @returns {Promise<AiraloOrder>} The requested order
     */
    async getOrder(orderId: number, include?: string): Promise<AiraloOrder> {
        const headers = await this.getHeaders();
        return this.handleRequest(() =>
            this.axiosInstance.get(`/v2/orders/${orderId}`, {
                headers,
                params: { include },
            }),
        );
    }

    /**
     * Creates a new order
     * @param {AiraloOrderCreateParams} orderData - The order details
     * @returns {Promise<AiraloOrder>} The created order
     */
    async createOrder(orderData: AiraloOrderCreateParams): Promise<AiraloOrder> {
        const headers = await this.getHeaders();
        const formData = new FormData();

        // Append all order data to FormData
        formData.append('quantity', orderData.quantity.toString());
        formData.append('package_id', orderData.package_id);
        formData.append('type', orderData.type);

        if (orderData.description) {
            formData.append('description', orderData.description);
        }

        if (orderData.brand_settings_name) {
            formData.append('brand_settings_name', orderData.brand_settings_name);
        }

        if (orderData.webhook_url) {
            formData.append('webhook_url', orderData.webhook_url);
        }

        return this.handleRequest(() =>
            this.axiosInstance.post('/v2/orders', formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            })
        );
    }

    /**
     * Creates an asynchronous order
     * @param {AiraloOrderAsyncParams} orderData - The order details with callback URL
     * @returns {Promise<{ request_id: string }>} The request ID for tracking the order
     */
    async createAsyncOrder(orderData: AiraloOrderAsyncParams): Promise<{ request_id: string }> {
        const headers = await this.getHeaders();
        const formData = new FormData();

        // Append all order data to FormData
        formData.append('quantity', orderData.quantity.toString());
        formData.append('package_id', orderData.package_id);
        formData.append('type', orderData.type);

        if (orderData.description) {
            formData.append('description', orderData.description);
        }

        if (orderData.brand_settings_name) {
            formData.append('brand_settings_name', orderData.brand_settings_name);
        }

        if (orderData.webhook_url) {
            formData.append('webhook_url', orderData.webhook_url);
        }

        if (orderData.callback_url) {
            formData.append('callback_url', orderData.callback_url);
        }

        return this.handleRequest(() =>
            this.axiosInstance.post('/v2/orders-async', formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            })
        );
    }

    /**
     * Creates a topup order for an existing SIM
     * @param {AiraloTopupOrderParams} orderData - The topup order details
     * @returns {Promise<AiraloOrder>} The created topup order
     */
    async createTopupOrder(orderData: AiraloTopupOrderParams): Promise<AiraloOrder> {
        const headers = await this.getHeaders();
        const formData = new FormData();


        // Append all order data to FormData
        formData.append('iccid', orderData.iccid);
        formData.append('package_id', orderData.package_id.toString());

        if (orderData.description) {
            formData.append('description', orderData.description);
        }

        return this.handleRequest(() =>
            this.axiosInstance.post('/v2/orders/topups', formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            })
        );
    }

    /**
     * Retrieves a list of order statuses
     * @param {{ limit?: number; page?: number }} [params] - Pagination parameters
     * @returns {Promise<PaginatedResponse<AiraloOrderStatusResponse>>} Paginated list of order statuses
     */
    async getOrderStatuses(params?: { limit?: number; page?: number }): Promise<PaginatedResponse<AiraloOrderStatusResponse>> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get('/v2/orders/statuses', { headers, params }));
    }

    /**
     * Retrieves a specific order status
     * @param {string} slug - The status slug to retrieve
     * @returns {Promise<AiraloOrderStatusResponse>} The requested order status
     */
    async getOrderStatus(slug: string): Promise<AiraloOrderStatusResponse> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get(`/v2/orders/statuses/${slug}`, { headers }));
    }

    /**
     * Retrieves a list of SIMs
     * @param {AiraloSIMListParams} params - Parameters for filtering and pagination
     * @returns {Promise<PaginatedResponse<AiraloSIM>>} Paginated list of SIMs
     */
    async getSIMs(params: AiraloSIMListParams): Promise<PaginatedResponse<AiraloSIM>> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get('/v2/sims', { headers, params }));
    }

    /**
     * Retrieves a specific SIM by ICCID
     * @param {string} iccid - The ICCID of the SIM to retrieve
     * @returns {Promise<AiraloSIM>} The requested SIM
     */
    async getSIM(iccid: string): Promise<AiraloSIM> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get(`/v2/sims/${iccid}`, { headers }));
    }

    /**
     * Retrieves instructions for a specific SIM
     * @param {string} iccid - The ICCID of the SIM
     * @returns {Promise<AiraloSIMInstructions>} Installation instructions for the SIM
     */
    async getSIMInstructions(iccid: string): Promise<AiraloSIMInstructions> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get(`/v2/sims/${iccid}/instructions`, { headers }));
    }

    /**
     * Retrieves usage information for a specific SIM
     * @param {string} iccid - The ICCID of the SIM
     * @returns {Promise<AiraloSIMUsage>} Usage information for the SIM
     */
    async getSIMUsage(iccid: string): Promise<AiraloSIMUsage> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get(`/v2/sims/${iccid}/usage`, { headers }));
    }

    /**
     * Retrieves brand information for a specific SIM
     * @param {string} iccid - The ICCID of the SIM
     * @returns {Promise<AiraloSIMBrand>} Brand information for the SIM
     */
    async getSIMBrand(iccid: string): Promise<AiraloSIMBrand> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get(`/v2/sims/${iccid}/brand`, { headers }));
    }

    /**
     * Retrieves brand information for a specific SIM
     * @param {string} iccid - The ICCID of the SIM
     * @returns {Promise<AiraloSIMBrand>} Brand information for the SIM
     */
    async updateSIMBrand(iccid: string, brand_settings_name?: string): Promise<AiraloSIMBrand> {
        const headers = await this.getHeaders();
        const formData = new FormData();

        // Append all order data to FormData
        if (brand_settings_name) {
            formData.append('brand_settings_name', brand_settings_name);
        }

        return this.handleRequest(() =>
            this.axiosInstance.put(`/v2/sims/${iccid}/brand`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            })
        );
    }

    /**
     * Retrieves available packages for a specific SIM
     * @param {string} iccid - The ICCID of the SIM
     * @returns {Promise<AiraloSIMPackage[]>} List of available packages
     */
    async getSIMPackages(iccid: string): Promise<AiraloSIMPackage[]> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get(`/v2/sims/${iccid}/packages`, { headers }));
    }

    /**
     * Retrieves topup history for a specific SIM
     * @param {string} iccid - The ICCID of the SIM
     * @returns {Promise<AiraloSIMTopup[]>} List of topup transactions
     */
    async getSIMTopups(iccid: string): Promise<AiraloSIMTopup[]> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get(`/v2/sims/${iccid}/topups`, { headers }));
    }

    /**
     * Retrieves a list of available packages
     * @param {AiraloPackageListParams} params - Parameters for filtering and pagination
     * @returns {Promise<PaginatedResponse<AiraloPackage>>} Paginated list of packages
     */
    async getPackages(params: AiraloPackageListParams): Promise<PaginatedResponse<AiraloPackage>> {
        const headers = await this.getHeaders();
        return this.handleRequest(() =>
            this.axiosInstance.get('/v2/packages', {
                headers,
                params: {
                    'filter[type]': params.type,
                    'filter[country]': params.country,
                    limit: params.limit,
                    page: params.page,
                },
            }),
        );
    }

    /**
     * Retrieves a list of compatible devices
     * @returns {Promise<AiraloCompatibleDevice[]>} List of compatible devices
     */
    async getCompatibleDevices(): Promise<AiraloCompatibleDevice[]> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get('/v2/compatible-devices', { headers }));
    }

    /**
     * Opts in to receive notifications
     * @param {AiraloNotificationOptIn} data - Notification preferences
     * @returns {Promise<void>}
     */
    async optInNotifications(data: AiraloNotificationOptIn): Promise<void> {
        const headers = await this.getHeaders();
        await this.handleRequest(() => this.axiosInstance.post('/v2/notifications/opt-in', data, { headers }));
    }

    /**
     * Opts out from receiving notifications
     * @returns {Promise<void>}
     */
    async optOutNotifications(): Promise<void> {
        const headers = await this.getHeaders();
        await this.handleRequest(() => this.axiosInstance.post('/v2/notifications/opt-out', {}, { headers }));
    }

    /**
     * Simulates a webhook event
     * @param {AiraloWebhookSimulation} data - Webhook simulation parameters
     * @returns {Promise<void>}
     */
    async simulateWebhook(data: AiraloWebhookSimulation): Promise<void> {
        const headers = await this.getHeaders();
        await this.handleRequest(() => this.axiosInstance.post('/v2/simulator/webhook', data, { headers }));
    }

    /**
     * Retrieves current balance information
     * @returns {Promise<AiraloBalance>} Current balance information
     */
    async getBalance(): Promise<AiraloBalance> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.get('/v2/balance', { headers }));
    }

    /**
     * Redeems an eSIM voucher
     * @param {AiraloVoucherESIM} data - Voucher redemption details
     * @returns {Promise<AiraloOrder>} The order created from the voucher
     */
    async redeemESIMVoucher(data: AiraloVoucherESIM): Promise<AiraloOrder> {
        const headers = await this.getHeaders();
        return this.handleRequest(() => this.axiosInstance.post('/v2/voucher/esim', data, { headers }));
    }

    /**
     * Redeems an Airmoney voucher
     * @param {AiraloVoucherAirmoney} data - Airmoney voucher details
     * @returns {Promise<void>}
     */
    async redeemAirmoneyVoucher(data: AiraloVoucherAirmoney): Promise<void> {
        const headers = await this.getHeaders();
        await this.handleRequest(() => this.axiosInstance.post('/v2/voucher/airmoney', data, { headers }));
    }
}
