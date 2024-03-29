require("dotenv").config(); // This is the correct way to initialize dotenv in a CommonJS module

const multer = require("multer");
const roomRoutes = require("./routes/roomRoutes");
const authRoutes = require("./routes/authRoutes");
const { fetchCognitoUserDetails, refreshAccessToken } = require('./utils/CognitoService');

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");

const {
  TextractClient,
  AnalyzeDocumentCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} = require("@aws-sdk/client-textract");

const fs = require("fs");

const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");

const cors = require("cors");
const app = express();
const axios = require("axios");

const port = 3001;
const region = "us-east-1";
const bucketName = "evis-storage";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const upload = multer({ dest: "uploads/" });
const validateToken = require("./routes/validatetoken"); // Ensure this path is correct

app.use(cors());
app.use(bodyParser.json());

// Configure AWS
AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
});

const comprehend = new AWS.Comprehend();
const s3 = new S3Client({ region: region }); // Replace 'your-region' with your S3 bucket region
const textract = new TextractClient({ region: region });

app.post("/analyze-text", (req, res) => {
  const { text } = req.body;
  console.log(text);
  var params = {
    LanguageCode: "en",
    Text: text,
  };

  comprehend.detectKeyPhrases(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      res.send({ error: "Error processing your request" });
    } else {
      res.send(data);
    }
  });
});

//
//
//
//
app.post("/upload", validateToken, upload.single("file"), async (req, res) => {
  //todo need to send auth token from client side in headers
  console.log("hereee");
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }
    const file = req.file;

    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
      Bucket: bucketName, // Replace with your bucket name
      Key: file.originalname,
      Body: fileStream,
    };

    const command = new PutObjectCommand(uploadParams);

    await s3.send(command);

    // Optionally, delete the file after uploading to S3
    fs.unlinkSync(file.path);

    res.send({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send({ message: "Error uploading file" });
  }
});

app.get("/extract", async (req, res) => {
  console.log("koi");
  try {
    // List objects in the bucket
    const { Contents } = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Delimiter: "/",
      })
    );

    // Sort by last modified date and get the most recent file
    const sortedContents = Contents.sort(
      (a, b) => b.LastModified - a.LastModified
    );
    const mostRecentFile = sortedContents[0];
    console.log("Most recent file:", mostRecentFile.Key);

    // Start the text detection job
    const startCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucketName,
          Name: mostRecentFile.Key,
        },
      },
    });
    const startResponse = await textract.send(startCommand);
    const jobId = startResponse.JobId;
    console.log("Text detection job started successfully. JobId:", jobId);

    // Function to check the job status and get results
    async function checkJobStatus(jobId) {
      const params = { JobId: jobId };
      const command = new GetDocumentTextDetectionCommand(params);

      for (let attempt = 0; attempt < 20; attempt++) {
        // Try up to 20 times at 5-second intervals
        const response = await textract.send(command);
        if (response.JobStatus === "SUCCEEDED") {
          console.log("Text detection job succeeded.");
          return response; // Return or process response here
        } else if (response.JobStatus === "FAILED") {
          throw new Error(
            `Text detection job failed: ${response.StatusMessage}`
          );
        }
        // If the job is still in progress, wait a bit before polling again
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
      }
      throw new Error("Text detection job timed out.");
    }

    // Check the job status and wait for the results
    const result = await checkJobStatus(jobId);
    console.log("Result:", result);

    const textBlocks = result.Blocks.filter(
      (block) => block.BlockType === "WORD"
    ) // Assuming you're interested in LINE or WORD types
      .map((block) => ({
        text: block.Text,
        page: block.Page,
      }));

    // Send the filtered and mapped results back to the client
    res.json(textBlocks);
  } catch (error) {
    console.error("Error processing the document:", error);
    throw error; // Rethrow or handle error appropriately
  }
});

app.post("/api/auth/exchange", async (req, res) => {
  const { code } = req.body;
  console.log(code);
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;
  const redirectUri = "https://localhost:3000/auth/callback";
  const cognitoDomain = "evis-auth.auth.us-east-1.amazoncognito.com";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  // Manually construct the URL-encoded body
  const data = `grant_type=authorization_code&client_id=${encodeURIComponent(
    clientId
  )}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  // Prepare the headers
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${basicAuth}`,
  };

  try {
    // Make the request
    const response = await axios.post(
      `https://${cognitoDomain}/oauth2/token`,
      data,
      { headers }
    );

    console.log(response.data.expires_in); // gets refresh token,id_token, access_token,

    const userDetails = await fetchCognitoUserDetails(response.data.access_token);

    console.log(userDetails)    
    res.json({
      userEmail :userDetails.email,
      userName:userDetails.username,
      accessToken: response.data.access_token,
      idToken: response.data.id_token,
      expiresIn: response.data.expires_in,
      refreshToken: response.data.refresh_token
    });
  } catch (error) {
    console.error(
      "Error exchanging code for tokens:",
      error.response ? error.response.data : error.message
    );
  }
});

// Register the room routes
app.use("/room", roomRoutes);

app.use('/api/auth', authRoutes);



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
