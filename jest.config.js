module.exports = {

    // "verbose": true,

    "moduleFileExtensions": ["ts", "tsx", "js", "jsx"],
    "projects": ["<rootDir>/client/js"],
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },

    "collectCoverage": true,
    "collectCoverageFrom": [
      // "client/src/js/*.ts",
      "client/src/js/lib/*.ts"
    ],
    "coverageDirectory": "./client/coverage",
    "coverageReporters": [
      "text",
      "html",
      "lcovonly" // For codecov
    ],

    "moduleNameMapper": {
      "\\.(css|scss|gif|jpe?g|png|svg)$": "identity-obj-proxy"
    },

};
