import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "@/tests/orchestrator.js";
import session from "@/models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const userCreated = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionCreated = await orchestrator.createSession(userCreated.id);

      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");

      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: userCreated.id,
        username: userCreated.username,
        email: userCreated.email,
        password: userCreated.password,
        features: ["read:activation_token"],
        created_at: userCreated.created_at.toISOString(),
        updated_at: userCreated.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(
        sessionCreated.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionCreated.expires_at,
      ).toEqual(true);

      expect(
        renewedSessionObject.updated_at > sessionCreated.updated_at,
      ).toEqual(true);

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionCreated.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With valid session about to expire", async () => {
      // Set FakeTimer to 1 minute before expiration
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS + 60000),
      });

      const userCreated = await orchestrator.createUser({
        username: "UserAboutToExpire",
      });

      const sessionCreated = await orchestrator.createSession(userCreated.id);

      jest.useRealTimers();
      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toBe(200);

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionCreated.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });

      const renewedSessionObject = await session.findOneValidByToken(
        sessionCreated.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionCreated.expires_at,
      ).toEqual(true);

      expect(
        renewedSessionObject.updated_at > sessionCreated.updated_at,
      ).toEqual(true);
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "ed0e869edbfc8ad4408924b68c50201c3a2f8f0665cbd4d0c787bd578e24fad602b2bca0e5d0dcfe5ebe8a51c48e2fd";
      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "User doesn't have an active session",
        action: "Check if user is logged in and try again",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - 2 * session.EXPIRATION_IN_MILLISECONDS),
      });

      const userCreated = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const sessionCreated = await orchestrator.createSession(userCreated.id);

      jest.useRealTimers();
      const response = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "User doesn't have an active session",
        action: "Check if user is logged in and try again",
        status_code: 401,
      });
    });
  });
});
