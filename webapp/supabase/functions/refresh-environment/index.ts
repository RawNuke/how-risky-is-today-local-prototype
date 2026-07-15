import { serveRefreshJob } from "../_shared/http.ts";
import { refreshEnvironment } from "../_shared/refresh-environment.ts";

serveRefreshJob("refresh-environment", refreshEnvironment);
