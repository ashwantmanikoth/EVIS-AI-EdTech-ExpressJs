// roomRoutes.js

const express = require("express");

const {
  createRoom,
  checkRoomIfExists,
  deleteRoom,
} = require("../utils/roomDB");

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

module.exports = router;
