import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Kiosk-optimized theme
const kioskTheme = {
    dark: false,
    colors: {
        // Primary brand colors
        primary: '#1976D2',
        'primary-darken-1': '#1565C0',
        secondary: '#424242',
        'secondary-darken-1': '#1B5E20',

        // Status colors
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',

        // Background colors
        background: '#FAFAFA',
        surface: '#FFFFFF',
        'surface-bright': '#FFFFFF',
        'surface-light': '#F5F5F5',
        'surface-variant': '#424242',
        'on-surface-variant': '#EEEEEE',

        // Text colors
        'on-primary': '#FFFFFF',
        'on-secondary': '#FFFFFF',
        'on-success': '#FFFFFF',
        'on-warning': '#000000',
        'on-error': '#FFFFFF',
        'on-info': '#FFFFFF',
        'on-background': '#1C1B1F',
        'on-surface': '#1C1B1F',

        // Custom kiosk colors
        'kiosk-accent': '#FFC107',
        'kiosk-accent-light': '#FFF3C4',
        'product-card': '#FFFFFF',
        'category-card': '#F8F9FA',
        'cart-total': '#E8F5E8',
        'payment-success': '#4CAF50',
        'payment-error': '#F44336',
        'maintenance': '#FF5722',
        'offline': '#9E9E9E'
    }
}

const lightTheme = {
    dark: false,
    colors: {
        ...kioskTheme.colors
    }
}

const darkTheme = {
    dark: true,
    colors: {
        primary: '#2196F3',
        'primary-darken-1': '#1976D2',
        secondary: '#424242',
        'secondary-darken-1': '#1B5E20',
        success: '#4CAF50',
        warning: '#FB8C00',
        error: '#FF5252',
        info: '#2196F3',
        background: '#121212',
        surface: '#212121',
        'surface-bright': '#424242',
        'surface-light': '#1E1E1E',
        'surface-variant': '#424242',
        'on-surface-variant': '#EEEEEE',
        'on-primary': '#FFFFFF',
        'on-secondary': '#FFFFFF',
        'on-success': '#FFFFFF',
        'on-warning': '#000000',
        'on-error': '#FFFFFF',
        'on-info': '#FFFFFF',
        'on-background': '#FFFFFF',
        'on-surface': '#FFFFFF',
        'kiosk-accent': '#FFC107',
        'kiosk-accent-light': '#333333',
        'product-card': '#2C2C2C',
        'category-card': '#1E1E1E',
        'cart-total': '#2E2E2E',
        'payment-success': '#4CAF50',
        'payment-error': '#F44336',
        'maintenance': '#FF5722',
        'offline': '#9E9E9E'
    }
}

export default createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: lightTheme,
            dark: darkTheme,
            kiosk: kioskTheme
        }
    },

    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi }
    },

    display: {
        mobileBreakpoint: 'sm',
        thresholds: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
            xxl: 2560
        }
    },

    defaults: {
        global: {
            ripple: true
        },

        // Button defaults for touch optimization
        VBtn: {
            color: 'primary',
            size: 'large',
            variant: 'elevated',
            style: 'min-height: 60px; font-size: 18px;'
        },

        // Card defaults
        VCard: {
            elevation: 2,
            rounded: 'lg'
        },

        // Input defaults for touch
        VTextField: {
            variant: 'outlined',
            density: 'comfortable',
            style: 'font-size: 18px;'
        },

        VSelect: {
            variant: 'outlined',
            density: 'comfortable',
            style: 'font-size: 18px;'
        },

        // Dialog defaults
        VDialog: {
            width: '90%',
            maxWidth: '600px'
        },

        // Chip defaults
        VChip: {
            size: 'large',
            style: 'font-size: 16px;'
        },

        // List item defaults
        VListItem: {
            style: 'min-height: 60px; font-size: 16px;'
        },

        // Navigation defaults
        VNavigationDrawer: {
            elevation: 4
        },

        // App bar defaults
        VAppBar: {
            elevation: 2,
            density: 'comfortable'
        }
    }
})