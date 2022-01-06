const config = {
  expect: {
    toMatchSnapshot: {
      // Account for minor difference in e.g. text rendering and resolution
      // between headless and in-browser tests.
      threshold: 0.5,
    },
  },

  reporter: 'html',
  use: {
    // Uncomment for easier local debugging
    // headless: false,
    // launchOptions: {
    //   slowMo: 1000,
    // },

    browserName: 'chromium',

    viewport: {
      width: 1024,
      height: 800,
    }
  },
};

module.exports = config;
