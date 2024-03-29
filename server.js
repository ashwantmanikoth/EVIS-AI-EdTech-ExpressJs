const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.send("Hello from Express.js backend!");
});

app.get("/about", (req, res) => {
  console.log("lol");
  res.status(200).json({ message: "About route hit" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


