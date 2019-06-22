module.exports = {

    // "verbose": true,

    "moduleFileExtensions": ["ts", "tsx", "js", "jsx"],
    "projects": ["<rootDir>/client/js"],
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",

    "testURL": "http://localhost",

    "transform": {
      "^.+\\.tsx?$": "ts-jest",
      "^.+\\.js$": "babel-jest",
    },

    "globals": {
      "ts-jest": {
        "tsConfigFile": "tsconfig.test.json"
      }
    },

    "collectCoverage": true,
    "collectCoverageFrom": [
      "client/src/js/components/*.tsx",
      "client/src/js/lib/*.ts",
    ],
    "coveragePathIgnorePatterns" : [
      "node_modules",
      "map.tsx"
    ],
    "coverageDirectory": "./client/coverage",
    "coverageReporters": [
      "text",
      "html",
      "lcovonly" // For codecov
    ],

    "moduleNameMapper": {
      "\\.(css|scss|gif|jpe?g|png|svg)$": "identity-obj-proxy",
    },

};
