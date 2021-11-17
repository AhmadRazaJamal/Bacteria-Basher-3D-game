const express = require("express");

const app = express();

app.use(express.static("public"));  //run the public folder

app.listen(4000);