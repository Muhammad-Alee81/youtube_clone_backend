import fs from "node:fs";

export const deleteLocalTempFiles = (...filePath) => {
       filePath.forEach((path) => {
              if (fs.existsSync(path)) {
                     fs.unlinkSync(path);
              }
       });
};
