// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      user?: {
        userId: string;
        email: string;
        roles: string[];
        superAdmin?: boolean;
        provider: string;
        tenantId?: string;
        displayName?: string;
        createdAt: string;
        lastSeenAt: string;
        impersonating?: boolean;
        impersonatedBy?: string;
      } | null;
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}
export {};
