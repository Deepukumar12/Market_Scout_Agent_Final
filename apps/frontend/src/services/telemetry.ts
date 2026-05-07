import api from './api';

export type EventType = 
  | 'PAGE_VIEW' 
  | 'ROUTE_CHANGE' 
  | 'CLICK' 
  | 'FORM_SUBMIT' 
  | 'SEARCH' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'ERROR' 
  | 'API_CALL'
  | 'FILTER_CHANGE';

export interface TelemetryEvent {
  event: EventType;
  module: string;
  message: string;
  metadata?: Record<string, any>;
}

class TelemetryService {
  private static instance: TelemetryService;
  private currentRoute: string = window.location.pathname;

  private constructor() {
    this.setupInterceptors();
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  private setupInterceptors() {
    // Listen for route changes if using a framework that supports it, 
    // but for now we'll call it manually or via a hook.
  }

  public async log(payload: TelemetryEvent) {
    try {
      // Add common metadata
      const enhancedPayload = {
        ...payload,
        metadata: {
          ...payload.metadata,
          route: this.currentRoute,
          timestamp: new Date().toISOString(),
          screen: `${window.innerWidth}x${window.innerHeight}`,
        }
      };

      // Fire and forget (don't block UI)
      api.post('/telemetry/log', enhancedPayload).catch(() => {
        // Silently fail if telemetry endpoint is down to not interrupt user
      });
    } catch (e) {
      // Ignore
    }
  }

  public setRoute(route: string) {
    this.currentRoute = route;
    this.log({
      event: 'ROUTE_CHANGE',
      module: 'navigation',
      message: `Navigated to ${route}`,
    });
  }

  public trackClick(elementId: string, label: string) {
    this.log({
      event: 'CLICK',
      module: 'ui',
      message: `Clicked ${label} (#${elementId})`,
    });
  }

  public trackError(error: Error | string, componentStack?: string) {
    this.log({
      event: 'ERROR',
      module: 'frontend_runtime',
      message: typeof error === 'string' ? error : error.message,
      metadata: { stack: componentStack }
    });
  }
}

export const telemetry = TelemetryService.getInstance();
