import { Credentials } from '../utils/credentialManager';

declare global {
  var mockCredentials: Credentials;
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithMatch(...args: any[]): R;
    }
  }
}

export {};
