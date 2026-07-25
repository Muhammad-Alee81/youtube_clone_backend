class ApiError extends Error {
       constructor(
              statusCode,
              message = "something went very wrong",
              errors = [],
              stack = ""
       ) {
              super(message);
              this.statusCode = statusCode;
              this.message = message;
              this.errors = errors;
              this.success = false;
              isOperational = true;
              Error.captureStackTrace(this, this.constructor);
       }
}

export default ApiError;
