/**
 * Parses a string representation of time (e.g., "15m", "7d", "1h") into seconds.
 *
 * @param expiryString - The expiry string to parse.
 * @returns The number of seconds.
 */
export const parseExpiryToSeconds = (expiryString) => {
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1), 10);
    if (isNaN(value)) {
        throw new Error(`Invalid expiry string: ${expiryString}`);
    }
    let result;
    switch (unit) {
        case "s":
            result = value;
            break;
        case "m":
            result = value * 60;
            break;
        case "h":
            result = value * 3600;
            break;
        case "d":
            result = value * 86400;
            break;
        default:
            // If no unit is provided, assume it's already in seconds if it's a numeric string
            if (!isNaN(Number(expiryString))) {
                result = parseInt(expiryString, 10);
                break;
            }
            throw new Error(`Invalid expiry unit: ${unit} in ${expiryString}`);
    }
    if (result <= 0) {
        throw new Error(`Invalid expiry value: ${expiryString}. Expiry must result in a positive number of seconds.`);
    }
    return result;
};
