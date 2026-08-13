export function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function error(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function notImplemented(): Response {
  return error("Not implemented", 501);
}