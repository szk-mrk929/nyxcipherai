const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_RESET_KEY = "jwtreset987";
const AuthServices = require("../services/AuthServices");

//------------ User Model ------------//
const User = require("../models/User");
const { decodeToken } = require("../utils/utils");
const { ValidationError } = require("../utils/errors");
const { validate_Register } = require("../utils/validations");

/**
 * ------------ Register ------------
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.register = async (req, res) => {
  const validated = validate_Register(req.body);
  if (validated.error) {
    // validated.error.isJoi = true;
    // res.json(validated);
    throw new ValidationError(validated.error);
  }
  const respond = await AuthServices.register(req);
  res.status(200).json(respond);
};

/**
 * ------------ Login ------------
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.login = async (req, res) => {
  const token = await AuthServices.login(req.body);

  res.cookie("auth_token", token, {
    path: "/",
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    // httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json(token);
};

/**
 * ------------ Verify Account ------------
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.verify = async (req, res) => {
  console.log("verify", req.params);
  const respond = await AuthServices.verify(req.params);
  res.status(200).json(respond);
};

/**
 * ------------ Resend Mail ------------
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.resend = async (req, res) => {
  // @ts-expect-error
  const respond = await AuthServices.resend(req, req.user?.email);
  res.status(200).json(respond);
};

/**
 * ------------ Forgot Password ------------
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.forgotPassword = async (req, res) => {
  const respond = await AuthServices.forgot(req);
  res.status(200).json(respond);
};

/**
 * ------------ Redirect to Reset ------------
 * @param {import('express').Request & { flash: (typeof import('express-flash')) }} req
 * @param {import('express').Response} res
 */
exports.gotoReset = (req, res) => {
  const { token } = req.params;

  if (token) {
    jwt.verify(token, JWT_RESET_KEY, (err, decodedToken_) => {
      /** @type {jwt.JwtPayload} */
      // @ts-expect-error
      const decodedToken = decodedToken_;

      if (err) {
        req.flash("error_msg", "Incorrect or expired link! Please try again.");
        res.redirect("/auth/login");
      } else {
        const _id = decodedToken._id;

        User.findById(_id, (err, user) => {
          if (err) {
            req.flash(
              "error_msg",
              "User with email ID does not exist! Please try again."
            );
            res.redirect("/auth/login");
          } else {
            res.redirect(`/auth/reset/${_id}`);
          }
        });
      }
    });
  } else {
    console.log("Password reset error!");
  }
};

/**
 * ------------ Reset Password ------------
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.resetPassword = async (req, res) => {
  const respond = await AuthServices.reset(req);

  // //------------ Checking required fields ------------//
  // if (!password || !password2) {
  //   req.flash("error_msg", "Please enter all fields.");
  //   res.redirect(`/auth/reset/${token}`);
  // }

  return res.status(200).json(respond);

  //------------ Checking password length ------------//
  // else if (password.length < 8) {
  //   req.flash("error_msg", "Password must be at least 8 characters.");
  //   res.redirect(`/auth/reset/${id}`);
  // }

  //------------ Checking password mismatch ------------//
  // else if (password != password2) {
  //   req.flash("error_msg", "Passwords do not match.");
  //   res.redirect(`/auth/reset/${id}`);
  // } else {
  //   bcrypt.genSalt(10, (err, salt) => {
  //     bcrypt.hash(password, salt, (err, hash) => {
  //       if (err) throw err;
  //       password = hash;

  //       User.findByIdAndUpdate(
  //         { _id: id },
  //         { password },
  //         function (err, result) {
  //           if (err) {
  //             req.flash("error_msg", "Error resetting password!");
  //             res.redirect(`/auth/reset/${id}`);
  //           } else {
  //             req.flash("success_msg", "Password reset successfully!");
  //             res.redirect("/auth/login");
  //           }
  //         }
  //       );
  //     });
  //   });
  // }
};
