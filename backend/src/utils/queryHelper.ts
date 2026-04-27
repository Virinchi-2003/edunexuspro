/**
 * Normalizes values from req.query or req.params to a single string.
 * If the value is an array, it returns the first element.
 * If the value is undefined or null, it returns an empty string or a default.
 */
export const getSingleValue = (value: any, defaultValue: string = ''): string => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (Array.isArray(value)) {
    return value[0] ? String(value[0]) : defaultValue;
  }
  return String(value);
};
