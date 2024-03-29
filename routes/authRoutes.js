const express = require('express');
const { fetchCognitoUserDetails, refreshAccessToken, globalSignOutUser } = require('../utils/CognitoService');
const { use } = require('./roomRoutes');

const router = express.Router();

router.post('/user-details', async (req, res) => {

    console.log("herer")
    try {
    const { accessToken } = req.body;
    const userDetails = await fetchCognitoUserDetails(accessToken);
    console.log(userDetails)
    res.json(userDetails);
  } catch (error) {
    res.status(500).send({ message: 'Failed to fetch user details' });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    res.status(500).send({ message: 'Failed to refresh access token' });
  }
});




router.post('/signout', async (req, res) => {
    try {
    const { accessToken } = req.body;
    const signoutStatus = await globalSignOutUser(accessToken);
    res.json(signoutStatus);
  } catch (error) {
    res.status(500).send({ message: 'Failed to fetch user details' });
  }
});



module.exports = router;
