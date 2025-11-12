import fs from 'fs';
import path from 'path';

class ErrorLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(error, req = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      request: req ? {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
      } : null
    };

    // Console log
    console.error(`❌ [${timestamp}] Error:`, error.message);

    // File log
    const logFile = path.join(
      this.logDir, 
      `error-${new Date().toISOString().split('T')[0]}.log`
    );

    fs.appendFileSync(
      logFile,
      JSON.stringify(logEntry, null, 2) + '\n',
      'utf8'
    );

    // In production, send to external service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
    }
  }
}

const logger = new ErrorLogger();

export const errorLogger = (err, req, res, next) => {
  logger.log(err, req);
  next(err);
};

export default logger;