/**
 * Identifies sandbox demo routes and transient template/mock IDs that should never write to persistent storage.
 */
export function isSandboxAppId(appId: string): boolean {
  return appId === "demo" || appId.startsWith("template-") || appId.startsWith("mock-");
}
