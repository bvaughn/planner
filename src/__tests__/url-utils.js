const { stringify } = require("jsurl2");

function getUrlForData(data) {
  const stringified = stringify(data);

  return `http://localhost:3000/?${stringified}`;
}

module.exports = {
  getUrlForData,
};
