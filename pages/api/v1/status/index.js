export default function status(request, response) {
  response.status(200).json({ "message": "Alunos do curso.dev são pessoas acima da média"});
}