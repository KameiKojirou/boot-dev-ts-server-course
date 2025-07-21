import express from "express";
import path from "path";

const app = express();
const PORT = 8080;

app.use("/app", express.static("./src/app"));

app.get("/healthz", handlerReadiness);

function handlerReadiness(req: any, res: any) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.sendStatus(200).send("OK");
}

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
