const serverless = require("serverless-http");

const handler = async (event, context) => {
  const { default: app } = await import("../../server/app.js");
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};

module.exports = { handler };
