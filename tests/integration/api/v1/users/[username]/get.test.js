import { version as uuidVersion } from "uuid";
import orchestrator from "@/tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const userCreated = await orchestrator.createUser({
        username: "samecaseuser",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userCreated.username}`,
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: userCreated.id,
        username: userCreated.username,
        email: userCreated.email,
        password: userCreated.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
    test("With exact case mismatch", async () => {
      const userCreated = await orchestrator.createUser({
        username: "differentCaseUser",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userCreated.username.toLowerCase()}`,
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: userCreated.id,
        username: userCreated.username,
        email: userCreated.email,
        password: userCreated.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With nonexistent username", async () => {
      const username = "nonexistentuser";

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
      );

      expect(response2.status).toBe(404);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "NotFoundError",
        message: "User not found.",
        action: "Check if username is right.",
        status_code: 404,
      });
    });
  });
});
