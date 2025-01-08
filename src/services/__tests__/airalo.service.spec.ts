import axios from 'axios';
import {
    AiraloError,
    AiraloErrorCode,
    AiraloOrder,
    AiraloOrderStatus,
    AiraloSIM,
    AiraloSIMPackage,
    PaginatedResponse,
} from '../../interfaces';
import { AiraloConfig, AiraloService } from '../airalo.service';

jest.mock('axios');

describe('AiraloService', () => {
    let service: AiraloService;
    const mockConfig: AiraloConfig = {
        baseUrl: 'https://api.test.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
    };

    const mockAxiosInstance = {
        interceptors: {
            response: {
                use: jest.fn((_, errorHandler) => {
                    // Store error handler for testing
                    mockAxiosInstance.interceptors.response.errorHandler = errorHandler;
                }),
                errorHandler: null as any,
            },
        },
        get: jest.fn(),
        post: jest.fn(),
    };

    const mockAuthResponse = {
        data: {
            data: {
                access_token: 'test-token',
                token_type: 'Bearer',
                expires_in: 3600,
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
        // Set up default authentication mock
        mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);
        service = new AiraloService(mockConfig);
    });

    describe('constructor', () => {
        it('should create axios instance with correct config', () => {
            expect(axios.create).toHaveBeenCalledWith({
                baseURL: mockConfig.baseUrl,
                headers: {
                    Accept: 'application/json',
                },
            });
            expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
        });
    });

    describe('authentication', () => {
        it('should authenticate successfully', async () => {
            const mockResponse = {
                data: {
                    data: {
                        access_token: 'test-token',
                        token_type: 'Bearer',
                        expires_in: 3600,
                    },
                },
            };

            mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

            await service.authenticate();

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/token', expect.any(FormData));
        });

        it('should handle authentication error', async () => {
            const errorResponse = {
                response: {
                    status: 422,
                    data: {
                        code: AiraloErrorCode.BAD_REQUEST,
                        message: 'Invalid credentials',
                    },
                },
            };

            // Use the error handler directly
            await expect(
                mockAxiosInstance.interceptors.response.errorHandler(errorResponse)
            ).rejects.toThrow(AiraloError);
        });
    });

    describe('order management', () => {
        const mockOrder: AiraloOrder = {
            id: 1,
            user_id: 1,
            status: 'completed' as AiraloOrderStatus,
            total: 10,
            currency: 'USD',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
        };

        beforeEach(() => {
            mockAxiosInstance.post.mockReset();
            mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);
            mockAxiosInstance.get.mockResolvedValue({ data: mockOrder });
            mockAxiosInstance.post.mockResolvedValue({ data: mockOrder });
        });

        it('should get orders list', async () => {
            const mockResponse: PaginatedResponse<AiraloOrder> = {
                data: [mockOrder],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    total: 1,
                },
            };

            mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

            const result = await service.getOrders({
                limit: 10,
                page: 1,
                orderStatus: 'completed',
            });

            expect(result).toEqual(mockResponse);
        });

        it('should get single order', async () => {
            const result = await service.getOrder(1);
            expect(result).toEqual(mockOrder);
        });

        it('should create order', async () => {
            const orderData = {
                package_id: 1,
                quantity: 1,
                description: 'Test order',
            };

            const result = await service.createOrder(orderData);
            expect(result).toEqual(mockOrder);
        });

        it('should create async order', async () => {
            const mockResponse = { request_id: 'test-request-id' };
            mockAxiosInstance.post.mockReset();
            mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);
            mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

            const orderData = {
                package_id: 1,
                quantity: 1,
                callback_url: 'https://test.com/callback',
            };

            const result = await service.createAsyncOrder(orderData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('SIM management', () => {
        const mockSIM: AiraloSIM = {
            id: 1,
            iccid: '12345678901234567890',
            status: 'active',
            activation_code: 'TEST123',
            qr_code: 'data:image/png;base64,test',
            manual_activation: {
                sm_dp_address: 'test.com',
                activation_code: 'TEST123',
                confirmation_code: 'CONF123',
            },
        };

        beforeEach(() => {
            mockAxiosInstance.post.mockReset();
            mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);
            mockAxiosInstance.get.mockResolvedValue({ data: mockSIM });
        });

        it('should get SIMs list', async () => {
            const mockResponse: PaginatedResponse<AiraloSIM> = {
                data: [mockSIM],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    total: 1,
                },
            };

            mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

            const result = await service.getSIMs({
                limit: 10,
                page: 1,
            });

            expect(result).toEqual(mockResponse);
        });

        it('should get single SIM', async () => {
            const result = await service.getSIM('12345678901234567890');
            expect(result).toEqual(mockSIM);
        });

        it('should get SIM instructions', async () => {
            const mockInstructions = {
                qr_code: 'data:image/png;base64,test',
                manual: mockSIM.manual_activation,
                steps: {
                    ios: ['Step 1', 'Step 2'],
                    android: ['Step 1', 'Step 2'],
                },
            };

            mockAxiosInstance.get.mockResolvedValueOnce({ data: mockInstructions });

            const result = await service.getSIMInstructions('12345678901234567890');
            expect(result).toEqual(mockInstructions);
        });
    });

    describe('package management', () => {
        const mockPackage: AiraloSIMPackage = {
            id: 1,
            title: 'Test Package',
            data_amount: '1GB',
            validity_period: 30,
            price: 10,
            currency: 'USD',
            status: 'active',
        };

        beforeEach(() => {
            mockAxiosInstance.post.mockReset();
            mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);
            mockAxiosInstance.get.mockResolvedValue({ data: [mockPackage] });
        });

        it('should get packages list', async () => {
            const mockResponse: PaginatedResponse<AiraloSIMPackage> = {
                data: [mockPackage],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    total: 1,
                },
            };

            mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

            const result = await service.getPackages({
                type: 'local',
                country: 'TR',
                limit: 10,
                page: 1,
            });

            expect(result).toEqual(mockResponse);
        });
    });

    describe('error handling', () => {
        it('should handle rate limiting', async () => {
            const rateLimitError = {
                response: {
                    status: 429,
                },
            };

            mockAxiosInstance.post.mockReset();
            mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);

            let callCount = 0;
            mockAxiosInstance.get.mockImplementation(() => {
                callCount++;
                if (callCount < 3) {
                    return Promise.reject(rateLimitError);
                }
                return Promise.resolve({ data: { success: true } });
            });

            const result = await service.getBalance();
            expect(result).toEqual({ success: true });
            expect(callCount).toBe(3);
        });

        it('should handle unexpected errors', async () => {
            const unexpectedError = {
                response: {
                    status: 500,
                    data: {
                        message: 'Internal server error',
                    },
                },
            };

            // Use the error handler directly
            await expect(
                mockAxiosInstance.interceptors.response.errorHandler(unexpectedError)
            ).rejects.toThrow(AiraloError);
        });

        it('should handle network errors', async () => {
            const networkError = {
                message: 'Network error',
            };

            // Use the error handler directly
            await expect(
                mockAxiosInstance.interceptors.response.errorHandler(networkError)
            ).rejects.toThrow(AiraloError);
        });
    });

    describe('notification management', () => {
        beforeEach(() => {
            mockAxiosInstance.post.mockReset();
            mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);
        });

        it('should opt-in for notifications', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

            const data = {
                webhook_url: 'https://test.com/webhook',
                events: ['order.completed', 'sim.activated'],
            };

            await service.optInNotifications(data);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/notifications/opt-in', data, expect.any(Object));
        });

        it('should opt-out from notifications', async () => {
            mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

            await service.optOutNotifications();
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/notifications/opt-out', {}, expect.any(Object));
        });
    });

    describe('voucher management', () => {
        const mockOrder: AiraloOrder = {
            id: 1,
            user_id: 1,
            status: 'completed' as AiraloOrderStatus,
            total: 10,
            currency: 'USD',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
        };

        beforeEach(() => {
            mockAxiosInstance.post.mockReset();
            mockAxiosInstance.post.mockResolvedValueOnce(mockAuthResponse);
            mockAxiosInstance.post.mockResolvedValue({ data: mockOrder });
        });

        it('should redeem eSIM voucher', async () => {
            const voucherData = {
                code: 'TEST123',
                package_id: 1,
            };

            const result = await service.redeemESIMVoucher(voucherData);
            expect(result).toEqual(mockOrder);
        });

        it('should redeem Airmoney voucher', async () => {
            const voucherData = {
                code: 'TEST123',
                amount: 50,
                currency: 'USD',
            };

            await service.redeemAirmoneyVoucher(voucherData);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v2/voucher/airmoney', voucherData, expect.any(Object));
        });
    });
});
