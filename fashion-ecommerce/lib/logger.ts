/**
 * Logger utility for development and production
 * In production, only errors are logged
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors with better formatting
    // NEVER throw exceptions - logger must be crash-proof
    if (args.length === 0) {
      return
    }
    
    // Enhanced error logging - always show full error details
    const logErrorDetails = (error: any, context?: string) => {
      try {
        const errorInfo: any = {
          message: error?.message || String(error),
          name: error?.name || 'Error',
        };
        
        // Add stack trace if available
        if (error?.stack) {
          errorInfo.stack = error.stack;
        }
        
        // Add status code if it's an API error
        if (error?.status !== undefined) {
          errorInfo.status = error.status;
        }
        
        // Add status text if available
        if (error?.statusText) {
          errorInfo.statusText = error.statusText;
        }
        
        // Add URL if available
        if (error?.url) {
          errorInfo.url = error.url;
        }
        
        // Add method if available
        if (error?.method) {
          errorInfo.method = error.method;
        }
        
        // Add response body if available
        if (error?.responseBody) {
          errorInfo.responseBody = error.responseBody;
        }
        
        // Add response headers if available
        if (error?.responseHeaders) {
          errorInfo.responseHeaders = error.responseHeaders;
        }
        
        // Add original error if wrapped
        if (error?.originalError) {
          errorInfo.originalError = error.originalError;
        }
        
        // Add all other properties
        if (error && typeof error === 'object') {
          Object.keys(error).forEach(key => {
            if (!['message', 'name', 'stack', 'status', 'statusText', 'url', 'method', 'responseBody', 'responseHeaders', 'originalError'].includes(key)) {
              try {
                const value = error[key];
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
                  errorInfo[key] = value;
                }
              } catch {
                // Skip properties that can't be accessed
              }
            }
          });
        }
        
        const prefix = context ? `[ERROR] ${context}:` : '[ERROR]';
        console.error(prefix, JSON.stringify(errorInfo, null, 2));
      } catch {
        // Fallback to basic logging
        try {
          console.error('[ERROR]', error?.message || String(error));
        } catch {
          // Silent fail
        }
      }
    };
    
    // Safe serializer for Error objects - NEVER throws
    const safeSerializeError = (error: Error): string => {
      try {
        // Basic error properties
        const errorObj: any = {
          message: error.message || 'Unknown error',
          name: error.name || 'Error',
        }
        
        // Safely add stack if available
        try {
          if (error.stack) {
            errorObj.stack = error.stack
          }
        } catch {
          // Skip stack if it fails
        }
        
        // Safely extract additional properties
        try {
          const props = Object.getOwnPropertyNames(error)
          props.forEach(prop => {
            if (!['message', 'name', 'stack'].includes(prop)) {
              try {
                const value = (error as any)[prop]
                // Only add serializable values
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                  errorObj[prop] = value
                }
              } catch {
                // Skip properties that can't be accessed
              }
            }
          })
        } catch {
          // If property extraction fails, use basic properties only
        }
        
        // Try to stringify with circular reference handling
        try {
          const seen = new WeakSet()
          return JSON.stringify(errorObj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular]'
              }
              seen.add(value)
            }
            return value
          }, 2)
        } catch {
          // Fallback to simple string
          return `Error: ${error.message || 'Unknown error'}`
        }
      } catch {
        // Ultimate fallback - NEVER throw
        return `Error: ${error.message || 'Unknown error'}`
      }
    }
    
    try {
      // If first arg is a string and second is an object, format nicely
      if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'object' && args[1] !== null) {
        logErrorDetails(args[1], args[0]);
      } else if (args.length === 1) {
        // Single argument
        const arg = args[0]
        
        if (arg instanceof Error || (typeof arg === 'object' && arg !== null)) {
          logErrorDetails(arg);
        } else if (typeof arg === 'string') {
          // String argument - safe logging
          try {
            console.error('[ERROR]', arg)
          } catch {
            try {
              console.log('[ERROR fallback]', String(arg))
            } catch {
              // Silent fail
            }
          }
        } else {
          // Primitive value - safe logging
          try {
            console.error('[ERROR]', arg)
          } catch {
            try {
              console.log('[ERROR fallback]', String(arg))
            } catch {
              // Silent fail
            }
          }
        }
      } else {
        // Multiple arguments - log first as context, rest as details
        const context = args[0];
        const details = args.slice(1);
        
        if (typeof context === 'string') {
          // First arg is context string
          if (details.length === 1 && (details[0] instanceof Error || (typeof details[0] === 'object' && details[0] !== null))) {
            logErrorDetails(details[0], context);
          } else {
            try {
              console.error(`[ERROR] ${context}`, ...details);
            } catch {
              try {
                console.log(`[ERROR] ${context}`, ...details.map(String));
              } catch {
                // Silent fail
              }
            }
          }
        } else {
          // All args are data - log first as main error
          if (context instanceof Error || (typeof context === 'object' && context !== null)) {
            logErrorDetails(context);
            if (details.length > 0) {
              try {
                console.error('Additional details:', ...details);
              } catch {
                // Silent fail
              }
            }
          } else {
            try {
              console.error('[ERROR]', ...args);
            } catch {
              try {
                console.log('[ERROR]', ...args.map(String));
              } catch {
                // Silent fail
              }
            }
          }
        }
      }
    } catch (logError) {
      // Ultimate fallback - logger must NEVER throw
      try {
        console.log('[ERROR] Logger encountered an error while logging')
      } catch {
        // Absolute last resort - do nothing
      }
    }
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args)
    }
  },
}

export default logger

