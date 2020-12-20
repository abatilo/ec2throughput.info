module.exports = {
  serverRuntimeConfig: {
    apiHost: process.env.HEADSHOTS_API_HOST,
    slackClientID: process.env.HEADSHOTS_SLACK_CLIENT_ID,
    slackClientSecret: process.env.HEADSHOTS_SLACK_CLIENT_SECRET,
    jwtSecret: process.env.HEADSHOTS_JWT_SECRET,
  },
};
