import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import worker from "./dist/server/index.js";

const port = Number(process.env.PORT || 3000);
const clientRoot = join(import.meta.dirname, "dist", "client");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function assetPath(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = join(clientRoot, clean);
  return candidate.startsWith(clientRoot) ? candidate : null;
}

function assetResponse(request) {
  const pathname = new URL(request.url).pathname;
  const path = assetPath(pathname);
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    return new Response("Not found", { status: 404 });
  }
  const body = createReadStream(path);
  return new Response(Readable.toWeb(body), {
    headers: {
      "content-type": mimeTypes[extname(path).toLowerCase()] || "application/octet-stream",
      "cache-control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    },
  });
}

const env = {
  ASSETS: { fetch: assetResponse },
  IMAGES: {
    input() {
      throw new Error("Image transformation is unavailable in the local Docker runtime.");
    },
  },
};

createServer(async (request, response) => {
  try {
    const origin = `http://${request.headers.host || `localhost:${port}`}`;
    const method = request.method || "GET";
    const body = method === "GET" || method === "HEAD" ? undefined : Readable.toWeb(request);
    const webRequest = new Request(new URL(request.url || "/", origin), {
      method,
      headers: request.headers,
      body,
      duplex: body ? "half" : undefined,
    });

    let result;
    const directAsset = assetResponse(webRequest);
    if (directAsset.status !== 404) result = directAsset;
    else {
      result = await worker.fetch(webRequest, env, {
        waitUntil(promise) {
          Promise.resolve(promise).catch(console.error);
        },
        passThroughOnException() {},
      });
    }

    response.statusCode = result.status;
    for (const [name, value] of result.headers) response.setHeader(name, value);
    if (!result.body || method === "HEAD") response.end();
    else Readable.fromWeb(result.body).pipe(response);
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.setHeader("content-type", "text/plain; charset=utf-8");
    response.end("Erro interno do frontend");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Frontend disponível na porta ${port}`);
});
