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
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "samecaseuser",
          email: "samecaseuser@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response1Body = await response1.json();

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${response1Body.username}`,
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: response1Body.username,
        email: response1Body.email,
        password: "senha123",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });
    test("With exact case mismatch", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "differentCaseUser",
          email: "differentcaseuser@test.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response1Body = await response1.json();

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${response1Body.username.toLowerCase()}`,
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: response1Body.username,
        email: response1Body.email,
        password: "senha123",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
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
