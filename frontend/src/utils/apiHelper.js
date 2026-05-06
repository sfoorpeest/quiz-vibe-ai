export const unwrapData = (response, action = 'Request') => {
  const payload = response.data;

  if (!payload || payload.success === false) {
    throw new Error(payload?.message || `${action} failed`);
  }

  return payload.data;
};
