/**
 * HabitForge End-to-End Integration Test
 * 
 * Runs an in-memory MongoDB, starts the backend, tests every endpoint.
 * Usage: npx ts-node tests/e2e.ts
 */
const { MongoMemoryServer } = require("mongodb-memory-server");
const { spawn } = require("child_process");
const path = require("path");

const PORT = 5099;
const BASE = `http://localhost:${PORT}/api`;

let serverProcess;
let serverOutput = "";
let results = [];
let accessToken = "";
let refreshToken = "";
let userId = "";
let habitId = "";
let taskId = "";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function req(method, urlPath, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${BASE}${urlPath}`;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json };
  } catch (err) {
    // Server may have crashed - wait and check
    await sleep(500);
    throw new Error(`fetch ${method} ${urlPath} failed: ${err.cause?.code || err.message}\nServer output (last 1500 chars):\n${serverOutput.slice(-1500)}`);
  }
}

function test(name, passed, details) {
  results.push({ name, status: passed ? "PASS" : "FAIL", details });
  const icon = passed ? "✓" : "✗";
  const extra = !passed && details ? ` — ${details}` : "";
  console.log(`  ${icon} ${name}${extra}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(maxWait = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.status === 200) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

async function testHealth() {
  console.log("\n══ HEALTH ══");
  const r = await req("GET", "/health");
  test("GET /health returns 200", r.status === 200, `Got ${r.status}`);
  test("Health: mongo up", r.body?.data?.mongo === "up", `Got: ${r.body?.data?.mongo}`);
}

async function testAuthRegister() {
  console.log("\n══ AUTH: REGISTER ══");

  const invalid = await req("POST", "/auth/register", { email: "bad" });
  test("Rejects invalid payload (422)", invalid.status === 422, `Got ${invalid.status}`);

  const weakPw = await req("POST", "/auth/register", {
    firstName: "Test", lastName: "User", email: "test@test.com",
    password: "weak", age: 25, gender: "male"
  });
  test("Rejects weak password (422)", weakPw.status === 422, `Got ${weakPw.status}`);

  const good = await req("POST", "/auth/register", {
    firstName: "Test", lastName: "User", email: "testuser@example.com",
    password: "SecurePass123!", age: 25, gender: "male",
    dateOfBirth: null, timezone: "UTC"
  });
  test("Succeeds with valid payload (201)", good.status === 201, `Got ${good.status}: ${good.body?.error?.message || good.body?.message || ""}`);
  test("Returns user id", !!good.body?.data?.id, `Data: ${JSON.stringify(good.body?.data)}`);
  if (good.body?.data?.id) userId = good.body.data.id;

  const dupe = await req("POST", "/auth/register", {
    firstName: "Test", lastName: "User", email: "testuser@example.com",
    password: "SecurePass123!", age: 25, gender: "male",
    dateOfBirth: null, timezone: "UTC"
  });
  test("Rejects duplicate email (409)", dupe.status === 409, `Got ${dupe.status}`);
}

async function testAuthLogin() {
  console.log("\n══ AUTH: LOGIN ══");

  const bad = await req("POST", "/auth/login", { email: "testuser@example.com", password: "WrongPass1!" });
  test("Rejects wrong password (401)", bad.status === 401, `Got ${bad.status}`);

  const noUser = await req("POST", "/auth/login", { email: "ghost@example.com", password: "Test1234!" });
  test("Rejects non-existent user (401)", noUser.status === 401, `Got ${noUser.status}`);

  const good = await req("POST", "/auth/login", { email: "testuser@example.com", password: "SecurePass123!" });
  test("Succeeds with correct credentials (200)", good.status === 200, `Got ${good.status}: ${good.body?.error?.message || ""}`);
  test("Returns user object", !!good.body?.data?.user, `No user in response`);
  test("Returns accessToken", !!good.body?.data?.tokens?.accessToken, `No accessToken`);
  test("Returns refreshToken", !!good.body?.data?.tokens?.refreshToken, `No refreshToken`);
  test("User has expected fields", !!good.body?.data?.user?.email && !!good.body?.data?.user?.firstName, `Missing user fields`);

  if (good.body?.data?.tokens) {
    accessToken = good.body.data.tokens.accessToken;
    refreshToken = good.body.data.tokens.refreshToken;
  }
  if (good.body?.data?.user?._id) userId = good.body.data.user._id;
}

async function testAuthMe() {
  console.log("\n══ AUTH: GET ME ══");

  const noAuth = await req("GET", "/auth/me");
  test("Rejects without token (401)", noAuth.status === 401, `Got ${noAuth.status}`);

  const good = await req("GET", "/auth/me", undefined, accessToken);
  test("Returns user with valid token (200)", good.status === 200, `Got ${good.status}`);
  test("User has email field", !!good.body?.data?.email, `Missing email`);
  test("User has username field", !!good.body?.data?.username, `Missing username`);
}

async function testAuthRefresh() {
  console.log("\n══ AUTH: REFRESH ══");

  const bad = await req("POST", "/auth/refresh", { refreshToken: "invalid-garbage" });
  test("Rejects invalid refresh token", bad.status === 401 || bad.status === 403, `Got ${bad.status}`);

  const good = await req("POST", "/auth/refresh", { refreshToken });
  test("Returns new tokens (200)", good.status === 200, `Got ${good.status}: ${good.body?.error?.message || ""}`);
  test("Returns new accessToken", !!good.body?.data?.accessToken, `No accessToken`);

  if (good.body?.data?.accessToken) {
    accessToken = good.body.data.accessToken;
    refreshToken = good.body.data.refreshToken || refreshToken;
  }
}

async function testHabitsCRUD() {
  console.log("\n══ HABITS: CRUD ══");

  // Auth required
  const noAuth = await req("GET", "/habits");
  test("List: requires auth (401)", noAuth.status === 401, `Got ${noAuth.status}`);

  // Create
  const create = await req("POST", "/habits", {
    name: "Morning Run", goal: 1, icon: "run", unit: "session",
    category: "Fitness", color: "#22d3ee"
  }, accessToken);
  test("Create: returns 201", create.status === 201, `Got ${create.status}: ${create.body?.error?.message || ""}`);

  habitId = create.body?.data?.habit?._id || create.body?.data?._id || "";
  test("Create: returns valid _id", !!habitId, `No _id`);

  // Validation
  const empty = await req("POST", "/habits", {}, accessToken);
  test("Create: rejects empty body (422)", empty.status === 422, `Got ${empty.status}`);

  // List
  const list = await req("GET", "/habits", undefined, accessToken);
  test("List: returns 200", list.status === 200, `Got ${list.status}`);
  test("List: returns array", Array.isArray(list.body?.data), `Not array`);
  test("List: contains created habit", list.body?.data?.length >= 1, `Empty`);

  // Get by ID
  if (habitId) {
    const get = await req("GET", `/habits/${habitId}`, undefined, accessToken);
    test("Get by ID: returns 200", get.status === 200, `Got ${get.status}`);
  }

  // Update
  if (habitId) {
    const update = await req("PATCH", `/habits/${habitId}`, { name: "Evening Run", goal: 2 }, accessToken);
    test("Update: returns 200", update.status === 200, `Got ${update.status}: ${update.body?.error?.message || ""}`);
    test("Update: name changed", update.body?.data?.name === "Evening Run", `Got: ${update.body?.data?.name}`);
  }

  // Log
  if (habitId) {
    const today = new Date().toISOString().split("T")[0];
    const log = await req("POST", `/habits/${habitId}/log`, { date: today, value: 2 }, accessToken);
    test("Log: returns 201", log.status === 201, `Got ${log.status}: ${log.body?.error?.message || ""}`);
    test("Log: returns data", !!log.body?.data, `No data`);
  }

  // Get logs
  if (habitId) {
    const today = new Date().toISOString().split("T")[0];
    const logs = await req("GET", `/habits/${habitId}/logs?from=${today}&to=${today}`, undefined, accessToken);
    test("Get logs: returns 200", logs.status === 200, `Got ${logs.status}`);
    test("Get logs: returns array", Array.isArray(logs.body?.data), `Not array`);
    test("Get logs: has entries", logs.body?.data?.length >= 1, `Empty`);
  }

  // Delete log
  if (habitId) {
    const today = new Date().toISOString().split("T")[0];
    const del = await req("DELETE", `/habits/${habitId}/log/${today}`, undefined, accessToken);
    test("Delete log: returns 200", del.status === 200, `Got ${del.status}`);
  }

  // Summary
  const summary = await req("GET", "/habits/summary", undefined, accessToken);
  test("Summary: returns 200", summary.status === 200, `Got ${summary.status}`);

  // Matrix
  const now = new Date();
  const matrix = await req("GET", `/habits/matrix?year=${now.getFullYear()}&month=${now.getMonth()}`, undefined, accessToken);
  test("Matrix: returns 200", matrix.status === 200, `Got ${matrix.status}`);

  // Presets
  const presets = await req("GET", "/habits/presets", undefined, accessToken);
  test("Presets: returns 200", presets.status === 200, `Got ${presets.status}`);

  // Analytics
  if (habitId) {
    const analytics = await req("GET", `/habits/${habitId}/analytics`, undefined, accessToken);
    test("Analytics: returns 200", analytics.status === 200, `Got ${analytics.status}`);
  }

  // Archive (delete)
  if (habitId) {
    const archive = await req("DELETE", `/habits/${habitId}`, undefined, accessToken);
    test("Archive: returns 200", archive.status === 200, `Got ${archive.status}`);

    const archived = await req("GET", "/habits/archived", undefined, accessToken);
    test("Archived list: has item", archived.body?.data?.length >= 1, `Empty`);

    // Restore
    const restore = await req("POST", `/habits/${habitId}/restore`, undefined, accessToken);
    test("Restore: returns 200", restore.status === 200, `Got ${restore.status}`);
  }
}

async function testTasksCRUD() {
  console.log("\n══ TASKS: CRUD ══");

  const today = new Date().toISOString().split("T")[0];

  // Create
  const create = await req("POST", "/tasks", {
    title: "Buy protein powder", notes: "Whey isolate", due: today, priority: "high"
  }, accessToken);
  test("Create: returns 201", create.status === 201, `Got ${create.status}: ${create.body?.error?.message || ""}`);

  taskId = create.body?.data?._id || "";
  test("Create: returns _id", !!taskId, `No _id`);

  // Validation
  const noTitle = await req("POST", "/tasks", { notes: "no title" }, accessToken);
  test("Create: rejects missing title (422)", noTitle.status === 422, `Got ${noTitle.status}`);

  // List
  const list = await req("GET", "/tasks", undefined, accessToken);
  test("List: returns 200", list.status === 200, `Got ${list.status}`);
  test("List: returns array", Array.isArray(list.body?.data), `Not array`);

  // Filter
  const open = await req("GET", "/tasks?status=open", undefined, accessToken);
  test("List (status=open): returns 200", open.status === 200, `Got ${open.status}`);

  // Summary
  const summary = await req("GET", "/tasks/summary", undefined, accessToken);
  test("Summary: returns 200", summary.status === 200, `Got ${summary.status}`);
  test("Summary: has open count", typeof summary.body?.data?.open === "number", `No open count`);

  // Update
  if (taskId) {
    const update = await req("PATCH", `/tasks/${taskId}`, { title: "Buy creatine", priority: "medium" }, accessToken);
    test("Update: returns 200", update.status === 200, `Got ${update.status}`);
    test("Update: title changed", update.body?.data?.title === "Buy creatine", `Got: ${update.body?.data?.title}`);
  }

  // Toggle
  if (taskId) {
    const t1 = await req("PATCH", `/tasks/${taskId}/toggle`, undefined, accessToken);
    test("Toggle: returns 200", t1.status === 200, `Got ${t1.status}`);
    test("Toggle: done=true", t1.body?.data?.done === true, `Got: ${t1.body?.data?.done}`);

    const t2 = await req("PATCH", `/tasks/${taskId}/toggle`, undefined, accessToken);
    test("Toggle back: done=false", t2.body?.data?.done === false, `Got: ${t2.body?.data?.done}`);
  }

  // Delete
  if (taskId) {
    const del = await req("DELETE", `/tasks/${taskId}`, undefined, accessToken);
    test("Delete: returns 200", del.status === 200, `Got ${del.status}`);

    const list2 = await req("GET", "/tasks", undefined, accessToken);
    const found = (list2.body?.data || []).find((t) => t._id === taskId);
    test("Delete: removed from list", !found, `Still present`);
  }
}

async function testUserProfile() {
  console.log("\n══ USER PROFILE ══");

  const me = await req("GET", "/users/me", undefined, accessToken);
  test("GET /users/me: returns 200", me.status === 200, `Got ${me.status}`);
  test("Has username", !!me.body?.data?.username, `No username`);
  test("Has email", !!me.body?.data?.email, `No email`);

  const update = await req("PATCH", "/users/me", { bio: "Test bio", timezone: "America/New_York" }, accessToken);
  test("PATCH /users/me: returns 200", update.status === 200, `Got ${update.status}: ${update.body?.error?.message || ""}`);
  test("Bio updated", update.body?.data?.bio === "Test bio", `Got: ${update.body?.data?.bio}`);

  // Verify persistence
  const me2 = await req("GET", "/users/me", undefined, accessToken);
  test("Bio persisted on re-fetch", me2.body?.data?.bio === "Test bio", `Got: ${me2.body?.data?.bio}`);

  // Search
  const search = await req("GET", "/users/search?q=test", undefined, accessToken);
  test("User search: returns 200", search.status === 200, `Got ${search.status}`);
}

async function testDataPersistence() {
  console.log("\n══ DATA PERSISTENCE (Page Refresh Simulation) ══");

  // Create habit
  const h = await req("POST", "/habits", { name: "Persist Habit", goal: 5, unit: "reps" }, accessToken);
  const hid = h.body?.data?.habit?._id || h.body?.data?._id;

  // Simulate refresh
  const habits = await req("GET", "/habits", undefined, accessToken);
  const foundH = (habits.body?.data || []).find((x) => x._id === hid);
  test("Habit persists after refresh", !!foundH, `Not found`);

  // Create task
  const t = await req("POST", "/tasks", { title: "Persist Task" }, accessToken);
  const tid = t.body?.data?._id;

  const tasks = await req("GET", "/tasks", undefined, accessToken);
  const foundT = (tasks.body?.data || []).find((x) => x._id === tid);
  test("Task persists after refresh", !!foundT, `Not found (create status=${t.status}, tid=${tid}, list count=${tasks.body?.data?.length})`);

  // Profile
  await req("PATCH", "/users/me", { bio: "Persist check" }, accessToken);
  const profile = await req("GET", "/users/me", undefined, accessToken);
  test("Profile persists after refresh", profile.body?.data?.bio === "Persist check", `Got: ${profile.body?.data?.bio}`);
}

async function testFrontendRouteMapping() {
  console.log("\n══ FRONTEND-BACKEND ROUTE MAPPING ══");

  const routes = [
    ["GET", "/auth/me", "authApi.getMe()", true],
    ["GET", "/habits", "habitsApi.list()", true],
    ["GET", "/habits/summary", "habitsApi.getSummary()", true],
    ["GET", "/habits/presets", "habitsApi.getPresets()", true],
    ["GET", "/habits/matrix?year=2026&month=6", "habitsApi.getMatrix()", true],
    ["GET", "/habits/archived", "habitsApi.getArchived()", true],
    ["GET", "/tasks", "tasksApi.list()", true],
    ["GET", "/tasks/summary", "tasksApi.getSummary()", true],
    ["GET", "/users/me", "usersApi.getMe()", true],
    ["GET", "/users/search?q=a", "usersApi.search()", true],
    ["POST", "/auth/logout", "authApi.logout()", false],  // don't send token (would blacklist it)
  ];

  for (const [method, path, frontend, useAuth] of routes) {
    const r = await req(method, path, undefined, useAuth ? accessToken : undefined);
    // Route exists if we don't get 404 (401 means route exists but requires auth)
    test(`${frontend} → ${method} ${path.split("?")[0]}: connected`, r.status !== 404, `Got 404 (route missing)`);
  }
}

async function testEdgeCases() {
  console.log("\n══ EDGE CASES ══");

  const notFound = await req("GET", "/nonexistent", undefined, accessToken);
  test("Non-existent route: 404", notFound.status === 404, `Got ${notFound.status}`);

  const badId = await req("GET", "/habits/not-valid-id", undefined, accessToken);
  test("Invalid ObjectId: not 500", badId.status !== 500, `Got ${badId.status} (server error)`);

  const noHabit = await req("GET", "/habits/507f1f77bcf86cd799439011", undefined, accessToken);
  test("Non-existent habit: 404", noHabit.status === 404, `Got ${noHabit.status}`);
}

async function testAuthLogout() {
  console.log("\n══ AUTH: LOGOUT ══");

  const logout = await req("POST", "/auth/logout", undefined, accessToken);
  test("Logout: returns 200", logout.status === 200, `Got ${logout.status}`);

  const after = await req("GET", "/auth/me", undefined, accessToken);
  test("Post-logout: token blacklisted (401)", after.status === 401, `Got ${after.status}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  HabitForge E2E Integration Test Suite                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Start in-memory MongoDB
  console.log("\n⏳ Starting in-memory MongoDB...");
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  console.log(`  URI: ${mongoUri}`);

  // Store for mongoose direct access in tests
  process.env.TEST_MONGO_URI = mongoUri;

  // Start backend as child process
  console.log("⏳ Starting backend server...");
  const serverEnv = {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(PORT),
    MONGODB_URI: mongoUri,
    REDIS_URL: "redis://localhost:6379",
    JWT_ACCESS_SECRET: "test_access_secret_minimum_32_chars_long_123",
    JWT_REFRESH_SECRET: "test_refresh_secret_minimum_32_chars_long_456",
    SMTP_HOST: "smtp.test.local",
    SMTP_PORT: "587",
    SMTP_USER: "testuser",
    SMTP_PASS: "testpass",
    EMAIL_FROM: "test@habitforge.app",
    APP_URL: `http://localhost:${PORT}`,
    CLIENT_URL: "http://localhost:3000",
  };

  serverProcess = spawn(
    "npx", ["ts-node", "--transpile-only", "src/server.ts"],
    { cwd: path.resolve(__dirname, ".."), env: serverEnv, shell: true, stdio: "pipe" }
  );

  serverProcess.stdout.on("data", (d) => { serverOutput += d.toString(); });
  serverProcess.stderr.on("data", (d) => { serverOutput += d.toString(); });
  serverProcess.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`\n⚠️  Server exited unexpectedly: code=${code} signal=${signal}`);
      console.error("Last server output:\n" + serverOutput.slice(-2000));
    }
  });

  // Wait for server to be ready
  console.log("⏳ Waiting for server to be ready...");
  const ready = await waitForServer(30000);
  if (!ready) {
    console.error("❌ Server failed to start within 30s");
    console.error("Server output:", serverOutput);
    serverProcess.kill();
    await mongod.stop();
    process.exit(1);
  }
  console.log("✓ Server ready!\n");

  // Run tests
  try {
    await testHealth();
    await testAuthRegister();
    await testAuthLogin();
    await testAuthMe();
    await testAuthRefresh();
    await testHabitsCRUD();
    await testTasksCRUD();
    await testUserProfile();
    await testDataPersistence();
    await testFrontendRouteMapping();
    await testEdgeCases();
    await testAuthLogout();
  } catch (err) {
    console.error("\n❌ RUNNER ERROR:", err);
  }

  // Summary
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const total = results.length;

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log(`║  RESULTS: ${passed}/${total} PASSED, ${failed} FAILED${" ".repeat(Math.max(0, 30 - String(passed).length - String(total).length - String(failed).length))}║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  if (failed > 0) {
    console.log("\n❌ FAILURES:");
    results.filter((r) => r.status === "FAIL").forEach((r) => {
      console.log(`  • ${r.name}`);
      if (r.details) console.log(`    → ${r.details}`);
    });
  }

  // Cleanup
  serverProcess.kill();
  await mongod.stop();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
