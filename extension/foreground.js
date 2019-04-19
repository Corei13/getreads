console.log("Good reads!!");

const isbn = document
  .querySelector('meta[property="books:isbn"]')
  .getAttribute("content");
const author = document
  .querySelector('meta[property="books:author"]')
  .getAttribute("content")
  .split("/")
  .pop()
  .split(".")
  .pop()
  .replace("_", " ");
const title = document
  .querySelector('meta[property="og:title"]')
  .getAttribute("content");
const id = document
  .querySelector('meta[property="al:ios:url"]')
  .getAttribute("content")
  .split("/")
  .pop();

console.log({ isbn, id, author, title });

(async () => {
  const search = await fetch(
    `https://rare-kangaroo-30.localtunnel.me/search?title=${title}&&author=${author}`
  ).then(async res => await res.json());
  console.log(search);
})();

let el = document.getElementsByClassName("buyButtonBar");
let li = document.createElement("li");
let btn = document.createElement("button");
btn.innerText = "Download From GetReads";
btn.className = "buttonBar";

btn.addEventListener("click", function() {
  this.disabled = true;
  this.innerText = "Downloading your book ...";
  setTimeout(() => {
    btn.innerText = "Download From GetReads";
    this.disabled = false;
  }, 3000);
});

li.appendChild(btn);
el[0].appendChild(li);

// TODO: add buttons in search page

// document.querySelector('meta[property="books:isbn"]').getAttribute('content')
// books:author
// og:title
// al:ios:url
// books:isbn
