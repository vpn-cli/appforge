// Shared database test environment setup
// SAFETY GUARD ALLOWLIST: Database tests are strictly permitted to run ONLY against the dedicated TEST project.
const testUrl = process.env.TEST_SUPABASE_URL || "";

if (!testUrl.includes("dvkmkubcplroecqkfjuf")) {
  throw new Error(
    `SAFETY GUARD VIOLATION: Database tests are strictly locked to the dedicated TEST project. TEST_SUPABASE_URL must contain 'dvkmkubcplroecqkfjuf'. Got: '${testUrl || "(empty)"}'. Aborting test execution.`
  );
}
