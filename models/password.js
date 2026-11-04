import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();

  if (process.env.PASSWORD_PEPPER) {
    password = password + process.env.PASSWORD_PEPPER;
  }

  return await bcryptjs.hash(password, rounds);
}

function getNumberOfRounds() {
  let rounds = 1;
  if (process.env.NODE_ENV === "production") {
    rounds = 14;
  }

  return rounds;
}

async function compare(providedPassword, storedPassword) {
  if (process.env.PASSWORD_PEPPER) {
    providedPassword = providedPassword + process.env.PASSWORD_PEPPER;
  }
  return await bcryptjs.compare(providedPassword, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
