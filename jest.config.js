const nextJest = require("next/jest");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.development" });

const createJestConfig = nextJest();
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testTimeout: 60000,
});

module.exports = async () => {
  const config = await jestConfig();
  config.transformIgnorePatterns = [
    "/node_modules/(?!(node-pg-migrate|uuid)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return config;
};
