const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
