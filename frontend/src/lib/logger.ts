/**
 * Market Scout - Production Observability Suite
 * Centralized logging and telemetry service.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'PERFORMANCE';

interface LogOptions {
    component?: string;
    event?: string;
    route?: string;
    duration?: number;
    metadata?: any;
}

class FrontendLogger {
    private isDebug: boolean = import.meta.env.VITE_DEBUG_MODE === 'true';

    private maskSensitive(data: any): any {
        if (!data) return data;
        const masked = JSON.parse(JSON.stringify(data));
        const sensitiveKeys = ['password', 'token', 'access_token', 'api_key', 'secret', 'authorization'];
        
        const maskRecursive = (obj: any) => {
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    maskRecursive(obj[key]);
                } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                    obj[key] = '********';
                }
            }
        };
        
        if (typeof masked === 'object') maskRecursive(masked);
        return masked;
    }

    private formatMessage(level: LogLevel, message: string, options?: LogOptions) {
        const timestamp = new Date().toISOString().split('T')[1].split('Z')[0];
        const { component, event, route, duration, metadata } = options || {};
        
        const style = {
            INFO: 'color: #0071E3; font-weight: bold;',
            WARN: 'color: #FF9F0A; font-weight: bold;',
            ERROR: 'color: #FF453A; font-weight: bold;',
            DEBUG: 'color: #8E8E93; font-weight: bold;',
            PERFORMANCE: 'color: #34C759; font-weight: bold;'
        }[level];

        const routeStr = route || window.location.pathname;
        const compStr = component ? `[${component}]` : '';
        const eventStr = event ? `| ${event.toUpperCase()}` : '';
        const durationStr = duration ? `| ${duration.toFixed(2)}ms` : '';

        console.log(
            `%c${timestamp} | ${level.padEnd(7)} | ${routeStr.padEnd(15)} ${compStr.padEnd(20)} ${eventStr.padEnd(20)} ${durationStr}`,
            style,
            message,
            metadata ? this.maskSensitive(metadata) : ''
        );
    }

    info(message: string, options?: LogOptions) {
        this.formatMessage('INFO', message, options);
    }

    warn(message: string, options?: LogOptions) {
        this.formatMessage('WARN', message, options);
    }

    error(message: string, error?: any, options?: LogOptions) {
        this.formatMessage('ERROR', message, {
            ...options,
            metadata: {
                error: error?.message || error,
                stack: error?.stack,
                ...options?.metadata
            }
        });
    }

    debug(message: string, options?: LogOptions) {
        if (this.isDebug) {
            this.formatMessage('DEBUG', message, options);
        }
    }

    perf(message: string, duration: number, options?: LogOptions) {
        this.formatMessage('PERFORMANCE', message, { ...options, duration });
        if (duration > 1000) {
            this.warn(`SLOW_EVENT: ${message}`, { ...options, duration });
        }
    }
}

export const logger = new FrontendLogger();
