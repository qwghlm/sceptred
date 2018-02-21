module.exports = {

    "verbose": true,
    "collectCoverage": true,
    "collectCoverageFrom": [
      // "src/js/*.js",
      "src/js/lib/*.js"
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
