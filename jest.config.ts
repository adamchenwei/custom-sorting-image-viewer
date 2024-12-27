import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json'
    }]
  },
  moduleNameMapper: {
    // Handle module aliases (if you're using them in your Next.js project)
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },
  coverageProvider: "v8",
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/types.ts',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/api/**',
    '!app/**/layout.tsx',
    '!app/**/page.tsx',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
