// Device and Authentication Types
export interface DeviceInfo {
    serialNumber: string
    macAddress: string
    uuid: string
}

export interface AuthRequest {
    serial_number: string
    mac_address: string
    device_info: {
        platform: string
        userAgent: string
        uuid: string
    }
}

export interface RegisterRequest {
    serial_number: string
    mac_address: string
    device_info: {
        platform: string
        userAgent: string
        uuid: string
    }
    location?: {
        latitude: number
        longitude: number
    }
}

export interface AuthResponse {
    success: boolean
    data: {
        uuid: string
        token: string
        kiosk_name: string
        status: string
        configuration_url: string
        heartbeat_interval: number
        channels: Channel[]
        default_channel_id: number
    }
    error?: string
}

export interface KioskConfig {
    uuid: string
    name: string
    status: string
    channels: Channel[]
    defaultChannelId: number
    heartbeatInterval: number
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean
    data: T
    error?: string
    message?: string
}

// Channel Types
export interface Channel {
    id: number
    name: string
    logo_url: string
    description: string
    is_active: boolean
    channel_id?: number // For database compatibility
}

// Category Types
export interface Category {
    id: number
    name: string
    image: string
    products_count: number
    channel_id?: number // For database compatibility
    category_id?: number // For database compatibility
}

// Product Types
export interface Product {
    id: number
    name: string
    description: string
    price: number
    image: string
    category_id?: number // For database compatibility
}

// Cart Types
export interface CartItem {
    id: string
    productId: number
    name: string
    description: string
    price: number
    image: string
    quantity: number
    addedAt: Date
}

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'contactless'

// Transaction Types
export interface TransactionRequest {
    slot_number: number
    product_id: number
    quantity: number
    payment_method: PaymentMethod
    payment_data?: any
    customer_data?: any
    transaction_ref: string
}

export interface TransactionResponse {
    success: boolean
    data: {
        transaction_uuid: string
        remaining_stock: number
        total_amount: number
        timestamp: string
    }
    error?: string
}

export interface Transaction {
    uuid: string
    slotNumber: number
    items: CartItem[]
    totalAmount: number
    paymentMethod: PaymentMethod
    paymentData?: any
    customerData?: any
    status: 'pending' | 'completed' | 'failed' | 'pending_sync'
    createdAt: Date
    remainingStock?: number
}

// Payment Types
export interface PaymentData {
    cardNumber?: string
    expiryDate?: string
    cvv?: string
    cardholderName?: string
    contactlessType?: 'nfc' | 'chip'
    mobilePaymentType?: 'apple_pay' | 'google_pay' | 'samsung_pay'
    amount: number
    currency: string
}

export interface PaymentResult {
    success: boolean
    transactionId?: string
    authCode?: string
    receiptData?: string
    errorMessage?: string
    errorCode?: string
}

// Inventory Types
export interface InventorySlot {
    slot_number: number
    product_id: number | null
    product_name?: string
    current_stock: number
    max_capacity: number
    status: 'active' | 'inactive' | 'maintenance' | 'empty'
    last_refill?: string
    temperature?: number
    door_status?: 'open' | 'closed'
}

export interface InventoryStatus {
    slots: InventorySlot[]
    total_slots: number
    operational_slots: number
    last_updated: string
}

export interface InventoryUpdateRequest {
    slots: {
        slot_number: number
        current_stock: number
        temperature?: number
        door_status?: 'open' | 'closed'
    }[]
    timestamp?: string
}

// Monitoring Types
export interface HeartbeatRequest {
    firmware_version?: string
    hardware_status?: any
    temperature?: number
    network_status?: {
        connected: boolean
        strength: number
    }
    error_count?: number
    uptime?: number
}

export interface LowStockAlertRequest {
    slot_number: number
    current_stock: number
    threshold: number
    product_name?: string
}

export interface ErrorReportRequest {
    error_code: string
    error_message: string
    error_level: 'info' | 'warning' | 'error' | 'critical'
    component?: string
    additional_data?: any
}

export interface MaintenanceRequest {
    reason?: string
    estimated_duration?: number
}

// UI Component Types
export interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    persistent?: boolean
    actions?: ToastAction[]
}

export interface ToastAction {
    label: string
    action: () => void
    color?: string
}

export interface Dialog {
    id: string
    title: string
    message: string
    type: 'confirm' | 'alert' | 'prompt'
    persistent?: boolean
    actions: DialogAction[]
}

export interface DialogAction {
    label: string
    action: () => void | Promise<void>
    color?: string
    variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
}

// Navigation Types
export interface NavigationItem {
    title: string
    icon: string
    route: string
    requiresAuth?: boolean
    badge?: string | number
}

// Settings Types
export interface AppSettings {
    theme: 'light' | 'dark' | 'auto'
    language: string
    currency: string
    screensaverTimeout: number
    navigationTimeout: number
    soundEnabled: boolean
    hapticFeedback: boolean
    autoSync: boolean
    offlineMode: boolean
    debugMode: boolean
}

export interface KioskSettings {
    displayBrightness: number
    volume: number
    timezone: string
    operatingHours: {
        enabled: boolean
        start: string
        end: string
    }
    maintenanceMode: boolean
    allowCash: boolean
    allowCard: boolean
    allowContactless: boolean
    allowMobile: boolean
    maxItemsPerTransaction: number
    maxTransactionAmount: number
}

// Error Types
export interface AppError {
    code: string
    message: string
    level: 'info' | 'warning' | 'error' | 'critical'
    component?: string
    timestamp: Date
    additionalData?: any
    stack?: string
}

export interface NetworkError extends AppError {
    statusCode?: number
    endpoint?: string
    method?: string
}

export interface ValidationError extends AppError {
    field?: string
    value?: any
    rules?: string[]
}

// Analytics Types
export interface AnalyticsEvent {
    type: string
    category: string
    action: string
    label?: string
    value?: number
    properties?: Record<string, any>
    timestamp: Date
}

export interface SessionMetrics {
    sessionId: string
    startTime: Date
    endTime?: Date
    duration?: number
    pageViews: number
    interactions: number
    errors: number
    transactions: number
    revenue: number
}

// Sync Types
export interface SyncQueueItem {
    id: number
    type: string
    data: string
    retry_count: number
    created_at: number
}

export interface SyncStatus {
    lastSync?: Date
    pendingItems: number
    failedItems: number
    issyncing: boolean
    errors: string[]
}

// Performance Types
export interface PerformanceMetrics {
    loadTime: number
    renderTime: number
    apiResponseTime: number
    memoryUsage: number
    cpuUsage: number
    networkLatency: number
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
    data: T | null
    loading: boolean
    error: string | null
    lastUpdated?: Date
}

export interface PaginationParams {
    page: number
    perPage: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
    data: T[]
    pagination: {
        current_page: number
        total: number
        per_page: number
        last_page: number
        has_next: boolean
        has_prev: boolean
    }
}

// Validation Types
export interface ValidationRule {
    required?: boolean
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
    [field: string]: ValidationRule[]
}

export interface ValidationResult {
    valid: boolean
    errors: Record<string, string[]>
}

// Configuration Types
export interface AppConfig {
    apiBaseUrl: string
    version: string
    environment: 'development' | 'staging' | 'production'
    features: {
        offlineMode: boolean
        analytics: boolean
        crashReporting: boolean
        debugging: boolean
    }
    limits: {
        maxCartItems: number
        maxTransactionAmount: number
        sessionTimeout: number
        syncRetries: number
    }
    ui: {
        theme: string
        primaryColor: string
        secondaryColor: string
        logoUrl: string
    }
}

// Event Types
export interface AppEvent {
    type: string
    payload?: any
    timestamp: Date
}

export interface UserInteractionEvent extends AppEvent {
    type: 'user_interaction'
    payload: {
        action: string
        component: string
        value?: any
    }
}

export interface SystemEvent extends AppEvent {
    type: 'system_event'
    payload: {
        event: string
        data?: any
    }
}

// Form Types
export interface FormField {
    name: string
    type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio'
    label: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    options?: { value: any; text: string }[]
    validation?: ValidationRule[]
}

export interface FormData {
    [key: string]: any
}

export interface FormState {
    data: FormData
    errors: Record<string, string[]>
    touched: Record<string, boolean>
    submitting: boolean
    valid: boolean
}

// Receipt Types
export interface ReceiptData {
    transactionId: string
    kioskName: string
    location?: string
    timestamp: Date
    items: CartItem[]
    subtotal: number
    tax: number
    total: number
    paymentMethod: PaymentMethod
    changeGiven?: number
    receiptNumber: string
    qrCode?: string
}

// Maintenance Types
export interface MaintenanceLog {
    id: string
    type: 'scheduled' | 'emergency' | 'preventive'
    reason: string
    startTime: Date
    endTime?: Date
    duration?: number
    performedBy: string
    notes?: string
    checklist?: MaintenanceChecklistItem[]
}

export interface MaintenanceChecklistItem {
    id: string
    description: string
    completed: boolean
    notes?: string
    timestamp?: Date
}

// Notification Types
export interface NotificationPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: any
    actions?: NotificationAction[]
}

export interface NotificationAction {
    action: string
    title: string
    icon?: string
}

// Security Types
export interface SecurityEvent {
    type: 'login_attempt' | 'unauthorized_access' | 'tampering_detected' | 'security_breach'
    severity: 'low' | 'medium' | 'high' | 'critical'
    details: string
    timestamp: Date
    resolved: boolean
}