const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const accessLogStream = fs.createWriteStream(path.join(__dirname, '../log', "access.log"), { flags: "a" });
const errorLogStream = fs.createWriteStream(path.join(__dirname, '../log', "error.log"), { flags: "a" });

const logFormat = ":remote-addr - :method :url :status :res[content-length] - :response-time ms";

// Success log middleware (status < 400)
const accessLogger = morgan(logFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: accessLogStream,
});

// Error log middleware (status >= 400)
const errorLogger = morgan(logFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: errorLogStream,
});

module.exports = {
  accessLogger,
  errorLogger,
};
