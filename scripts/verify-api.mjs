/**
 * CI: verify the API app module loads (no DB/OpenAI required).
 */
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const appPath = pathToFileURL(join(__dirname, "../server/app.js")).href;
import(appPath)
  .then(() => console.log("API module OK"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
