import btoa from "btoa";
import { createServer } from "http";
import { parse as decode } from "jsurl2";
import { parse } from "url";
import { stringify } from "../../components/utils/url";

export default async function handler(req, res) {
  const parsedUrl = parse(req.url, true);
  const { pathname, search } = parsedUrl;

  // Convert from the old format, which serialized data using "jsurl2"
  // to the new format which uses Base64
  const decoded = decode(search.substr(1));
  const encoded = btoa(JSON.stringify(decoded));

  res.writeHead(302, {
    Location: `/?${encoded}`,
  });
  res.end();
}
