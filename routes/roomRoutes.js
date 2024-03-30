// roomRoutes.js

const express = require("express");

const { createRoom, checkRoomExists } = require("../utils/roomDB");

const router = express.Router();

// POST /api/rooms/create
router.post("/create", async (req, res) => {
  try {
    const roomName = req.body.roomName;
    if (!roomName) {
      return res.status(400).send({ message: "Room name is required" });
    }
    const response = await createRoom(roomName);
    if(response.success){
      res.json(response.roomId);
    }else{
      res.status(404)
      res.json("Failed Room Creation! try again Later")
    }
  } catch (error) {
    console.error("Failed to create room:", error);
    res.json(error).sendStatus(400);
  }
});

router.post("/join", async (req, res) => {
  const { roomId } = req.body;
  try {
    const exists = await checkRoomExists(roomId);
    if (exists) {
      res.json("Successfully joined room." );
    } else {
      res.status(404).json({ message: "Room does not exist." });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to check room existence." });
  }
});

module.exports = router;
