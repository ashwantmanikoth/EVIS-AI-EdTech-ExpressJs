const axios = require("axios");
const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;
const AWS = require("aws-sdk");

const cognitoConfig = {
  student_domain: process.env.COGNITO_DOMAIN_URL,
  professor_domain:process.env.COGNITO_PROFESSOR_DOMAIN_URL,
  clientId: clientId,
  clientSecret: clientSecret,
  region: "us-east-1"
};

async function fetchCognitoUserDetails(accessToken) {
  try {
    const response = await axios.get(
      `https://${cognitoConfig.student_domain}/oauth2/userInfo`,
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
async function fetchCognitoProfessorDetails(accessToken) {
  console.log("hey hey")
  try {
    const response = await axios.get(
      `https://${cognitoConfig.professor_domain}/oauth2/userInfo`,
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
// Initialize the CognitoIdentityProviderClient with your region

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1', // make sure to set this to your region

});

async function globalSignOutUser(accessToken) {

  return new Promise((resolve, reject) => {
    if (!accessToken) {
      // Reject the promise if accessToken is not provided
      reject(new Error('Access token is required'));
    } else {
      const params = {
        AccessToken: accessToken,
      };

      cognitoIdentityServiceProvider.globalSignOut(params, (err, data) => {
        if (err) {
          console.error(err);
          reject(err); // Reject the promise on error
        } else {
          resolve(data); // Resolve the promise with the data on success
        }
      });
    }
  });
}

module.exports = {
  fetchCognitoUserDetails,
  fetchCognitoProfessorDetails,
  refreshAccessToken,
  globalSignOutUser,
};
