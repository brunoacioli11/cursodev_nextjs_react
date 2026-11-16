import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "@/tests/orchestrator.js";
import session from "@/models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE to /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionCreated = await orchestrator.createSession(createdUser.id);

      const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toBe(200);

      /*const cacheControl = response.headers.get("Cache-Control");

      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );*/

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      // Double check assertions
      const doubleCheckResponse = await fetch(
        `http://localhost:3000/api/v1/user`,
        {
          headers: {
            Cookie: `session_id=${sessionCreated.token}`,
          },
        },
      );

      expect(doubleCheckResponse.status).toBe(401);
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "ed0e869edbfc8ad4408924b68c50201c3a2f8f0665cbd4d0c787bd578e24fad602b2bca0e5d0dcfe5ebe8a51c48e2fd";
      const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
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
      const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
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
