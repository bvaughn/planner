const btoa = require("btoa");

const PUBLIC_URL = "http://localhost:3000";

function getUrlForData(data, maxHeight = '') {
  const stringified = stringify(data);

  return `${PUBLIC_URL}/?data=${stringified}&maxHeight=${maxHeight}`;
}

function getUrlForOgImage(data) {
  const stringified = stringify(data);

  return `${PUBLIC_URL}/api/ogimage/?data=${stringified}`;
}

function stringify(data) {
  return btoa(JSON.stringify(data));
}

module.exports = {
  getUrlForData,
  getUrlForOgImage,
};
