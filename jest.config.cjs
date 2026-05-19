module.exports = {
  roots: ["<rootDir>"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": "<rootDir>/jest.transform.cjs",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
