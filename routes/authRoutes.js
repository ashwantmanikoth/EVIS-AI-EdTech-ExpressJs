const express = require('express');
const { fetchCognitoUserDetails, refreshAccessToken, globalSignOutUser } = require('../utils/CognitoService');
const { use } = require('./roomRoutes');

const router = express.Router();

router.post("/user-details", async (req, res) => {
  console.log("herer");
  try {
    const { accessToken } = req.body;
    const userDetails = await fetchCognitoUserDetails(accessToken);
    console.log(userDetails);
    res.json(userDetails);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch user details" });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    res.status(500).send({ message: "Failed to refresh access token" });
  }
});

// const { CognitoIdentityProviderClient, GlobalSignOutCommand } = require("@aws-sdk/client-cognito-identity-provider");

// // Initialize the CognitoIdentityProviderClient with configuration
// const client = new CognitoIdentityProviderClient({
//   region: "us-east-1", // Example region, replace with your actual region
//   // Add any other configuration needed
// });

// router.post("/signout", async (req, res) => {
//   try {
//     console.log("hh")
//     const { accessToken } = req.body;
// // console.log(accessToken)
//     if (!accessToken) {
//       return res.status(400).send({ message: "Access token is required." });
//     }

//     // Preparing the input for the GlobalSignOutCommand
//     const input = {
//       AccessToken: accessToken, // The access token obtained from the client
//     };

//     // Creating and sending the GlobalSignOutCommand
//     const command = new GlobalSignOutCommand(input);
//     const response = await client.send(command);
//     console.log(response)

//     // If the command was successful, send an appropriate response
//     res.send({ message: "Successfully signed out." });
//   } catch (error) {
//     console.error("Logout error:", error); 
//     res.status(500).send({ message: "Failed to fetch user details" });
//   }
// });

module.exports = router;
