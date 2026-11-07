export const MAX_GRADING_BODY_BYTES = 16 * 1024;

export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      ...headers,
    },
  });
}
