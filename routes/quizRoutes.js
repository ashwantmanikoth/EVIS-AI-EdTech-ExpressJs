// quizRoutes.js

const express = require("express");

const { submitAnswer } = require("../utils/quizDB");

const router = express.Router();

router.post("/submitAnswer", async (req, res) => {
    console.log("submitAnswer: ", req)
    try {
      const submitResponse = await submitAnswer(req.body);
      console.log(submitResponse)
      if (submitResponse.isSuccess) {
        res.status(200).json({"message": "Submitted the quiz successfully"});
      } else {
        res.status(400).json({ message: submitResponse.errMsg});
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to submit answer." });
    }
  });

module.exports = router;