require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 3000;
app.use(cors());
console.log(cors());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.listen(PORT, () => {
  console.log(`you'r listening to port ${PORT}`);
});
