const { Lambda } = require('aws-sdk');
const dotenv = require("dotenv");

dotenv.config();

const config = {
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const lambda = new Lambda(config);


async function invokeLambda(functionName, event) {
    console.log("invokeLambda: ", functionName);
    console.log("invokeLambda: ", event);

    const params = {
        FunctionName: functionName, 
        InvocationType: 'RequestResponse', 
        Payload: JSON.stringify(event) 
    };
    try {
        const lambdaResponse = await lambda.invoke(params).promise();
        console.log("lambdaResponse", lambdaResponse.Payload);
        if (lambdaResponse && lambdaResponse.Payload) {
            return {
                "isSuccess" : true
            }
        } else {
            return {
                "isSuccess" : false
            }
        }
    } catch(err) {
        console.error("Error invoking Lambda function:", err);
        return {
            "isSuccess" : false
        }
    }
}

module.exports = { invokeLambda };