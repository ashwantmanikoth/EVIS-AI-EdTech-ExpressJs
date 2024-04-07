require("dotenv").config(); // This is the correct way to initialize dotenv in a CommonJS module

const {
  ComprehendClient,
  DetectKeyPhrasesCommand,
} = require("@aws-sdk/client-comprehend");

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

const {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");

const OpenAI = require("openai");
const region = "us-east-1";
const s3 = new S3Client({ region: region }); // Replace 'your-region' with your S3 bucket region
const textract = new TextractClient({ region: region });
const fs = require("fs");

// DynamoDB Client Configuration
const config = {
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

async function uploadFileToS3(bucketName, file) {
  try {
    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
      Bucket: bucketName,
      Key: file.originalname,
      Body: fileStream,
    };
    const command = new PutObjectCommand(uploadParams);
    const response = await s3.send(command);
    if (response.$metadata.httpStatusCode == 200) {
      fs.unlinkSync(file.path);
      console.log("File uploaded successfully");
      return response;
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

async function getObjectFromS3(roomId, pageNumber) {
  console.log("feed");
  const input = {
    Bucket: "evis-storage", // required
    Key: roomId + ".json",
  };

  const command = new GetObjectCommand(input);
  const response = await s3.send(command);

  const data = await new Promise((resolve, reject) => {
    const stream = response.Body;
    let data = "";

    stream.on("data", (chunk) => {
      data += chunk;
    });

    stream.on("end", () => {
      resolve(data); // Resolve the promise with the collected data
    });

    stream.on("error", reject); // Reject the promise on error
  });

  // Once the stream is fully read and the Promise resolved, parse the JSON
  const jsonData = JSON.parse(data);
  const filteredData = jsonData.filter((block) => block.page <= pageNumber); // keywords until the pageNumber
  const textOnlyArray = filteredData.map((block) => block.text);

  const textOnlyJson = JSON.stringify(textOnlyArray);

  // Assuming getKeyPhrase and callOpenAi are async functions
  try {
    console.log("hola");
    const keyPhraseResult = await getKeyPhrase(textOnlyJson); // Process textOnlyJson as needed
    console.log(keyPhraseResult.map((block) => block.Text));
    // console.log(keyPhraseResult.filter(Text))
    const quiz = await callOpenAi(keyPhraseResult.map((block) => block.Text)); // Assuming this function also returns a Promise
    return quiz; // Return or process the quiz further
  } catch (error) {
    console.error("Error getting key phrases or calling OpenAI:", error);
    throw error; // Rethrow or handle error appropriately
  }
}

async function uploadJsonToS3(
  bucketName,
  data,
  key,
  contentType = "application/octet-stream"
) {
  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    const response = await s3.send(command);
    console.log("Data uploaded successfully:", response);
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

async function extractFromS3(bucketName) {
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
          console.log(response);
          const jsonResponse = JSON.stringify(response);

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
    return textBlocks;
  } catch (error) {
    console.error("Error processing the document:", error);
    throw error; // Rethrow or handle error appropriately
  }
}

async function getKeyPhrase(jsonInput) {
  const config = {
    region: "us-east-1",
  };

  const client = new ComprehendClient(config);

  const input = {
    Text: jsonInput,
    LanguageCode: "en",
  };
  const command = new DetectKeyPhrasesCommand(input);
  try {
    const response = await client.send(command);
    const filteredKeys = response.KeyPhrases.filter((item) => item.Score > 0.8);
    console.log(filteredKeys);
    return filteredKeys; // Return the detected key phrases
  } catch (error) {
    console.error("Error detecting key phrases:", error);
    throw error; // Rethrow the error for further handling
  }
}

async function callOpenAi(keywordsJson) {
  const openai = new OpenAI();
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a Quiz Generating assistant." },
        {
          role: "user",
          content: "Generate five quiz questions based on the provided keywords. Each question should have four options, with one correct answer. Return the questions in JSON format with the following structure: [{'question': 'Example question?', 'options': ['Option 1', 'Option 2', 'Option 3', 'Option 4'], 'correct_option': 0, 'Topic': 'Example Topic'}]. Here are the keywords: " + keywordsJson
        },
      ],
      model: "gpt-3.5-turbo",
    });

    console.log(completion.choices[0].message.content); // Log the completion for debugging
    return completion.choices[0].message.content; // Send the completion back to the client
  } catch (error) {
    console.error("Error generating prompt:", error);
    res.status(500).send("An error occurred while generating the prompt.");
  }
}

async function getDynamoDb(params) {
  console.log("11")

  const dynamoDb = new DynamoDBClient(config);
  const data = await dynamoDb.send(new QueryCommand(params));
  console.log("Success", data.Items);
  return data.Items;
}


async function getDynamoScanDb(params) {
  console.log("11")

  const dynamoDb = new DynamoDBClient(config);
  const data = await dynamoDb.send(new ScanCommand(params));
  console.log("Success", data.Items);
  return data.Items;
}

async function getItemDynamoDb(params) {
  console.log("11")

  const dynamoDb = new DynamoDBClient(config);
  try{
    const data = await dynamoDb.send(new GetItemCommand(params));
    console.log("Success", data);
    return data;
  }catch(error){
    throw error;
  }

}
module.exports = {
  extractFromS3,
  uploadFileToS3,
  uploadJsonToS3,
  getKeyPhrase,
  getObjectFromS3,
  getDynamoDb,
  getItemDynamoDb,
  getDynamoScanDb
};
