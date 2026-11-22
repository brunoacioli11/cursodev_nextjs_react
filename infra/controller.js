import * as cookie from "cookie";
import session from "@/models/session";
import user from "@/models/user";
import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "@/infra/errors";
function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(token, response) {
  const setCookie = cookie.stringifySetCookie({
    name: "session_id",
    value: token,
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.stringifySetCookie({
    name: "session_id",
    value: "invalid",
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookie?.session_id) {
    await injectAuthenticatedUser(request);
  } else {
    injectAnonymousUser(request);
  }

  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;

    if (userTryingToRequest.features.includes(feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "You don't have permission to execute this action",
      action: `Check if your user has the feature ${feature}`,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};
export default controller;
