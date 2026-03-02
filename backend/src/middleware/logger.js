/**
 * Request logging middleware for better debugging and monitoring
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV !== 'production';

  // Capture original send function
  const originalSend = res.send;

  // Override send to log response
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;
    const logLevel = isError ? '[ERROR]' : '[INFO]';

    // Log with sensitive data redaction in production
    if (isDev) {
      console.log(
        `${logLevel} ${req.method} ${req.path} - ${statusCode} - ${duration}ms`
      );
    } else {
      // Redact sensitive info in production logs
      const sanitizedPath = req.path.replace(/\/[a-z0-9\-]+/gi, '/[ID]');
      console.log(
        `${logLevel} ${req.method} ${sanitizedPath} - ${statusCode} - ${duration}ms`
      );
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

module.exports = { requestLogger };
