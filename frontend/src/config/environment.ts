// Environment Configuration
// This file provides centralized access to environment variables and development settings

export interface EnvironmentConfig {
    apiBaseUrl: string;
    appName: string;
    appVersion: string;
    useMocks: boolean;
    isDevelopment: boolean;
    isProduction: boolean;
}

// Get environment variable with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
    return import.meta.env[key] ?? fallback;
};

// Get boolean environment variable
const getBooleanEnvVar = (key: string, fallback: boolean = false): boolean => {
    const value = getEnvVar(key);
    if (!value) return fallback;
    const lowerValue = value.toLowerCase();
    return lowerValue === 'true' || lowerValue === '1';
};

// Environment configuration object
export const ENV_CONFIG: EnvironmentConfig = {
    // API Configuration
    apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8008'),

    // App Information
    appName: getEnvVar('VITE_APP_NAME', 'DataBrain'),
    appVersion: getEnvVar('VITE_APP_VERSION', '0.0.1-dev'),

    // Development/Mocking Configuration
    useMocks: getBooleanEnvVar('VITE_USE_MOCKS', true),

    // Environment flags
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
};

// Export individual values for convenience
export const {
    apiBaseUrl,
    appName,
    appVersion,
    useMocks,
    isDevelopment,
    isProduction,
} = ENV_CONFIG;

// Development helpers
export const enableMocks = () => {
    console.log('🎭 Mock mode enabled - Using mock endpoints');
};

export const disableMocks = () => {
    console.log('🔌 Mock mode disabled - Using real API at', apiBaseUrl);
};

// Log current configuration in development
if (isDevelopment) {
    console.log('🔧 Environment Configuration:', {
        apiBaseUrl,
        appName,
        appVersion,
        useMocks,
        isDevelopment,
        isProduction,
    });

    if (useMocks) {
        enableMocks();
    } else {
        disableMocks();
    }
}
