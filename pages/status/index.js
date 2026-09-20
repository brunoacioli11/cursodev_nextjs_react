import useSWR from "swr";
async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const { data, error, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  let body = <h1>Loading...</h1>;

  if (!isLoading && error) body = <div>Error fetching Status</div>;
  if (!isLoading && data) {
    body = (
      <>
        <h1>Status</h1>
        <UpdatedAt data={data} />
        <DatabaseStatus data={data} />
      </>
    );
  }
  return body;
}

function UpdatedAt({ data }) {
  if (!data) return null;

  const updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");

  return <div>Last update: {updatedAtText}</div>;
}

function DatabaseStatus({ data }) {
  if (!data) return null;

  const database = data.dependencies.database;

  return (
    <>
      <h2>Database</h2>
      <div>
        {Object.entries(database).map(([key, value]) => (
          <div key={key}>
            {key}: {value}
          </div>
        ))}
      </div>
    </>
  );
}
