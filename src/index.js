import { app } from "../app.js";
import "dotenv/config";
import { dataBaseConnection } from "./db/index.js";

const port = process.env.PORT || 8000;

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
