const { stringify } = require("jsurl2");

const PUBLIC_URL = "http://localhost:3000";

function getUrlForData(data) {
  const stringified = stringify(data);

  return `${PUBLIC_URL}/?${stringified}`;
}

function getUrlForOgImage(data) {
  const stringified = stringify(data);

  return `${PUBLIC_URL}/api/ogimage/?${stringified}`;
}

module.exports = {
  getUrlForData,
  getUrlForOgImage,
};
