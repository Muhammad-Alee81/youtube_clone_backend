class ApiError extends Error {
       constructor(
              message = "something went very wrong",
              statusCode,
              errors = [],
              stack = ""
       ) {
              super(message);
              this.statusCode = statusCode;
              this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
              this.message = message;
              this.isOperational = true;
              this.success = false;
              this.errors = errors;
              Error.captureStackTrace(this, this.constructor);
       }
}

export default ApiError;
