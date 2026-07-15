import { serveRefreshJob } from "../_shared/http.ts";
import { refreshRisk } from "../_shared/refresh-risk.ts";

serveRefreshJob("refresh-risk", refreshRisk);
