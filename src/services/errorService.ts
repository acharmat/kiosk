import { apiService } from './apiService'
import type { ErrorReportRequest, AppError, NetworkError, ValidationError } from '@/types'

class ErrorService {
    private errorQueue: ErrorReportRequest[] = []
    private maxQueueSize = 50
    private retryAttempts = 3
    private retryDelay = 5000 // 5 seconds

    /**
     * Report an error to the backend
     */
    async reportError(errorData: Partial<ErrorReportRequest>): Promise<void> {
        const error: ErrorReportRequest = {
            error_code: errorData.error_code || 'UNKNOWN_ERROR',
            error_message: errorData.error_message || 'An unknown error occurred',
            error_level: errorData.error_level || 'error',
            component: errorData.component || 'unknown',
            additional_data: {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                ...errorData.additional_data
            }
        }

        try {
            if (navigator.onLine) {
                await apiService.reportError(error)
                console.log('Error reported successfully:', error.error_code)
            } else {
                this.queueError(error)
            }
        } catch (reportingError) {
            console.warn('Failed to report error, queuing for later:', reportingError)
            this.queueError(error)
        }
    }

    /**
     * Queue an error for later reporting when connection is restored
     */
    private queueError(error: ErrorReportRequest): void {
        if (this.errorQueue.length >= this.maxQueueSize) {
            // Remove oldest error to make room
            this.errorQueue.shift()
        }

        this.errorQueue.push(error)

        // Store in local storage for persistence
        if (window.electronAPI) {
            window.electronAPI.addToSyncQueue('error_report', error)
        }
    }

    /**
     * Retry sending queued errors
     */
    async retryQueuedErrors(): Promise<void> {
        if (!navigator.onLine || this.errorQueue.length === 0) {
            return
        }

        const errorsToRetry = [...this.errorQueue]
        this.errorQueue = []

        for (const error of errorsToRetry) {
            try {
                await apiService.reportError(error)
                console.log('Queued error reported successfully:', error.error_code)
            } catch (retryError) {
                console.warn('Failed to retry error report:', retryError)
                // Re-queue the error with retry limit
                if ((error.additional_data?.retryCount || 0) < this.retryAttempts) {
                    error.additional_data = {
                        ...error.additional_data,
                        retryCount: (error.additional_data?.retryCount || 0) + 1
                    }
                    this.queueError(error)
                }
            }
        }
    }

    /**
     * Handle JavaScript errors
     */
    handleJavaScriptError(event: ErrorEvent): void {
        const error: ErrorReportRequest = {
            error_code: 'JS_ERROR',
            error_message: event.message,
            error_level: 'error',
            component: 'javascript',
            additional_data: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            }
        }

        this.reportError(error)
    }

    /**
     * Handle unhandled promise rejections
     */
    handleUnhandledRejection(event: PromiseRejectionEvent): void {
        const error: ErrorReportRequest = {
            error_code: 'UNHANDLED_PROMISE_REJECTION',
            error_message: event.reason?.toString() || 'Unhandled promise rejection',
            error_level: 'error',
            component: 'promise',
            additional_data: {
                reason: event.reason,
                timestamp: new Date().toISOString()
            }
        }

        this.reportError(error)
    }

    /**
     * Handle API errors
     */
    handleApiError(endpoint: string, method: string, error: any): NetworkError {
        const networkError: NetworkError = {
            code: 'API_ERROR',
            message: error.message || 'API request failed',
            level: 'error',
            component: 'api',
            timestamp: new Date(),
            endpoint,
            method,
            statusCode: error.response?.status,
            additionalData: {
                response: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    timeout: error.config?.timeout
                }
            }
        }

        this.reportError({
            error_code: networkError.code,
            error_message: networkError.message,
            error_level: networkError.level,
            component: networkError.component,
            additional_data: {
                endpoint: networkError.endpoint,
                method: networkError.method,
                statusCode: networkError.statusCode,
                ...networkError.additionalData
            }
        })

        return networkError
    }

    /**
     * Handle validation errors
     */
    handleValidationError(field: string, value: any, rules: string[]): ValidationError {
        const validationError: ValidationError = {
            code: 'VALIDATION_ERROR',
            message: `Validation failed for field: ${field}`,
            level: 'warning',
            component: 'validation',
            timestamp: new Date(),
            field,
            value,
            rules,
            additionalData: {
                fieldType: typeof value,
                ruleCount: rules.length
            }
        }

        this.reportError({
            error_code: validationError.code,
            error_message: validationError.message,
            error_level: validationError.level,
            component: validationError.component,
            additional_data: {
                field: validationError.field,
                value: validationError.value,
                rules: validationError.rules,
                ...validationError.additionalData
            }
        })

        return validationError
    }

    /**
     * Handle performance errors
     */
    handlePerformanceError(metric: string, value: number, threshold: number): void {
        const error: ErrorReportRequest = {
            error_code: 'PERFORMANCE_ISSUE',
            error_message: `Performance threshold exceeded for ${metric}`,
            error_level: 'warning',
            component: 'performance',
            additional_data: {
                metric,
                value,
                threshold,
                exceedBy: value - threshold,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                memory: (performance as any).memory ? {
                    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                    jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
                } : null
            }
        }

        this.reportError(error)
    }

    /**
     * Handle kiosk-specific errors
     */
    handleKioskError(errorType: string, details: any): void {
        const error: ErrorReportRequest = {
            error_code: `KIOSK_${errorType.toUpperCase()}`,
            error_message: `Kiosk error: ${errorType}`,
            error_level: this.getErrorLevelForKioskError(errorType),
            component: 'kiosk',
            additional_data: {
                errorType,
                details,
                timestamp: new Date().toISOString()
            }
        }

        this.reportError(error)
    }

    /**
     * Get appropriate error level for kiosk errors
     */
    private getErrorLevelForKioskError(errorType: string): 'info' | 'warning' | 'error' | 'critical' {
        const criticalErrors = ['hardware_failure', 'security_breach', 'payment_failure']
        const errorErrors = ['network_failure', 'authentication_failure', 'transaction_failure']
        const warningErrors = ['low_stock', 'sensor_malfunction', 'cache_miss']

        if (criticalErrors.includes(errorType)) return 'critical'
        if (errorErrors.includes(errorType)) return 'error'
        if (warningErrors.includes(errorType)) return 'warning'
        return 'info'
    }

    /**
     * Create a standardized error object
     */
    createError(
        code: string,
        message: string,
        level: 'info' | 'warning' | 'error' | 'critical' = 'error',
        component: string = 'unknown',
        additionalData?: any
    ): AppError {
        return {
            code,
            message,
            level,
            component,
            timestamp: new Date(),
            additionalData
        }
    }

    /**
     * Log error to console with appropriate level
     */
    logError(error: AppError): void {
        const logMessage = `[${error.level.toUpperCase()}] ${error.code}: ${error.message}`

        switch (error.level) {
            case 'critical':
            case 'error':
                console.error(logMessage, error)
                break
            case 'warning':
                console.warn(logMessage, error)
                break
            case 'info':
                console.info(logMessage, error)
                break
        }
    }

    /**
     * Initialize error handling
     */
    initialize(): void {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event)
        })

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event)
        })

        // Handle network status changes
        window.addEventListener('online', () => {
            this.retryQueuedErrors()
        })

        // Monitor performance
        this.initializePerformanceMonitoring()

        console.log('Error service initialized')
    }

    /**
     * Initialize performance monitoring
     */
    private initializePerformanceMonitoring(): void {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

                if (perfData) {
                    const loadTime = perfData.loadEventEnd - perfData.fetchStart
                    const domContentLoadedTime = perfData.domContentLoadedEventEnd - perfData.fetchStart

                    // Report if load time exceeds threshold (5 seconds)
                    if (loadTime > 5000) {
                        this.handlePerformanceError('page_load_time', loadTime, 5000)
                    }

                    // Report if DOM content loaded time exceeds threshold (3 seconds)
                    if (domContentLoadedTime > 3000) {
                        this.handlePerformanceError('dom_content_loaded_time', domContentLoadedTime, 3000)
                    }
                }
            }, 0)
        })

        // Monitor memory usage (if available)
        if ((performance as any).memory) {
            setInterval(() => {
                const memory = (performance as any).memory
                const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit

                // Report if memory usage exceeds 80%
                if (memoryUsage > 0.8) {
                    this.handlePerformanceError('memory_usage', memoryUsage * 100, 80)
                }
            }, 60000) // Check every minute
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats(): {
        queuedErrors: number
        totalErrors: number
        errorsByLevel: Record<string, number>
        errorsByComponent: Record<string, number>
    } {
        return {
            queuedErrors: this.errorQueue.length,
            totalErrors: 0, // Would be tracked in a real implementation
            errorsByLevel: {}, // Would be tracked in a real implementation
            errorsByComponent: {} // Would be tracked in a real implementation
        }
    }

    /**
     * Clear error queue
     */
    clearErrorQueue(): void {
        this.errorQueue = []
    }

    /**
     * Export errors for debugging
     */
    exportErrors(): string {
        return JSON.stringify({
            queuedErrors: this.errorQueue,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        }, null, 2)
    }

    /**
     * Test error reporting (for development)
     */
    testErrorReporting(): void {
        this.reportError({
            error_code: 'TEST_ERROR',
            error_message: 'This is a test error',
            error_level: 'info',
            component: 'error_service',
            additional_data: {
                test: true,
                timestamp: new Date().toISOString()
            }
        })
    }
}

export const errorService = new ErrorService()