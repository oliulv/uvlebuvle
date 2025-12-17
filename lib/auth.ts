export const PASSCODE = "7033";
export const COOKIE_NAME = "family-auth";
export const COOKIE_VALUE = "valid";

export function isValidPasscode(input: string): boolean {
  return input === PASSCODE;
}
