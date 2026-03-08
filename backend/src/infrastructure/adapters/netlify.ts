import { buildServer } from '../../app/http/server';

let app: ReturnType<typeof buildServer> | null = null;

export async function handler(event: any, context: any) {
  if (!app) {
    app = buildServer();
    await app.ready();
  }
  // Map Netlify event to Fastify request
  const { httpMethod, path, headers, body, queryStringParameters, isBase64Encoded } = event;
  const payload = isBase64Encoded && body ? Buffer.from(body, 'base64').toString('utf8') : body;

  const response = await app.inject({
    method: httpMethod,
    url: path + (queryStringParameters ? `?${new URLSearchParams(queryStringParameters).toString()}` : ''),
    headers,
    payload,
  });

  return {
    statusCode: response.statusCode,
    headers: Object.fromEntries(Object.entries(response.headers)),
    body: response.payload,
  };
}
