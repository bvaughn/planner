export function getBaseURL() {
  let protocol = null;
  if (typeof window !== "undefined") {
    protocol = window.location.protocol;
  } else if (process.env.ENV_PROTOCOL) {
    protocol = process.env.ENV_PROTOCOL;
  } else {
    protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  }

  const NEXT_PUBLIC_VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL;
  const URL = `${protocol}://${NEXT_PUBLIC_VERCEL_URL}`;

  return URL;
}

export function openInNewTab(url) {
  const anchor = document.createElement("a");
  anchor.target = "_blank";
  anchor.href = url;
  anchor.click();
}

export function parse(string) {
  return JSON.parse(atob(string));
}

export function stringify(data) {
  return btoa(JSON.stringify(data));
}
