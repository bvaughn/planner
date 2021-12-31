function encodeDataForUrl(data) {
  const string = JSON.stringify(data);
  const encoded = Buffer.from(string).toString("base64");

  return encoded;
}

function getUrlForData(data) {
  const encoded = encodeDataForUrl(data);
  const url = `http://localhost:3000/?${encoded}`;

  return url;
}

module.exports = {
  encodeDataForUrl,
  getUrlForData,
};
