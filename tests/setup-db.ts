// Shared database test environment setup
// SAFETY GUARD ALLOWLIST: Database tests are strictly permitted to run ONLY against the dedicated TEST project.
const testUrl = process.env.TEST_SUPABASE_URL || "";

if (!testUrl.includes("dvkmkubcplroecqkfjuf")) {
  throw new Error(
    `SAFETY GUARD VIOLATION: Database tests are strictly locked to the dedicated TEST project. TEST_SUPABASE_URL must contain 'dvkmkubcplroecqkfjuf'. Got: '${testUrl || "(empty)"}'. Aborting test execution.`
  );
}

const testDbUrl = process.env.TEST_DATABASE_URL || "";

if (!testDbUrl) {
  throw new Error(
    "SAFETY GUARD VIOLATION: Missing required TEST_DATABASE_URL environment variable for database tests. Must fail loudly; no silent skips."
  );
}

if (!testDbUrl.includes("dvkmkubcplroecqkfjuf")) {
  throw new Error(
    `SAFETY GUARD VIOLATION: Database tests are strictly locked to the dedicated TEST project. TEST_DATABASE_URL must contain 'dvkmkubcplroecqkfjuf'. (value hidden: it contains a password). Aborting test execution.`
  );
}
