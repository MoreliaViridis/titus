const fs = require("fs");
const g = fs.readFileSync("output/aurora-twenty-beauties.html", "utf8");
const imgs = g.split('src="../aurora/output/').length - 1;
const nums = [...g.matchAll(/<div class="n">(\d+)<\/div>/g)].map((m) => parseInt(m[1], 10));
const h1 = (g.match(/<h1>(.*?)<\/h1>/) || [])[1];
const title = (g.match(/<title>(.*?)<\/title>/) || [])[1];
console.log("gallery labels:", nums.join(","));
console.log("gallery count:", nums.length, "unique:", new Set(nums).size);
console.log("images:", imgs);
console.log("h1:", h1);
console.log("title:", title);

const h = fs.readFileSync("aurora/aurora-home.html", "utf8");
const homeItems = h.split('href="output/').length - 1;
console.log("home items:", homeItems);