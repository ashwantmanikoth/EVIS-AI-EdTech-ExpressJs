// quizRoutes.js

const express = require("express");

const { submitAnswer, savePerformanceInsights } = require("../utils/quizDB");
const {
  extractFromS3,
  uploadFileToS3,
  uploadJsonToS3,
  getKeyPhrase,
  getObjectFromS3
} = require("./AWSfunctions");

const { invokeLambda } = require("../utils/lambdaService");

const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post("/submitAnswer", async (req, res) => {
  console.log("submitAnswer: ", req);
  try {
    const submitResponse = await submitAnswer(req.body);
    console.log(submitResponse);
    if (submitResponse.isSuccess) {
      res.status(200).json({ message: "Submitted the quiz successfully" });
    } else {
      res.status(400).json({ message: submitResponse.errMsg });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to submit answer." });
  }
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }
    const file = req.file;
    if (req.body.jsonString) {
      // Parse the JSON string to an object
      const additionalData = JSON.parse(req.body.jsonString);

      // Now you can access roomId and other properties
      const roomId = additionalData.roomId;

      const bucketName = "evis-storage";
      const uploadResponse = await uploadFileToS3(bucketName, file);

      if (uploadResponse) {
        const response = await extractFromS3(bucketName); //extracts nouns from s3 (uploaded doc)

        // const key = file.originalname.replace(".pdf", ".json");
        const key = roomId + ".json";

        const responseAsJSON = JSON.stringify(response);

        const dataBuffer = Buffer.from(responseAsJSON);

        await uploadJsonToS3(bucketName, dataBuffer, key, "application/json");

        res.json(response);
      } else {
        res.status(400).json({ message: uploadResponse.errMsg });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload." });
  }
});

router.post("/getQuiz",async(req,res)=>{
  const response = await getObjectFromS3(req.body.roomId,req.body.pageNumber);
  console.log(response)
  if(response){
    
    res.json(response);
  }
});

router.post("/endQuiz", async (req, res) => {
  console.log("endQuiz route: ", req);
  try {
    const endQuizResponse = await invokeLambda("endQuiz", req.body);
    console.log("endQuizResponse", endQuizResponse);

    const performanceInsightsResponse = await savePerformanceInsights(req.body);
    console.log("performanceInsightsResponse", performanceInsightsResponse);

    if (endQuizResponse.isSuccess) {
      res.status(200).json({ message: "Quiz ended successfully" });
    } else {
      res.status(400).json({ message: endQuizResponse.errMsg });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to End Quiz." });
  }
});

router.post("/startQuiz", async (req, res) => {

  console.log("startQuiz route: ", req);
  const response = await getObjectFromS3(req.body.roomId,req.body.pageNumber);


  
  try {
    req.body["quizQuestions"] = JSON.parse(response);
    console.log("tutu", req.body.quizQuestions);

    const startQuizResponse = await invokeLambda(
      "save_quiz_questions",
      req.body,
    );
    console.log("startQuizResponse", startQuizResponse);

    if (startQuizResponse.isSuccess) {
      res.status(200).json({ message: "Quiz started successfully" });
    } else {
      res.status(400).json({ message: startQuizResponse.errMsg });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to End Quiz." });
  }
});

router.post("/savePerformanceInsights", async (req, res) => {
  console.log("savePerformanceInsights route: ", req);
  try {
    const performanceInsightsResponse = await savePerformanceInsights(req.body);
    console.log(performanceInsightsResponse);
    if (performanceInsightsResponse.isSuccess) {
      res
        .status(200)
        .json({ message: "Saved the quiz performance insights successfully" });
    } else {
      res.status(400).json({ message: performanceInsightsResponse.errMsg });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to save the quiz performance insights." });
  }
});

module.exports = router;
