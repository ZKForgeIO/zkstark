/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Where your test files live
  testMatch: ['**/tests/**/*.test.ts', '**/__tests__/**/*.test.ts'],

  moduleFileExtensions: ['ts', 'js', 'json'],

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Optional but often useful in TS libs
  moduleNameMapper: {
    // If you ever use path aliases in tsconfig ("paths": {...}), map them here
    // '^@src/(.*)$': '<rootDir>/src/$1',
  },
};
