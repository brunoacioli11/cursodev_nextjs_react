import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(password + process.env.PASSWORD_PEPPER, rounds);
}

function getNumberOfRounds() {
  let rounds = 1;
  if (process.env.NODE_ENV === "production") {
    rounds = 14;
  }

  return rounds;
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(
    providedPassword + process.env.PASSWORD_PEPPER,
    storedPassword,
  );
}

const password = {
  hash,
  compare,
};

export default password;
