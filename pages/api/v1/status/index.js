import database from "infra/database";

export default async function status(request, response) {
  const databaseVersion = await database.query("SHOW server_version;");
  const maxConnections = await database.query("SHOW max_connections;");
  const openedConnections = await database.query('SELECT COUNT(*)::int FROM pg_stat_activity where datname = \'local_db\';');
  
  const updatedAt = new Date().toISOString();

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersion.rows[0].server_version,
        max_connections: parseInt(maxConnections.rows[0].max_connections),
        opened_connections: openedConnections.rows[0].count,
      }
    }
  });
}