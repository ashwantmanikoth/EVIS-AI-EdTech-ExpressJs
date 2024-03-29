const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
require("dotenv").config(); // This is the correct way to initialize dotenv in a CommonJS module

const client = jwksClient({
  jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_SxOEpt5Zh/.well-known/jwks.json`
});

function getKey(header, callback){
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const options = {
  // Validate the audience and the issuer.
  audience: process.env.COGNITO_CLIENT_ID,
  issuer: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_SxOEpt5Zh`,
  algorithms: ['RS256']
};

function validateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).send("Token not provided");
  }

  jwt.verify(token, getKey, options, (err, decoded) => {
    if (err) {
      console.error('Token validation error', err);
      return res.status(401).send("Invalid Token");
    }
    req.user = decoded; // Optional: Attach the decoded token to the request so that downstream processes can use it
    next();
  });
}

module.exports = validateToken;
