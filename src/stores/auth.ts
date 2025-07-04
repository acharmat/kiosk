import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/apiService'
import { databaseService } from '@/services/databaseService'
import type { DeviceInfo, KioskConfig, AuthResponse } from '@/types'

export const useAuthStore = defineStore('auth', () => {
    // Check if we're in development mode
    const isDev = import.meta.env.DEV

    // State
    const isAuthenticated = ref(false)
    const isLoading = ref(false)
    const deviceInfo = ref<DeviceInfo | null>(null)
    const kioskConfig = ref<KioskConfig | null>(null)
    const authToken = ref<string | null>(null)
    const lastHeartbeat = ref<Date | null>(null)
    const isMaintenanceMode = ref(false)
    const isOffline = ref(!navigator.onLine)
    const setupComplete = ref(false)
    const apiBaseUrl = ref<string | null>(null)

    // Computed
    const isDeviceSetup = computed(() => {
        if (isDev) {
            // In development, consider setup complete if we have API URL
            return !!(apiBaseUrl.value)
        }
        return !!(deviceInfo.value && apiBaseUrl.value && setupComplete.value)
    })

    const hasDeviceInfo = computed(() => {
        if (isDev) {
            // In development, always return true
            return true
        }
        return !!(deviceInfo.value?.serialNumber && deviceInfo.value?.macAddress)
    })

    const isOperational = computed(() => {
        return isAuthenticated.value && !isMaintenanceMode.value && !isOffline.value
    })

    // Actions
    const loadDeviceInfo = async (): Promise<void> => {
        try {
            if (window.electronAPI) {
                const info = await window.electronAPI.getDeviceInfo()
                deviceInfo.value = info

                // Load API config
                const config = await window.electronAPI.getAppConfig('api')
                if (config) {
                    apiBaseUrl.value = config.baseUrl
                    authToken.value = config.token
                }

                // Load setup status
                const setup = await window.electronAPI.getAppConfig('setup')
                setupComplete.value = setup?.complete || false
            } else if (isDev) {
                // Development mode - create mock device info
                console.log('🔧 Development mode: Creating mock device info')
                deviceInfo.value = {
                    serialNumber: 'DEV-' + Date.now(),
                    macAddress: '00:00:00:00:00:00',
                    uuid: 'dev-uuid-' + Math.random().toString(36).substr(2, 9)
                }

                // Load config from localStorage in dev mode
                const storedConfig = localStorage.getItem('kiosk-dev-config')
                if (storedConfig) {
                    const config = JSON.parse(storedConfig)
                    apiBaseUrl.value = config.baseUrl || 'http://blup.test'
                    authToken.value = config.token
                } else {
                    // Default to local backend
                    apiBaseUrl.value = 'http://blup.test'
                }

                setupComplete.value = true
            }
        } catch (error) {
            console.error('Failed to load device info:', error)
            if (isDev) {
                console.log('🔧 Development mode: Using fallback device info')
                deviceInfo.value = {
                    serialNumber: 'DEV-FALLBACK',
                    macAddress: '00:00:00:00:00:00',
                    uuid: 'dev-fallback-uuid'
                }
                apiBaseUrl.value = 'http://blup.test'
                setupComplete.value = true
            } else {
                throw error
            }
        }
    }

    const saveApiConfig = async (baseUrl: string, token?: string): Promise<void> => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.setAppConfig('api', {
                    baseUrl,
                    token: token || authToken.value
                })
            } else if (isDev) {
                // Save to localStorage in dev mode
                localStorage.setItem('kiosk-dev-config', JSON.stringify({
                    baseUrl,
                    token: token || authToken.value
                }))
            }

            apiBaseUrl.value = baseUrl
            if (token) authToken.value = token
        } catch (error) {
            console.error('Failed to save API config:', error)
            throw error
        }
    }

    const completeSetup = async (): Promise<void> => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.setAppConfig('setup', {
                    complete: true,
                    completedAt: new Date().toISOString()
                })
            } else if (isDev) {
                localStorage.setItem('kiosk-dev-setup', JSON.stringify({
                    complete: true,
                    completedAt: new Date().toISOString()
                }))
            }
            setupComplete.value = true
        } catch (error) {
            console.error('Failed to complete setup:', error)
            throw error
        }
    }

    const authenticate = async (): Promise<AuthResponse> => {
        if (!hasDeviceInfo.value || !apiBaseUrl.value) {
            throw new Error('Device not properly configured')
        }

        isLoading.value = true

        try {
            // Set API base URL
            apiService.setBaseUrl(apiBaseUrl.value)

            const response = await apiService.authenticate({
                serial_number: deviceInfo.value!.serialNumber,
                mac_address: deviceInfo.value!.macAddress,
                device_info: {
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    uuid: deviceInfo.value!.uuid
                }
            })

            if (response.success) {
                authToken.value = response.data.token
                kioskConfig.value = {
                    uuid: response.data.uuid,
                    name: response.data.kiosk_name,
                    status: response.data.status,
                    channels: response.data.channels,
                    defaultChannelId: response.data.default_channel_id,
                    heartbeatInterval: response.data.heartbeat_interval
                }

                // Save token
                await saveApiConfig(apiBaseUrl.value!, authToken.value)

                // Set token for API service
                apiService.setToken(authToken.value)

                isAuthenticated.value = true

                // Start heartbeat
                startHeartbeat()

                // Sync data
                await syncData()

                return response
            } else {
                throw new Error(response.error || 'Authentication failed')
            }
        } catch (error) {
            console.error('Authentication error:', error)

            if (isDev) {
                console.log('🔧 Development mode: Simulating successful authentication')
                // Mock successful authentication in dev mode
                authToken.value = 'dev-token-' + Date.now()
                kioskConfig.value = {
                    uuid: 'dev-kiosk-uuid',
                    name: 'Development Kiosk',
                    status: 'active',
                    channels: [],
                    defaultChannelId: 1,
                    heartbeatInterval: 60
                }

                apiService.setToken(authToken.value)
                isAuthenticated.value = true

                return {
                    success: true,
                    data: {
                        token: authToken.value,
                        uuid: kioskConfig.value.uuid,
                        kiosk_name: kioskConfig.value.name,
                        status: kioskConfig.value.status,
                        channels: kioskConfig.value.channels,
                        default_channel_id: kioskConfig.value.defaultChannelId,
                        heartbeat_interval: kioskConfig.value.heartbeatInterval
                    }
                }
            }

            throw error
        } finally {
            isLoading.value = false
        }
    }

    const register = async (location?: { latitude: number; longitude: number }): Promise<void> => {
        if (!hasDeviceInfo.value || !apiBaseUrl.value) {
            throw new Error('Device not properly configured')
        }

        isLoading.value = true

        try {
            apiService.setBaseUrl(apiBaseUrl.value)

            const response = await apiService.register({
                serial_number: deviceInfo.value!.serialNumber,
                mac_address: deviceInfo.value!.macAddress,
                device_info: {
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    uuid: deviceInfo.value!.uuid
                },
                location
            })

            if (!response.success) {
                throw new Error(response.error || 'Registration failed')
            }
        } catch (error) {
            console.error('Registration error:', error)

            if (isDev) {
                console.log('🔧 Development mode: Simulating successful registration')
                return // Mock success in dev mode
            }

            throw error
        } finally {
            isLoading.value = false
        }
    }

    const startHeartbeat = (): void => {
        if (!kioskConfig.value) return

        const interval = (kioskConfig.value.heartbeatInterval || 60) * 1000

        const sendHeartbeat = async () => {
            try {
                await apiService.heartbeat({
                    firmware_version: '1.0.0',
                    temperature: 25,
                    uptime: Math.floor(performance.now() / 1000),
                    network_status: {
                        connected: navigator.onLine,
                        strength: 100
                    }
                })
                lastHeartbeat.value = new Date()
            } catch (error) {
                if (!isDev) {
                    console.error('Heartbeat failed:', error)
                }
            }
        }

        // Send initial heartbeat
        sendHeartbeat()

        // Set up interval
        setInterval(sendHeartbeat, interval)
    }

    const syncData = async (): Promise<void> => {
        try {
            // Sync channels
            const channelsResponse = await apiService.getChannels()
            if (channelsResponse.success) {
                await databaseService.syncChannels(channelsResponse.data)
            }
        } catch (error) {
            if (!isDev) {
                console.error('Data sync failed:', error)
            }
        }
    }

    const enterMaintenanceMode = async (reason?: string, duration?: number): Promise<void> => {
        try {
            await apiService.startMaintenance({
                reason: reason || 'Manual maintenance mode',
                estimated_duration: duration
            })
            isMaintenanceMode.value = true
        } catch (error) {
            console.error('Failed to enter maintenance mode:', error)
            throw error
        }
    }

    const exitMaintenanceMode = async (): Promise<void> => {
        try {
            await apiService.endMaintenance()
            isMaintenanceMode.value = false
        } catch (error) {
            console.error('Failed to exit maintenance mode:', error)
            throw error
        }
    }

    const logout = async (): Promise<void> => {
        isAuthenticated.value = false
        authToken.value = null
        kioskConfig.value = null
        lastHeartbeat.value = null

        if (window.electronAPI) {
            await window.electronAPI.setAppConfig('api', {
                baseUrl: apiBaseUrl.value,
                token: null
            })
        } else if (isDev) {
            localStorage.removeItem('kiosk-dev-config')
        }
    }

    const reportError = async (error: {
        error_code: string
        error_message: string
        error_level: 'info' | 'warning' | 'error' | 'critical'
        component?: string
        additional_data?: any
    }): Promise<void> => {
        try {
            if (isAuthenticated.value && !isDev) {
                await apiService.reportError(error)
            } else {
                // Store for later sync or log in dev mode
                if (window.electronAPI) {
                    await window.electronAPI.addToSyncQueue('error_report', error)
                } else if (isDev) {
                    console.log('🔧 Dev Error Report:', error)
                }
            }
        } catch (err) {
            console.error('Failed to report error:', err)
        }
    }

    // Network status monitoring
    const updateNetworkStatus = (online: boolean): void => {
        isOffline.value = !online

        if (online && isAuthenticated.value && !isDev) {
            // Try to sync when coming back online (not in dev mode)
            syncData()
        }
    }

    // Initialize network monitoring
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => updateNetworkStatus(true))
        window.addEventListener('offline', () => updateNetworkStatus(false))
    }

    // Development mode helpers
    const setDevelopmentConfig = (config: { apiBaseUrl?: string; autoAuth?: boolean }) => {
        if (!isDev) {
            console.warn('setDevelopmentConfig only available in development mode')
            return
        }

        if (config.apiBaseUrl) {
            apiBaseUrl.value = config.apiBaseUrl
            localStorage.setItem('kiosk-dev-config', JSON.stringify({
                baseUrl: config.apiBaseUrl
            }))
        }

        if (config.autoAuth) {
            setTimeout(() => {
                authenticate().catch(console.error)
            }, 1000)
        }
    }

    // Auto-initialize in development mode
    if (isDev) {
        loadDeviceInfo().then(() => {
            console.log('🔧 Development mode initialized')
            console.log('📡 API Base URL:', apiBaseUrl.value)
            console.log('🔐 To test authentication, call: useAuthStore().authenticate()')
            console.log('⚙️  To change API URL, call: useAuthStore().setDevelopmentConfig({apiBaseUrl: "http://your-backend-url"})')
        }).catch(console.error)
    }

    return {
        // State
        isAuthenticated,
        isLoading,
        deviceInfo,
        kioskConfig,
        authToken,
        lastHeartbeat,
        isMaintenanceMode,
        isOffline,
        setupComplete,
        apiBaseUrl,

        // Computed
        isDeviceSetup,
        hasDeviceInfo,
        isOperational,

        // Actions
        loadDeviceInfo,
        saveApiConfig,
        completeSetup,
        authenticate,
        register,
        startHeartbeat,
        syncData,
        enterMaintenanceMode,
        exitMaintenanceMode,
        logout,
        reportError,
        updateNetworkStatus,

        // Development helpers
        setDevelopmentConfig
    }
})