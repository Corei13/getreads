console.log("Good reads!!");

const rootUrl = "http://127.0.0.1:4017";

const getMeta = () => ({
  isbn: document
    .querySelector('meta[property="books:isbn"]')
    .getAttribute("content"),
  author: document
    .querySelector('meta[property="books:author"]')
    .getAttribute("content")
    .split("/")
    .pop()
    .split(".")
    .pop()
    .replace("_", " "),
  title: document
    .querySelector('meta[property="og:title"]')
    .getAttribute("content"),
  id: document
    .querySelector('meta[property="al:ios:url"]')
    .getAttribute("content")
    .split("/")
    .pop()
});

const search = ({ title, author }) =>
  fetch(`${rootUrl}/search?title=${title}&&author=${author}`)
    .then(async res => await res.json())
    .then(list => list.map(title => title.split("!Horla ")[1]));

const listElement = title => {
  const a = document.createElement("a");
  a.className = "actionLinkLite";
  a.target = "_blank";
  a.href = `${rootUrl}/download?path=${title}`;
  a.innerText = title;
  return a;
};

const makeList = list => {
  const div = document.createElement("div");
  div.className = "floatingBox buyBox";
  div.style = "display: none;";

  list.forEach(title => {
    div.appendChild(listElement(title));
    div.appendChild(document.createElement("br"));
  });
  return div;
};

const makeHoverElement = title => {
  const a = document.createElement("a");
  a.className = "buttonBar";
  a.innerText = "Download from GetReads ▾";
  return a;
};

const makeDownloadButton = list => {
  const div = document.createElement("div");
  div.className = " dropButton";
  div.onmouseover = mouseOver;
  div.onmouseout = mouseOut;

  function mouseOver() {
    const l = this.querySelector(".floatingBox");
    l.style = "";
  }
  function mouseOut() {
    const l = this.querySelector(".floatingBox");
    l.style = "display: none";
  }

  div.appendChild(makeHoverElement(list[0]));
  div.appendChild(makeList(list));
  return div;
};

(async () => {
  // stop if download exists
  // get Meta
  const { isbn, id, author, title } = getMeta();
  // fetch search list
  const list = await search({ title, author });
  // make button and list
  const button = makeDownloadButton(list);
  // append button
  let el = document.getElementsByClassName("buyButtonBar");
  let li = document.createElement("li");

  li.appendChild(button);
  el[0].appendChild(li);
})();
