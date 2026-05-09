/**
 * Unified Error Parsing Utility
 * Decodes complex backend error structures into human-readable strings.
 */
export const parseError = (error: any): string => {
  if (!error) return 'An unknown protocol error occurred.';

  // 1. Handle Axios Response Errors
  if (error.response) {
    const data = error.response.data;
    
    // Check for FastAPI detail structure
    if (data && data.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ');
      }
      return data.detail;
    }
    
    // Check for standard error message
    if (data && data.message) return data.message;
    
    // Status code fallback
    switch (error.response.status) {
      case 401: return 'Authentication failed. Please verify your credentials.';
      case 403: return 'Access denied. You do not have permission for this operation.';
      case 404: return 'Resource not found in the surveillance network.';
      case 422: return 'Data validation failed. Please check your inputs.';
      case 500: return 'Internal Nexus failure. Protocol execution aborted.';
      default: return `Operational Error: ${error.response.statusText || 'Unknown Status'}`;
    }
  }

  // 2. Handle Network Errors
  if (error.request) {
    return 'Connection to Nexus lost. Please check your network protocol.';
  }

  // 3. String fallback
  if (typeof error === 'string') return error;
  
  return error.message || 'A critical execution error occurred.';
};
