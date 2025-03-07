module.exports = {
    testEnvironment: "node",  // Sets the test environment to Node.js
    transform: {
      "^.+\\.js$": "babel-jest",  // If you're using Babel for JavaScript files
    },
    verbose: true,  // Optional: Display individual test results with the test suite
  };