/**
 * Parses a string representation of time (e.g., "15m", "7d", "1h") into seconds.
 * 
 * @param expiryString - The expiry string to parse.
 * @returns The number of seconds.
 */
export const parseExpiryToSeconds = (expiryString: string): number => {
  const unit = expiryString.slice(-1);
  const value = parseInt(expiryString.slice(0, -1), 10);

  if (isNaN(value)) {
    throw new Error(`Invalid expiry string: ${expiryString}`);
  }

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      // If no unit is provided, assume it's already in seconds if it's a numeric string
      if (!isNaN(Number(expiryString))) {
        return parseInt(expiryString, 10);
      }
      throw new Error(`Invalid expiry unit: ${unit} in ${expiryString}`);
  }
};
