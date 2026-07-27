import { app } from "./app.js";
import "dotenv/config";
import { dataBaseConnection } from "./db/index.js";
import { globalErrorHandler } from "./middlewares/global.err.handler.js";
import ApiError from "./utils/api_error.js";

const port = process.env.PORT || 8000;

app.use((req, res, next) => {
       return next(
              new ApiError(`Cannot find ${req.originalUrl} on this server`, 404)
       );
});

app.use(globalErrorHandler);

const startServer = async () => {
       try {
              await dataBaseConnection();
              app.listen(port, () => {
                     console.log("Server is running on port " + port);
              });
       } catch (err) {
              console.log("FAILED TO START SERVER", err);
              process.exit(1);
       }
};

startServer();



