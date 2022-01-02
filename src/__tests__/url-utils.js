const { stringify } = require("jsurl2");

function getUrlForData(data) {
  let stringified = stringify(data);

  // Nested apostrophes cause "jsurl2" to throw a parsing error:
  //   Error: Illegal escape code.
  // For now, we have to manually escape them.
  stringified = stringified.replace(/\*"/g, "%27");

  return `http://localhost:3000/?${stringified}`;
}

module.exports = {
  getUrlForData,
};
