const express = require("express");
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// DynamoDB Client Configuration
const config = {
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const dynamoDb = new DynamoDBClient(config);

async function checkIfAlreadySubmitted(submissionDetails) {
  const roomId = submissionDetails.roomId;
  const userId = submissionDetails.userId;
  const quizNumber = submissionDetails.quizNumber;

  const queryParams = {
    TableName: "quiz_submission_details_" + roomId,
    KeyConditionExpression: "quiz_number = :qn AND user_id = :uid",
    ExpressionAttributeValues: {
      ":qn": { N: quizNumber.toString() }, 
      ":uid": { S: userId }  
    }
  };

  try {
    const queryCommand = new QueryCommand(queryParams);
    const queryCommandResult = await dynamoDb.send(queryCommand);
    console.log("queryCommandResult", queryCommandResult);
    if (queryCommandResult.Count == 0) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error("Error checking if submission was already made:", error);
    throw error;
  }
}

async function calculateScore(submissionDetails) {

  const roomId = submissionDetails.roomId;
  const quizNumber = submissionDetails.quizNumber;
  const selectedAnswers = submissionDetails.selectedAnswers;

  const params = {
    TableName: 'quiz_questions_' + roomId,
    KeyConditionExpression: "quiz_number = :qn",
    ExpressionAttributeValues: {
      ":qn": { N: quizNumber.toString() }
    }
  };

  try {
    const queryQuizAnswersCommand = new QueryCommand(params);
    const queryQuizAnswersResult = await dynamoDb.send(queryQuizAnswersCommand);

    console.log("queryQuizAnswersResult", queryQuizAnswersResult);

    let numberOfCorrectAnswers = 0;
    selectedAnswers.forEach((selectedAnswer, index) => {

      console.log("quiz ques item", queryQuizAnswersResult.Items[index]);
      if (selectedAnswer === parseInt(queryQuizAnswersResult.Items[index].correct_option.N)) {
        numberOfCorrectAnswers++;
      }
    });

    console.log("Number of correct answers:", numberOfCorrectAnswers);

    const score = (numberOfCorrectAnswers / selectedAnswers.length) * 100;
    console.log("Score:", numberOfCorrectAnswers);
    return score;


  } catch (error) {
    console.error("Error fetching answers:", error);
    return -1;
  }
}

async function submitAnswer(submissionDetails) {
  console.log("submitAnswer", submissionDetails);

  if (typeof submissionDetails === "object" && submissionDetails.hasOwnProperty("roomId")) {

    // check if submission exists
    const alreadySubmitted = await checkIfAlreadySubmitted(submissionDetails);

    if (alreadySubmitted) {

      return {
        "isSuccess": false,
        "errMsg": "Can't submit - already submitted."
      }

    } else {

      const score = await calculateScore(submissionDetails);
      if (score != -1) {

        submissionDetails['score'] = score;
        const submissionResponse = await saveSubmission(submissionDetails);
        return submissionResponse;

      } else  {

        return {
          "isSuccess": false,
          "errMsg": "Submission failed - errror in calculating the score."
        }

      }
    } 
  }
}

async function saveSubmission(submissionDetails) {

  const roomId = submissionDetails.roomId;
  const userId = submissionDetails.userId;
  const quizNumber = submissionDetails.quizNumber;
  const selectedAnswers = submissionDetails.selectedAnswers;
  const topic = submissionDetails.topic;
  const score = submissionDetails.score;

  try {
    const submittedAnswers = selectedAnswers.map(num => ({ N: num.toString() }));
    const params = {
      TableName: "quiz_submission_details_" + roomId,
      Item: {
        "quiz_number": { N: quizNumber.toString() },
        "user_id": { S: userId },
        "topic": { S: topic },
        "answers_submitted": { L: submittedAnswers },
        "score": { N: score.toString() }
      }
    };

    const putCommand = new PutItemCommand(params);
    const putCommandResult = await dynamoDb.send(putCommand);
    console.log("putCommandResult", putCommandResult); //pending
    return {
      "isSuccess": true
    }
  } catch (error) {
    console.error("Error checking if submission was already made:", error);
    throw error;
  }
}

module.exports = { submitAnswer, checkIfAlreadySubmitted, calculateScore, saveSubmission };
