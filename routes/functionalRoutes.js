const express = require("express");
const { getKeyPhrase } = require("./AWSfunctions");
const router = express.Router();

router.post("/keyphrase", async (req, res) => {
  console.log(req);
  const text = req.body.text; 
  const responseString =await getKeyPhrase(text);
  console.log(responseString.filter((item) => item.Score > 0.9));


});

module.exports = router;
