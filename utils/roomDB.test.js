const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { createRoom, deleteRoom } = require("./roomDB.js");

// Mocking DynamoDBClient and its methods
jest.mock("@aws-sdk/client-dynamodb", () => {
  const originalModule = jest.requireActual("@aws-sdk/client-dynamodb");

  // Mock only the send method
  return {
    ...originalModule,
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (command instanceof originalModule.PutItemCommand) {
          // Simulate a successful insertion
          return Promise.resolve("Success");
        } else if (command instanceof originalModule.ScanCommand) {
          // Simulate a condition where no existing room is found
          return Promise.resolve({ Count: 0 });
        } else if (command instanceof originalModule.DeleteItemCommand) {
          // Simulate a successful deletion
          return Promise.resolve("Success");
        }
      }),
    })),
  };
});

describe('Room management functions', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    DynamoDBClient.mockClear();
  });

  it('should create a room successfully', async () => {
    const response = await createRoom("Test Room", "user@example.com");
    expect(response.success).toBeTruthy();
    expect(response.message).toBe("Room created successfully.");
    expect(response.roomId).toBeDefined();
  });

  it('should delete a room successfully', async () => {
    const roomId = "testRoomId";
    const response = await deleteRoom(roomId);
    expect(response.success).toBeTruthy();
    expect(response.message).toBe("Room deleted successfully.");
    expect(response.roomId).toBe(roomId);
  });
});
