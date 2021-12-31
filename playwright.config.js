const config = {
  expect: {
    toMatchSnapshot: {
      // Account for minor difference in e.g. text rendering and resolution
      // between headless and in-browser tests.
      threshold: 0.75,
    },
  },

  use: {
    headless: true,
    browserName: 'chromium',
    launchOptions: {
      // This bit of delay gives async React time to render
      slowMo: 500,
    },
  },
};

module.exports = config;
