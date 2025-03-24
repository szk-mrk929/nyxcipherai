const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ForbiddenError, BadRequestError } = require("./errors");

/**
 * Hash password
 * @param {string} password
 */
exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Make URL
 * @param {import('express').Request} req
 * @param {string} path
 */
exports.makeURL = (req, path) =>
  new URL(path, req.protocol + "://" + req.headers.host).toString();

/**
 * Decode token
 * @param {string} token
 */
exports.decodeToken = (token) => jwt.decode(token, { json: true });

/**
 * Check token expiration
 * @param {string} token
 */
exports.checkTokenExp = (token) => {
  const decode = jwt.decode(token, { json: true });
  if (!decode) return null;

  const exp = decode.exp ?? 0;
  const now = +(new Date().getTime() / 1000).toFixed(0);

  if (exp <= now) throw new ForbiddenError("Token expired");

  return decode;
};
