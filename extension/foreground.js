console.log("Good reads!!");

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