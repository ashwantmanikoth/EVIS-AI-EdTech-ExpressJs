const axios = require("axios");
const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;
const AWS = require("aws-sdk");

const cognitoConfig = {
  domain: "evis-auth.auth.us-east-1.amazoncognito.com",
  clientId: clientId,
  clientSecret: clientSecret,
};

async function fetchCognitoUserDetails(accessToken) {
  try {
    const response = await axios.get(
      `https://${cognitoConfig.domain}/oauth2/userInfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Cognito user details:", error);
    throw error;
  }
}

async function refreshAccessToken(refreshToken) {
  const url = `${cognitoConfig.domain}/oauth2/token`;
  const body = `grant_type=refresh_token&client_id=${encodeURIComponent(
    cognitoConfig.clientId
  )}&refresh_token=${encodeURIComponent(refreshToken)}`;

  const options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Include the Authorization header if your app uses a client secret
      Authorization: `Basic ${Buffer.from(
        `${cognitoConfig.clientId}:${cognitoConfig.clientSecret}`
      ).toString("base64")}`,
    },
  };

  try {
    const response = await axios.post(url, body, options);
    return response.data; // This includes access_token, id_token, and possibly a new refresh_token
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

// Import necessary AWS SDK clients and commands
// const {
//   CognitoIdentityProviderClient,
//   GlobalSignOutCommand,
// } = require("@aws-sdk/client-cognito-identity-provider");

// // Initialize the CognitoIdentityProviderClient with your region
// const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

// async function globalSignOutUser(accessToken) {
//   try {
//     // Create and send the GlobalSignOutCommand
//     const command = new GlobalSignOutCommand({
//       AccessToken: accessToken, // The user's access token
//     });
//     const response = await client.send(command);
//     console.log("Successfully signed out the user globally:", response);
//     return true;
//   } catch (error) {
//     console.error("Error signing out the user globally:", error);
//   }
// }

module.exports = {
  fetchCognitoUserDetails,
  refreshAccessToken,
  // globalSignOutUser,
};
