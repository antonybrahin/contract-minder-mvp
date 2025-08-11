/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};


