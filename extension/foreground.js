console.log("Good reads!!");

let el = document.getElementsByClassName("buyButtonBar");
let li = document.createElement("li");
let btn = document.createElement("button");
btn.innerText = "Download From GetReads";
btn.className = "buttonBar";

li.appendChild(btn);
el[0].appendChild(li);
