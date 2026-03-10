import serverless from "serverless-http";

export const handler = async (event, context) => {
  const { default: app } = await import("../../server/app.js");
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};
