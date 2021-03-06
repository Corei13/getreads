const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const IRC = require("./irc");

const app = express();
app.use(bodyParser.json({ limit: "200mb" }));
app.use(cors());

app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

app.get("/search", async (req, res, next) => {
  // TODO: get isbn and other metadata and story
  const {
    query: { title, author }
  } = req;
  try {
    const result = await search(title, author);
    res.status(200).send(result);
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/download", async (req, res, next) => {
  // TODO: get isbn and other metadata and story
  const {
    query: { path }
  } = req;
  try {
    const { stream, size, filename, mime } = await IRC.download(path);

    res.set("Content-disposition", "attachment; filename=" + filename);
    res.set("Content-Type", mime || "application/octet-stream");
    res.set("Content-Length", size);
    stream.pipe(res);
    next();
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  res.status(500).send({ error: err.message });
  console.error(req.originalUrl, err.stack);
  next();
});

app.use(({ requestTime, method, originalUrl }) => {
  const elapsed = (Date.now() - requestTime) / 1000;
  console.log(method, originalUrl, elapsed.toFixed(2));
});

const data = fs
  .readFileSync(path.resolve(__dirname, "./data/Horla.list"))
  .toString()
  .split(/\r?\n/)
  .filter(
    l =>
      l.startsWith("!Horla") &&
      ["epub", "mobi", "pdf", "awz3"].find(e => l.endsWith(e))
  );
const score = (l = "", t = "", a = "") =>
  2 *
    Number(
      l
        .trim()
        .toLowerCase()
        .includes(t.trim().toLowerCase())
    ) +
  Number(
    l
      .trim()
      .toLowerCase()
      .includes(a.trim().toLowerCase())
  );
const search = (title, author) =>
  data
    .filter(l => l.includes(title))
    .sort((a, b) => score(b, title, author) - score(a, title, author));

(async () => {
  await IRC.initialize();
  app.listen(4017, () => {
    console.log("controller listening on port 4017!");
  });
})().then(console.log, console.error);
