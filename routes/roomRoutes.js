// roomRoutes.js

const express = require("express");

const {
  createRoom,
  checkRoomIfExists,
  deleteRoom,
} = require("../utils/roomDB");
const { getDynamoDb, getItemDynamoDb } = require("./AWSfunctions");
const { get } = require("./quizRoutes");

const router = express.Router();

// POST /api/rooms/create
router.post("/create", async (req, res) => {
  try {
    const roomName = req.body.roomName;
    const userEmail = req.body.userEmail;

    if (!roomName) {
      return res.status(400).send({ message: "Room name is required" });
    }
    const response = await createRoom(roomName, userEmail);
    if (response.success) {
      res.json(response.roomId);
    } else {
      res.status(404);
      res.json("Failed Room Creation! try again Later");
    }
  } catch (error) {
    console.error("Failed to create room:", error);
    res.json(error).sendStatus(400);
  }
});

router.post("/delete", async (req, res) => {
  try {
    const roomId = req.body.roomId;

    if (!roomId) {
      return res.status(400).send({ message: "Room name is required" });
    }
    const response = await deleteRoom(roomId);
    console.log(response);
    if (response.success) {
      res.json(response.roomId);
    } else {
      res.status(404);
      res.json("Failed Room Creation! try again Later");
    }
  } catch (error) {
    console.error("Failed to create room:", error);
    res.json(error).sendStatus(400);
  }
});

router.post("/join", async (req, res) => {
  const { roomId } = req.body;
  console.log(roomId);
  try {
    const exists = await checkRoomIfExists({ roomId: roomId });
    console.log(exists);
    if (exists) {
      res.json({ roomName: exists });
    } else {
      console.log("dd");
      res.status(404).json({ message: "Room does not exist." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Failed to check room existence." });
  }
});

router.post("/getMyRooms", async (req, res) => {
  console.log("11");
  const userEmail = req.body.userEmail;
  console.log(userEmail);
  try {
    const params = {
      TableName: "NewRooms",
      IndexName: "professorId-created_at-index", // The name of the GSI
      KeyConditionExpression: "professorId = :professorId",
      ExpressionAttributeValues: {
        ":professorId": { S: userEmail },
      },
    };
    console.log("3");

    const result = await getDynamoDb(params);
    res.json(result);
  } catch (error) {
    console.log(error);
  }
});

router.post("/reports", async (req, res) => {
  const roomId = req.body.roomId;
  try {
    const params = {
      TableName: "quiz_performance_insigths",
      KeyConditionExpression: "#room_id = :room_id_value",
      ExpressionAttributeNames: {
        "#room_id": "room_id",
      },
      ExpressionAttributeValues: {
        ":room_id_value": { S: roomId },
      },
    };
    const response = await getDynamoDb(params);
    console.log(response)
    res.json(response);
  } catch (error) {
    res.status(404).json("Failed to get Reports");
  }
});
module.exports = router;
