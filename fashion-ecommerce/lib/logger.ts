




const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    
    
    if (args.length === 0) {
      return
    }
    
    
    const logErrorDetails = (error: any, context?: string) => {
      try {
        const errorInfo: any = {
          message: error?.message || String(error),
          name: error?.name || 'Error',
        };
        
        
        if (error?.stack) {
          errorInfo.stack = error.stack;
        }
        
        
        if (error?.status !== undefined) {
          errorInfo.status = error.status;
        }
        
        
        if (error?.statusText) {
          errorInfo.statusText = error.statusText;
        }
        
        
        if (error?.url) {
          errorInfo.url = error.url;
        }
        
        
        if (error?.method) {
          errorInfo.method = error.method;
        }
        
        
        if (error?.responseBody) {
          errorInfo.responseBody = error.responseBody;
        }
        
        
        if (error?.responseHeaders) {
          errorInfo.responseHeaders = error.responseHeaders;
        }
        
        
        if (error?.originalError) {
          errorInfo.originalError = error.originalError;
        }
        
        
        if (error && typeof error === 'object') {
          Object.keys(error).forEach(key => {
            if (!['message', 'name', 'stack', 'status', 'statusText', 'url', 'method', 'responseBody', 'responseHeaders', 'originalError'].includes(key)) {
              try {
                const value = error[key];
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
                  errorInfo[key] = value;
                }
              } catch {
                
              }
            }
          });
        }
        
        const prefix = context ? `[ERROR] ${context}:` : '[ERROR]';
        console.error(prefix, JSON.stringify(errorInfo, null, 2));
      } catch {
        
        try {
          console.error('[ERROR]', error?.message || String(error));
        } catch {
          
        }
      }
    };
    
    
    const safeSerializeError = (error: Error): string => {
      try {
        
        const errorObj: any = {
          message: error.message || 'Unknown error',
          name: error.name || 'Error',
        }
        
        
        try {
          if (error.stack) {
            errorObj.stack = error.stack
          }
        } catch {
          
        }
        
        
        try {
          const props = Object.getOwnPropertyNames(error)
          props.forEach(prop => {
            if (!['message', 'name', 'stack'].includes(prop)) {
              try {
                const value = (error as any)[prop]
                
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                  errorObj[prop] = value
                }
              } catch {
                
              }
            }
          })
        } catch {
          
        }
        
        
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
          
          return `Error: ${error.message || 'Unknown error'}`
        }
      } catch {
        
        return `Error: ${error.message || 'Unknown error'}`
      }
    }
    
    try {
      
      if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'object' && args[1] !== null) {
        logErrorDetails(args[1], args[0]);
      } else if (args.length === 1) {
        
        const arg = args[0]
        
        if (arg instanceof Error || (typeof arg === 'object' && arg !== null)) {
          logErrorDetails(arg);
        } else if (typeof arg === 'string') {
          
          try {
            console.error('[ERROR]', arg)
          } catch {
            try {
              console.log('[ERROR fallback]', String(arg))
            } catch {
              
            }
          }
        } else {
          
          try {
            console.error('[ERROR]', arg)
          } catch {
            try {
              console.log('[ERROR fallback]', String(arg))
            } catch {
              
            }
          }
        }
      } else {
        
        const context = args[0];
        const details = args.slice(1);
        
        if (typeof context === 'string') {
          
          if (details.length === 1 && (details[0] instanceof Error || (typeof details[0] === 'object' && details[0] !== null))) {
            logErrorDetails(details[0], context);
          } else {
            try {
              console.error(`[ERROR] ${context}`, ...details);
            } catch {
              try {
                console.log(`[ERROR] ${context}`, ...details.map(String));
              } catch {
                
              }
            }
          }
        } else {
          
          if (context instanceof Error || (typeof context === 'object' && context !== null)) {
            logErrorDetails(context);
            if (details.length > 0) {
              try {
                console.error('Additional details:', ...details);
              } catch {
                
              }
            }
          } else {
            try {
              console.error('[ERROR]', ...args);
            } catch {
              try {
                console.log('[ERROR]', ...args.map(String));
              } catch {
                
              }
            }
          }
        }
      }
    } catch (logError) {
      
      try {
        console.log('[ERROR] Logger encountered an error while logging')
      } catch {
        
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

