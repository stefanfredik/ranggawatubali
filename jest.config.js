export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  testMatch: ['**/server/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'server/**/*.ts',
    '!server/tests/**/*.ts',
    '!server/index.ts',
    '!server/vite.ts'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};