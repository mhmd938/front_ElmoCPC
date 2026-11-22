// src/services/mock/helpers.ts
//
// Small helpers shared by all mock services.

/** Simulate network latency so loading states / skeletons are exercisable. */
export const delay = (ms = 400): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Expose the backend error body both directly and under response.data. */
export const mockError = (status: number, body: Record<string, unknown>): never => {
  const data = { ...body, status, data: null };
  throw Object.assign(new Error(String(body.message ?? "Mock request failed")), data, {
    response: { status, data },
  });
};
