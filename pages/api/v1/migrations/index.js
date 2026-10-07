import { createRouter } from "next-connect";
import { runner as migrationRunner } from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  let dbClient;

  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner(
      getMigrationRunnerOptions(dbClient, true),
    );

    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient?.end();
  }
}

async function postHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migratedMigrations = await migrationRunner(
      getMigrationRunnerOptions(dbClient, false),
    );

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }
    return response.status(200).json(migratedMigrations);
  } finally {
    await dbClient?.end();
  }
}

function getMigrationRunnerOptions(dbClient, dryRun) {
  const defaultMigrationOptions = {
    databaseUrl: dbClient,
    dir: join("infra", "migrations"),
    direction: "up",
    migrationsTable: "teste",
    dryRun: dryRun,
    verbose: true,
  };

  return defaultMigrationOptions;
}
