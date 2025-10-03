// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      user?: {
        userId: string;
        email: string;
        createdAt: string;
        lastSeenAt: string;
      } | null;
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}
export {};
