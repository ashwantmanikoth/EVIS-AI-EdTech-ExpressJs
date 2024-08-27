# EVIS Backend Repository

## Overview

Welcome to the backend repository of **EVIS** (Enhanced Virtual Instruction System). EVIS is an innovative platform designed to revolutionize classroom learning by capturing lecture slides and voice recordings, generating engaging content and quizzes for students in real-time, and providing instant feedback to professors. This repository contains the backend code that handles all the API calls from the React front-end and manages the cloud-based AWS API implementations.
Please note that the frontend code for EVIS is located in a separate repository, which can be accessed [here](https://github.com/ashwantmanikoth/EVIS-AI-EdTech-React).

## Features

- **Real-time Content Generation**: Captures lecture slides, processes them using AI, and generates relevant quizzes and engaging content for students.
- **Instant Feedback for Professors**: Provides immediate feedback to professors, enabling them to adjust and improve engagement during lectures.
- **Cloud-based Architecture**: Utilizes AWS cloud services, including S3, Textract, Comprehend, DynamoDB, and Lambda, for scalable and efficient content processing and storage.
- **AI Integration**: Incorporates AI to analyze content and generate quizzes, improving the learning experience for students.

## Tech Stack

- **Backend Framework**: Express.js
- **Cloud Services**: AWS S3, Textract, Comprehend, DynamoDB, Lambda
- **AI Integration**: OpenAI for quiz generation
- **Database**: DynamoDB (NoSQL)
- **Programming Language**: JavaScript (Node.js)

## Project Structure

```bash
├── routes/
│   ├── AWSfunctions.js       # Functions interacting with AWS services
│   ├── authRoutes.js         # Handles authentication-related API endpoints
│   ├── functionalRoutes.js   # Miscellaneous API endpoints
│   ├── quizRoutes.js         # Handles quiz-related API endpoints
│   ├── roomRoutes.js         # Manages room-related API endpoints
│   ├── routesmw.js           # Middleware for route handling
│   ├── validatetoken.js      # Token validation middleware
├── utils/
│   ├── CognitoService.js     # AWS Cognito service integration
│   ├── lambdaService.js      # Utility functions for invoking AWS Lambda functions
│   ├── roomDB.js             # Contains database operations for room management
│   ├── babel.config.js       # Babel configuration for the project
├── .env                      # Environment variables (not included in the repo)
├── package.json              # Node.js dependencies and scripts
├── README.md                 # Project documentation
```

##  API Endpoints
Quiz Routes (quizRoutes.js)
POST /upload: Uploads lecture slides to S3 and processes them to extract key phrases and generate quizzes.
POST /getQuiz: Retrieves a quiz generated from the content of the lecture slides.
POST /endQuiz: Ends the current quiz session and processes performance insights.
POST /startQuiz: Starts a new quiz session and stores quiz questions.
POST /getInsight: Retrieves insights and performance metrics for the quiz session.
Room Routes (roomRoutes.js)
POST /create: Creates a new room for a lecture session.
POST /delete: Deletes an existing room.
POST /join: Joins an existing room.
POST /getMyRooms: Retrieves rooms associated with a professor.
POST /reports: Fetches reports and analytics for a specific room.
POST /feedbacks: Retrieves feedback details for a specific room.

## Installation

### Prerequisites
Node.js (version 14 or later)
Express.Js
AWS account with access to S3, Textract, Comprehend, DynamoDB, and Lambda services
OpenAI API key

### Setup
Clone the repository:
```
git clone https://github.com/your-username/evis-backend.git
cd evis-backend
```

### Install dependencies:
```npm install```
Configure environment variables:
Create a .env file in the root directory and add the following environment variables:
```
env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
OPENAI_API_KEY=your-openai-api-key
```

### Run the server:
```
npm start
```
The server will start on http://localhost:3000.

### Deployment
For deployment, ensure that your AWS credentials and environment variables are properly configured in your production environment. You can deploy the backend on any Node.js-compatible hosting platform, such as AWS Elastic Beanstalk or Heroku.


### Future Enhancements
Voice Recordings Integration: The current implementation of EVIS focuses on capturing lecture slides. A future enhancement will include the integration of voice recordings, allowing the system to analyze and generate content based on both visual and audio inputs. This will further enhance the ability to generate quizzes and feedback in real-time.


### Contribution
Feel free to contribute to the project by forking the repository, making changes, and submitting a pull request. Please ensure your code follows the existing style and includes appropriate tests.

### License
This project is licensed under the MIT License.
