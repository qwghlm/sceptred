module.exports = {

    // "verbose": true,

    "moduleFileExtensions": ["ts", "tsx", "js", "jsx"],
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },

    "collectCoverage": true,
    "collectCoverageFrom": [
      // "src/js/*.ts",
      "src/js/lib/*.ts"
    ],
    "coverageDirectory": "./coverage",
    "coverageReporters": [
      "html",
      "text"
    ],

    "moduleNameMapper": {
      "\\.(css|scss|gif|jpe?g|png|svg)$": "identity-obj-proxy"
    },

};
