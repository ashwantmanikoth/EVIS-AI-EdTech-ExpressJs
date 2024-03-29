// roomRoutes.js

const express = require("express");

const { createRoom, checkRoomExists } = require("../utils/roomDB");

const router = express.Router();

// POST /api/rooms/create
router.post("/create", async (req, res) => {
  try {
    console.log("two");
    const roomName = req.body.roomName;
    if (!roomName) {
      return res.status(400).send({ message: "Room name is required" });
    }
    const roomId = await createRoom(roomName);
    res.json({ roomId });
  } catch (error) {
    console.error("Failed to create room:", error);
    res.status(500).send({ message: "Failed to create room" });
  }
});

router.post("/join", async (req, res) => {
  const { roomId } = req.body;
  try {
    const exists = await checkRoomExists(roomId);
    if (exists) {
      // Implement your logic for a successful join here
      // For example, you might add the user to a list of participants in the room
      res.json({ message: "Successfully joined room." });
    } else {
      res.status(404).json({ message: "Room does not exist." });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to check room existence." });
  }
});

module.exports = router;
