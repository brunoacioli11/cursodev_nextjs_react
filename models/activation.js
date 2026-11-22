import email from "@/infra/email";
import database from "@/infra/database";
import webServer from "@/infra/webserver";
import { NotFoundError } from "@/infra/errors";
import user from "@/models/user";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000;
async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  const activationUrl = `${webServer.origin}/activate/${activationToken.id}`;

  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Activate your registration",
    text: `${user.username}, click on the link below to activate your account
    
    ${activationUrl}
    `,
  });
}

async function findOneValidById(tokenId) {
  const newToken = await runSelectQuery(tokenId);

  return newToken;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT
        1 
    ;`,
      values: [tokenId],
    });

    if (results.rowCount == 0) {
      throw new NotFoundError({
        message: "Token is not valid",
        action: "Register again",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(tokenId) {
  const usedActivationToken = await runUpdateQuery(tokenId);

  return usedActivationToken;

  async function runUpdateQuery(tokenId) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc',NOW()),
          updated_at = timezone('utc',NOW())
        WHERE
          id = $1
        RETURNING
          *  
      ;`,
      values: [tokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const createSessionsFeature = ["create:session"];
  const activatedUser = await user.setFeatures(userId, createSessionsFeature);
  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
