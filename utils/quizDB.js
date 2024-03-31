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



async function submitAnswer(identifier) {
  console.log("submitAnswer", identifier);
  /*Scannning if the new room name already exists or not */
  if (typeof identifier === "object" && identifier.hasOwnProperty("roomId")) {
    const roomId = identifier.roomId;
    const userId = identifier.userId;
    const quizNumber = identifier.quizNumber;
    const selectedAnswers = identifier.selectedAnswers;
    const topic = identifier.topic;

    const queryParams = {
        TableName: "quiz_submission_details_" + roomId,
        KeyConditionExpression: "quiz_number = :qn AND user_id = :uid",
        ExpressionAttributeValues: {
            ":qn": { N: quizNumber.toString() }, // Replace with the quiz_number you want to check
            ":uid": { S: userId } // Replace with the user_id you want to check
        }
    };

    try {
      const queryCommand = new QueryCommand(queryParams);
      const queryCommandResult = await dynamoDb.send(queryCommand);
      console.log("queryCommandResult", queryCommandResult); 
      if (queryCommandResult.Count == 0) {

        const submittedAnswers = selectedAnswers.map(num => ({ N: num.toString() }));
        const params = {
          TableName: "quiz_submission_details_" + roomId,
            Item: {
                "quiz_number": { N: quizNumber.toString() }, 
                "user_id": { S: userId },
                "topic": { S: topic },
                "answers_submitted": { L: submittedAnswers },
                "score": { N: "90" } 
            }
        };

        const putCommand = new PutItemCommand(params);
        const putCommandResult = await dynamoDb.send(putCommand);
        console.log("putCommandResult", putCommandResult); //pending
        return {
          "isSuccess" : true
        }
      } else {
        return {
          "isSuccess" : false,
          "errMsg": "Can't submit - already submitted."
        }
      }
    } catch (error) {
      console.error("Error checking if submission was already made:", error);
      throw error; 
    }
  } 
}

module.exports = { submitAnswer };
