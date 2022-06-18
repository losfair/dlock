// Worker

const MIN_TTL = 10;
const MAX_TTL = 3600;

function hardDeadline(): Date {
  return new Date(Date.now() + 1000 * 86400 * 7);
}

interface AcquireResult {
  lease: number;
  deadline: number;
}

interface AppEnv {
  LEASE: DurableObjectNamespace,
}

const pathRegex = /^\/([0-9a-zA-Z_-]{1,128})\/((acquire)|(release)|(status))$/

export default {
  async fetch(request: Request, env: AppEnv): Promise<Response> {
    const url = new URL(request.url);
    const match = pathRegex.exec(url.pathname);
    if (!match) return mkJsonResponse({ error: "invalid path" }, 400);
    const lockId = match[1];
    const action = match[2];
    const id = env.LEASE.idFromName(lockId);
    const obj = env.LEASE.get(id);
    return await obj.fetch(`https://[100::]/${action}${url.search}`);
  }
}

export class Lease {
  constructor(public state: DurableObjectState, private env: AppEnv) {
  }

  async alarm() {
    await this.state.storage.deleteAll();
  }

  // Handle HTTP requests from clients.
  async fetch(request: Request) {
    const url = new URL(request.url);
    const providedLease = parseInt(url.searchParams.get("lease") || "");
    const lease = await this.state.storage.get<number>("lease") || 0;
    const deadline = await this.state.storage.get<number>("deadline") || 0;
    const expired = deadline < (Date.now() / 1000);
    let ttl = parseInt(url.searchParams.get("ttl") || "");

    switch (url.pathname) {
      case "/acquire": {
        if (!Number.isSafeInteger(ttl) || ttl < 0) return mkJsonResponse({ error: "invalid ttl" }, 400);
        ttl = Math.min(MAX_TTL, Math.max(MIN_TTL, ttl))
        const newDeadline = Math.floor((Date.now() + ttl * 1000) / 1000);
        const rsp: AcquireResult = { lease, deadline: newDeadline };
        if (!Number.isNaN(providedLease)) {
          // Requested renew
          if (!lease || providedLease !== lease) return mkJsonResponse({ error: "the provided lease is no longer valid" }, 409);
        } else {
          // Takeover
          if (lease && !expired) return mkJsonResponse({ error: "lock is acquired by another client", deadline }, 409);
          const newLease = lease + 1;
          this.state.storage.put("lease", newLease);
          rsp.lease = newLease;
        }
        this.state.storage.put("deadline", newDeadline);
        await this.state.storage.setAlarm(hardDeadline());
        return mkJsonResponse(rsp);
      }
      case "/release": {
        if (!lease || providedLease !== lease) return mkJsonResponse({ error: "the provided lease is no longer valid" }, 409);
        await this.state.storage.delete("deadline");
        return mkJsonResponse({});
      }
      case "/status": {
        return mkJsonResponse({ lease, deadline });
      }
      default:
        throw new Error("invalid pathname");
    }
  }
}

function mkJsonResponse(x: unknown, status: number = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(x), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    }
  });
}
