const express = require("express");
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  CreateTableCommand,
  ScanCommand,
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

async function createRoom(roomName,userEmail) {
  // const { roomName, professorId } = req.body;

  const roomId = generateRoomId();
  const input = {
    TableName: "room",
    Item: {
      roomId: { S: roomId },
      professorId: { S: userEmail },
      roomName: { S: roomName },
    },
  };

  const roomExists = await checkRoomIfExists({ roomName: roomName });
  if (roomExists) {
    
    const command = new PutItemCommand(input);
    try {
      // const res = await dynamoDb.send(command);
      // console.log(res);
      if (await dynamoDb.send(command)) {
        console.log("Room created" + roomId);
        createTable(roomId);
        return {
          success: true,
          message: "Room created successfully.",
          roomId: roomId,
        };
      } else {
        console.log("Room createion failed");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      return { success: false, message: "Failed to create room." };
    }
  } else {
    console.log("room exists");
    return { success: false, message: "Failed to create room." };
  }
}

async function checkRoomIfExists(identifier) {
  console.log("kk");
  /*Scannning if the new room name already exists or not */
  if (typeof identifier === "object" && identifier.hasOwnProperty("roomName")) {
    console.log("room name is " + identifier.roomName);
    const params = {
      TableName: "room",
      FilterExpression: "roomName = :roomName",
      ExpressionAttributeValues: {
        ":roomName": { S: identifier.roomName },
      },
    };

    try {
      const command = new ScanCommand(params);
      const result = await dynamoDb.send(command);
      console.log(result); //pending

      return result.Count == 0; // Simplified return
    } catch (error) {
      console.error("Error checking room existence:", error);
      throw error; // Rethrow to handle it in the calling function
    }
  } else if (typeof identifier === "object" && identifier.hasOwnProperty("roomId")) {
    const roomId = identifier.roomId;
    const params = {
      TableName: "room",
      Key: {
        roomId: { S: identifier.roomId },
      },
    };

    const result = await dynamoDb.send(new GetItemCommand(params));
    // console.log(result.Item.length >0)
    return result.Item.roomName.S; //returns true when no Room eists
  }
}

// Utility function to generate a unique room ID
// Implement according to your requirements
function generateRoomId() {
  return Math.random().toString(36).substring(2, 15);
}

async function createTable(roomId) {
  const input = {
    TableName: "quiz_questions_" + roomId, // Assuming roomId is a variable containing the room ID
    AttributeDefinitions: [
      {
        AttributeName: "quiz_number",
        AttributeType: "N", // S = String, defining quiz_number as a String type for the partition key
      },
      {
        AttributeName: "question_number",
        AttributeType: "N", // S = String, defining question_number as a String type for the sort key
      },
      // Add other attribute definitions here if needed
    ],
    KeySchema: [
      {
        AttributeName: "quiz_number",
        KeyType: "HASH", // HASH = partition key
      },
      {
        AttributeName: "question_number",
        KeyType: "RANGE", // RANGE = sort key
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  };

  try {
    const command = new CreateTableCommand(input);
    const response = await dynamoDb.send(command);
    console.log("Table created successfully:", response);
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  }
}

module.exports = { createRoom, checkRoomIfExists, createTable };
