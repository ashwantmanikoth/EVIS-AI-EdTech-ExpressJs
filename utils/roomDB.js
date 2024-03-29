const AWS = require("aws-sdk");

// Configure AWS SDK
AWS.config.update({
  region: "us-east-1",
  // other configurations as needed
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TableName = "room";
const professorId = 2;

async function createRoom(roomName) {
  const roomId = generateRoomId(); // Implement this function based on your ID generation logic
  const params = {
    TableName,
    Item: {
      roomId,
      professorId,
      roomName,
    },
  };

  dynamoDb.put(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success");
    }
  });
  return roomId;
}

async function checkRoomExists(roomId) {
  const params = {
    TableName: "room", // Replace with your DynamoDB table name
    Key: {
      roomId: roomId,
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item !== undefined; // Returns true if room exists, false otherwise
  } catch (error) {
    console.error("Error checking room existence:", error);
    throw error; // Rethrow to handle it in the calling function
  }
}

// Utility function to generate a unique room ID
// Implement according to your requirements
function generateRoomId() {
  return Math.random().toString(36).substring(2, 15);
}

module.exports = { createRoom, checkRoomExists };
