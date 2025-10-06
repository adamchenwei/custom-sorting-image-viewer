module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },
};
