import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type {
    AuthRequest,
    AuthResponse,
    RegisterRequest,
    ApiResponse,
    Channel,
    Category,
    Product,
    TransactionRequest,
    TransactionResponse,
    HeartbeatRequest,
    InventoryUpdateRequest,
    LowStockAlertRequest,
    ErrorReportRequest,
    MaintenanceRequest,
    InventoryStatus
} from '@/types'

class ApiService {
    private client: AxiosInstance
    private baseUrl: string = ''
    private token: string | null = null

    constructor() {
        this.client = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })

        this.setupInterceptors()
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`
                }

                // Add request timestamp
                config.metadata = { startTime: new Date() }

                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                // Log response time
                const endTime = new Date()
                const duration = endTime.getTime() - response.config.metadata?.startTime?.getTime()
                console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)

                return response
            },
            (error) => {
                // Handle common errors
                if (error.response?.status === 401) {
                    // Unauthorized - token might be expired
                    this.token = null
                    // Could trigger re-authentication here
                }

                if (error.response?.status === 503) {
                    // Service unavailable - might be maintenance mode
                    console.log('Service unavailable - maintenance mode?')
                }

                return Promise.reject(error)
            }
        )
    }

    setBaseUrl(url: string): void {
        this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url
        this.client.defaults.baseURL = this.baseUrl
    }

    setToken(token: string | null): void {
        this.token = token
    }

    private async request<T>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        endpoint: string,
        data?: any
    ): Promise<T> {
        try {
            const response = await this.client.request({
                method,
                url: endpoint,
                data
            })

            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.data) {
                    throw new Error(error.response.data.error || error.response.data.message || 'API Error')
                } else if (error.code === 'ECONNABORTED') {
                    throw new Error('Request timeout')
                } else if (error.code === 'ERR_NETWORK') {
                    throw new Error('Network error - check connection')
                }
            }
            throw error
        }
    }

    // Authentication endpoints
    async authenticate(data: AuthRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>('POST', '/api/v1/kiosks/authenticate', data)
    }

    async register(data: RegisterRequest): Promise<ApiResponse> {
        return this.request<ApiResponse>('POST', '/api/v1/kiosks/register', data)
    }

    // Core operations
    async heartbeat(data: HeartbeatRequest): Promise<ApiResponse> {
        return this.request<ApiResponse>('POST', '/api/v1/kiosks/heartbeat', data)
    }

    async getConfiguration(): Promise<ApiResponse> {
        return this.request<ApiResponse>('GET', '/api/v1/kiosks/configuration')
    }

    // Channel and catalog operations
    async getChannels(): Promise<ApiResponse<Channel[]>> {
        return this.request<ApiResponse<Channel[]>>('GET', '/api/v1/kiosks/channels')
    }

    async getCategories(channelId: number): Promise<ApiResponse<Category[]>> {
        return this.request<ApiResponse<Category[]>>('GET', `/api/v1/kiosks/categories?channel_id=${channelId}`)
    }

    async getProducts(categoryId: number, channelId: number, perPage?: number): Promise<ApiResponse<{
        data: Product[]
        pagination: {
            current_page: number
            total: number
            per_page: number
            last_page: number
        }
    }>> {
        const params = new URLSearchParams({
            category_id: categoryId.toString(),
            channel_id: channelId.toString()
        })

        if (perPage) {
            params.append('per_page', perPage.toString())
        }

        return this.request<ApiResponse<any>>('GET', `/api/v1/kiosks/products?${params}`)
    }

    // Transaction and inventory
    async processTransaction(data: TransactionRequest): Promise<TransactionResponse> {
        return this.request<TransactionResponse>('POST', '/api/v1/kiosks/transaction', data)
    }

    async updateInventory(data: InventoryUpdateRequest): Promise<ApiResponse> {
        return this.request<ApiResponse>('POST', '/api/v1/kiosks/inventory/update', data)
    }

    async getInventoryStatus(): Promise<ApiResponse<InventoryStatus>> {
        return this.request<ApiResponse<InventoryStatus>>('GET', '/api/v1/kiosks/inventory/status')
    }

    // Alerts and monitoring
    async lowStockAlert(data: LowStockAlertRequest): Promise<ApiResponse> {
        return this.request<ApiResponse>('POST', '/api/v1/kiosks/alerts/low-stock', data)
    }

    async reportError(data: ErrorReportRequest): Promise<ApiResponse> {
        return this.request<ApiResponse>('POST', '/api/v1/kiosks/errors/report', data)
    }

    // Maintenance
    async startMaintenance(data: MaintenanceRequest): Promise<ApiResponse> {
        return this.request<ApiResponse>('POST', '/api/v1/kiosks/maintenance/start', data)
    }

    async endMaintenance(): Promise<ApiResponse> {
        return this.request<ApiResponse>('POST', '/api/v1/kiosks/maintenance/end')
    }

    // Utility methods
    async testConnection(): Promise<boolean> {
        try {
            // Try to make a simple request to test connectivity
            await this.request<any>('GET', '/api/v1/kiosks/channels')
            return true
        } catch (error) {
            return false
        }
    }

    async checkServerHealth(): Promise<{
        status: 'healthy' | 'unhealthy'
        timestamp: string
        version?: string
    }> {
        try {
            // This would be a dedicated health check endpoint
            const response = await this.request<any>('GET', '/health')
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: response.version
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString()
            }
        }
    }

    // Batch operations for sync
    async syncChannels(): Promise<Channel[]> {
        const response = await this.getChannels()
        return response.success ? response.data : []
    }

    async syncCategories(channelId: number): Promise<Category[]> {
        const response = await this.getCategories(channelId)
        return response.success ? response.data : []
    }

    async syncProducts(categoryId: number, channelId: number): Promise<Product[]> {
        const response = await this.getProducts(categoryId, channelId, 1000)
        return response.success ? response.data.data : []
    }

    // Error handling utilities
    isNetworkError(error: any): boolean {
        return axios.isAxiosError(error) && (
            error.code === 'ERR_NETWORK' ||
            error.code === 'ECONNABORTED' ||
            !error.response
        )
    }

    isAuthError(error: any): boolean {
        return axios.isAxiosError(error) && error.response?.status === 401
    }

    isServerError(error: any): boolean {
        return axios.isAxiosError(error) &&
            error.response?.status !== undefined &&
            error.response.status >= 500
    }

    getErrorMessage(error: any): string {
        if (axios.isAxiosError(error)) {
            if (error.response?.data?.error) {
                return error.response.data.error
            } else if (error.response?.data?.message) {
                return error.response.data.message
            } else if (error.code === 'ERR_NETWORK') {
                return 'Network connection failed'
            } else if (error.code === 'ECONNABORTED') {
                return 'Request timeout'
            }
        }

        return error instanceof Error ? error.message : 'Unknown error occurred'
    }
}

export const apiService = new ApiService()