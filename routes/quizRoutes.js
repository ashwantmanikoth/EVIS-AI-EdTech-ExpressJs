// quizRoutes.js

const express = require("express");

const { submitAnswer, savePerformanceInsights } = require("../utils/quizDB");
const { invokeLambda } = require("../utils/lambdaService");

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

  router.post("/endQuiz", async (req, res) => {
      console.log("endQuiz route: ", req)
      try {
        const endQuizResponse = await invokeLambda("endQuiz", req.body);
        console.log("endQuizResponse", endQuizResponse);

        const performanceInsightsResponse = await savePerformanceInsights(req.body);
        console.log("performanceInsightsResponse", performanceInsightsResponse);

        if (endQuizResponse.isSuccess) {
          res.status(200).json({"message": "Quiz ended successfully"});
        } else {
          res.status(400).json({ message: endQuizResponse.errMsg});
        }

      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to End Quiz." });
      }
    });

    router.post("/startQuiz", async (req, res) => {
        console.log("startQuiz route: ", req)
        try {
          const startQuizResponse = await invokeLambda("save_quiz_questions", req.body);
          console.log("startQuizResponse", startQuizResponse);
  
          if (startQuizResponse.isSuccess) {
            res.status(200).json({"message": "Quiz started successfully"});
          } else {
            res.status(400).json({ message: startQuizResponse.errMsg});
          }
  
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: "Failed to End Quiz." });
        }
      });

  router.post("/savePerformanceInsights", async (req, res) => {
      console.log("savePerformanceInsights route: ", req)
      try {
        const performanceInsightsResponse = await savePerformanceInsights(req.body);
        console.log(performanceInsightsResponse)
        if (performanceInsightsResponse.isSuccess) {
          res.status(200).json({"message": "Saved the quiz performance insights successfully"});
        } else {
          res.status(400).json({ message: performanceInsightsResponse.errMsg});
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to save the quiz performance insights." });
      }
    });

module.exports = router;