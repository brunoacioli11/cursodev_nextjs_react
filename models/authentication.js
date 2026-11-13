import user from "@/models/user";
import password from "@/models/password";

import { NotFoundError, UnauthorizedError } from "@/infra/errors";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await getUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Authentication failed",
        action: "Check if the data sent is correct.",
      });
    }
    throw error;
  }
}

async function getUserByEmail(providedEmail) {
  try {
    const storedUser = await user.findOneByEmail(providedEmail);
    return storedUser;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnauthorizedError({
        message: "Wrong email",
        action: "Check if the email is correct",
      });
    }
    throw error;
  }
}

async function validatePassword(providedPassword, storedPassword) {
  const correctPasswordMatch = await password.compare(
    providedPassword,
    storedPassword,
  );
  if (!correctPasswordMatch) {
    throw new UnauthorizedError({
      message: "Wrong password",
      action: "Check if password is correct.",
    });
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
