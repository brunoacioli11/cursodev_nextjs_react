import database from "infra/database";

export default async function status(request, response) {
  const result = await database.query("SELECT 1 + 1 as sum;");
  console.log("oi");
  console.log(result.rows[0].sum);
  response.status(200).json({ "message": "Alunos do curso.dev são pessoas acima da média" });
}