const nextJest = require("next/jest");
module.exports = nextJest({ dir: "./" })({
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
});
