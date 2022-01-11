export function getBaseUrl() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development";

  return {
    production: `https://${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}`,
    development: `http://localhost:3000`,
    preview: `https://${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}`,
  }[environment];
}

export function parse(string) {
  return JSON.parse(atob(string));
}

export function stringify(data) {
  return btoa(JSON.stringify(data));
}
