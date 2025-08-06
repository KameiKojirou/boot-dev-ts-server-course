// src/index.ts
import express from "express";
import { config } from "./config.js"; // Ensure .js extension for Node ESM compatibility
class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = "BadRequestError";
    }
}
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = "UnauthorizedError";
    }
}
class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = "ForbiddenError";
    }
}
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
    }
}
const app = express();
const PORT = 8080;
app.get("/api/healthz", handlerReadiness);
function handlerReadiness(req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send("OK");
}
app.get("/admin/metrics", handlerMetrics);
function handlerMetrics(req, res) {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>
  `);
}
app.post("/admin/reset", handlerReset);
function handlerReset(req, res) {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send("OK");
}
app.post("/api/validate_chirp", handlerValidateChirp);
async function handlerValidateChirp(req, res, next) {
    try {
        const body = await new Promise((resolve, reject) => {
            let data = "";
            req.on("data", (chunk) => {
                data += chunk;
            });
            req.on("end", () => resolve(data));
            req.on("error", reject);
        });
        let parsedBody;
        try {
            parsedBody = JSON.parse(body);
        }
        catch (error) {
            throw new BadRequestError("Invalid JSON in request body");
        }
        if (!parsedBody.body || typeof parsedBody.body !== "string") {
            throw new BadRequestError("Invalid chirp: body must be a string");
        }
        if (parsedBody.body.length > 140) {
            throw new BadRequestError("Chirp is too long. Max length is 140");
        }
        const profaneWords = ["kerfuffle", "sharbert", "fornax"];
        let cleanedBody = parsedBody.body;
        profaneWords.forEach((word) => {
            // Create a regular expression to match the whole word case-insensitively
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            cleanedBody = cleanedBody.replace(regex, "****");
        });
        res
            .status(200)
            .set("Content-Type", "application/json")
            .send(JSON.stringify({ cleanedBody: cleanedBody }));
    }
    catch (error) {
        next(error);
    }
}
// middleware logging
function MiddlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        const status = res.statusCode;
        if (status !== 200) {
            // log [NON-OK] <http_method> <url> - Status: <status_code>
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${status}`);
        }
    });
    next();
}
app.use(MiddlewareLogResponses);
// middleware metrics increment
function middlewareMetricsInc(req, res, next) {
    config.fileserverHits++;
    next();
}
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
// Error-handling middleware
function errorHandler(err, req, res, next) {
    console.log(err);
    let status = 500;
    let message = "Something went wrong on our end";
    if (err instanceof BadRequestError) {
        status = 400;
        message = err.message;
    }
    else if (err instanceof UnauthorizedError) {
        status = 401;
        message = err.message;
    }
    else if (err instanceof ForbiddenError) {
        status = 403;
        message = err.message;
    }
    else if (err instanceof NotFoundError) {
        status = 404;
        message = err.message;
    }
    res.status(status).json({
        error: message,
    });
}
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
