import { createReadStream } from "fs";
import { createServer } from "http";
import { parse } from "url";
import { loadEnvConfig } from "@next/env";
import { launchChromium } from "playwright-aws-lambda";

const NEXT_PUBLIC_VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
const HOST = process.env.NODE_ENV === "development" ? "http" : "https";
const URL = `${HOST}://${NEXT_PUBLIC_VERCEL_URL}`;

let browserContext = null;

export default async function handler(req, res) {
  const parsedUrl = parse(req.url, true);
  const { pathname, search } = parsedUrl;

  if (browserContext === null) {
    // There's some overhead to creating a browser instance;
    // we can save that time by reusing browsers between requests.
    const browser = await launchChromium({ headless: true });
    browserContext = await browser.newContext({
      userAgent: "Googlebot",
      viewport: {
        width: 1200,
        height: 627,
      },
    });
  }

  // There's some overhead in creating a page as well,
  // but pages seem less safe to re-use.
  const page = await browserContext.newPage();

  const url = `${URL}/headless?${search.substr(1)}`;

  const [_, response] = await Promise.all([
    page.goto(url),
    page.waitForEvent("response", (response) => {
      return response.request().resourceType() === "document";
    }),
  ]);

  // TODO This fallback logic doesn't work because Next auto-wraps errors in 200 status pages.
  // Figure out how to disable this behavior in the future.
  // As it is, the server ends up waiting for a long time and eventually timing out.

  if (response.status() === 200) {
    const buffer = await page.locator("#ogImageContainer").screenshot();

    res.writeHead(200, { "Content-Type": "image/png" });
    res.write(buffer, "binary");
    res.end(null, "binary");
  } else {
    // If the chart didn't generate correctly for any reason, serve a default fallback og:image.
    res.writeHead(200, { "Content-Type": "image/png" });
    createReadStream("../static/og-image.png").pipe(res);
  }
}
