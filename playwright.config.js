const config = {
  use: {
    headless: false,
    browserName: 'chromium',
    launchOptions: {
      // This bit of delay gives async React time to render
      slowMo: 100,
    },
  },
};

module.exports = config;
