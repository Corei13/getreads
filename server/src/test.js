const fs = require("fs");
const path = require("path");

const keyword = "Harry Potter and the Deathly Hallows (Harry Potter, #7) pdf";

const books = fs
  .readFileSync(path.resolve(__dirname, "./data/Horla.list"))
  .toString()
  .split(/\r?\n/)
  .filter(
    l =>
      l.startsWith("!Horla") &&
      ["epub", "mobi", "pdf", "awz3"].find(e => l.endsWith(e))
  );

const rank = (str, pattern) => {
  const segments = pattern.split(' ').join('|');
  const reg = new RegExp(segments, "gi");
  return (str.match(reg) || []).length;
};

const score = (l, t, a) => 2 * rank(l, t) + rank(l, a); 

const search = (title, author) => {
  const au = author.replace(/[^a-zA-Z0-9\s!?]+/g, ' ');
  const ti = title.replace(/[^a-zA-Z0-9\s!?]+/g, ' ');
  const reg = [au, ti].join('|');

  return books
    .filter(l => l.match(reg, 'gi'))
    .sort((a, b) => score(b, ti, au) - score(a, ti, au))
    .slice(0, 5);
};

console.log(search(keyword, "J K_Rowling"));