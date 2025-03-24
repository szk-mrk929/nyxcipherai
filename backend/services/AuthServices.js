const User = require("../models/User");
const {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  NotImplementedError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require("../utils/errors");
const jwt = require("jsonwebtoken");
const { ROLE } = require("../config/constant");
const {
  validate_Password,
  validate_Register,
} = require("../utils/validations");
const { hashPassword, makeURL } = require("../utils/utils");
const { JWT_KEY } = require("../config/key");
const { sendMail } = require("../utils/nodemailer");
const { pick } = require("lodash");

/**
 * ------------ Login ------------
 * @param {{ email?: string, password?: string }} body
 */
exports.login = async (body) => {
  const { email, password } = body;

  if (!email || !password)
    throw new BadRequestError("Email and password are required");

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new NotFoundError("User not found");

  if (!(await user.comparePassword(password)))
    throw new ForbiddenError("Invalid password");

  if (!user.verified) throw new ForbiddenError("User is not verified yet");

  // Creating a JWT token
  const token = jwt.sign({ email: user.email, role: user.role }, JWT_KEY, {
    expiresIn: "24h",
  });
  return token;
};

/**
 * ------------ Register ------------
 * @param {import('express').Request} req
 */
exports.register = async (req) => {
  const userData = pick(req.body, [
    "username",
    "password",
    "email",
    "phone_number",
    "address",
  ]);
  const { username, password, email } = userData;

  if (await User.exists({ $or: [{ username }, { email }] }))
    throw new ConflictError("User already exist.");

  // User creation
  const user = new User({
    ...userData,
    role: ROLE.CUSTOMER,
    // password: hashedPass,
    // address: {
    //   country: "India",
    //   state: "Maharashtra",
    //   city: "Mumbai",
    //   pincode: "400001",
    // },
    // username: "testuser",
    // email: "test@example.com",
    // phone_number: "1234567890",
    // verified: true,
    // kyc_verified: false,
  });
  await user.save();

  if (!user.verified) {
    const token = jwt.sign({ email, password }, JWT_KEY, { expiresIn: "24h" });

    const CLIENT_URL = makeURL(req, `/auth/verify/${token}`);
    console.log(token, CLIENT_URL);

    /** TODO: generate email template with https://react.email/, or any other service */
    const output = `
    <h2>Please click on below link to activate your account</h2>
    <a href=${CLIENT_URL}>Verify Email</a>
    <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
    `;

    await sendMail({
      from: "<nodejsa@gmail.com>", // sender address
      to: email, // list of receivers
      subject: "Account Verification: OASIS Nyxcipher Auth", // Subject line
      // generateTextFromHTML: true,
      html: output, // html body
    });

    if (process.env.NODE_ENV === "development") return CLIENT_URL;
    return "Verification email has been sent successfully";
  }

  return user;
};

/**
 * ------------ Verify ------------
 * @param {import('express').Request['params']} params
 */
exports.verify = async ({ token }) => {
  if (!token) throw new BadRequestError("Token is required");

  /** @type {{ email: string; password: string; } & import("jsonwebtoken").JwtPayload} */
  // @ts-expect-error
  const decodeToken = jwt.verify(token, JWT_KEY);

  const user = await User.findOne({ email: decodeToken.email }).select(
    "+password"
  );

  if (!user || !(await user?.comparePassword(decodeToken.password)))
    throw new UnauthorizedError("Invalid token");

  if (user) {
    if (user.verified) throw new UnauthorizedError("Email already verified.");
    user.verified = true;
    await user.save();
  }

  return user.updatedAt;
};

/**
 * ------------ Reset ------------
 * @param {import('express').Request} req
 */
exports.reset = async (req) => {
  const resetToken = req.params.token;
  var { password, password2 } = req.body;

  if (password !== password2)
    throw new ValidationError("Password and confirm password doesn't match");

  const user = await User.findOne({ resetToken }).select("+password");

  if (!user) throw new NotFoundError("Token doesn't exist.");

  const isPasswordChanged = !(await user.comparePassword(password));

  user.resetToken = "";
  user.resetTokenExpires = 0;
  if (isPasswordChanged) {
    user.password = password;
    await user.save();
  }

  return "Password has been successfully reset";
};

/**
 * ------------ Forgot Password ------------
 * @param {import('express').Request} req
 */
exports.forgot = async (req) => {
  const { email } = req.body;

  if (!email) throw new ValidationError("Please enter an email ID");

  const user = await User.findOne({ email: email });

  if (!user) throw new NotFoundError("User with Email ID does not exist!");

  const token = await user.generatePasswordResetToken();

  // const token = jwt.sign({ _id: user._id }, JWT_KEY, { expiresIn: "24h" });

  // const updateUser = User.updateOne({ resetLink: token });
  // if (!updateUser) throw new BadRequestError("Error resetting password!");

  const CLIENT_URL = makeURL(req, `/auth/reset-password/${token}`);

  /** TODO: generate email template with https://react.email/, or any other service */
  const output = `
    <h2>Please click on below link to reset your account password</h2>
    <a herf={${CLIENT_URL}>${CLIENT_URL}</a>
    <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>
    `;

  // return output;
  const sendMailResponse = await sendMail({
    from: '"Auth Admin" <nodejsa@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "Account Password Reset: OASIS Auth ✔", // Subject line
    html: output, // html body
  });

  if (!sendMailResponse)
    throw new NotImplementedError(
      "Something went wrong on our end. Please try again later."
    );

  return "Forgot password email has been sent successfully";
};

/**
 * ------------ Resend ------------
 * @param {import('express').Request} req
 * @param {string} [email]
 */
exports.resend = async (req, email) => {
  if (!email) {
    throw new ValidationError(
      "User information is required to resend verification email"
    );
  }

  const user = await User.findOne({ email });
  if (!user) throw new NotFoundError("User not found");
  if (user.verified) throw new BadRequestError("Email is already verified");

  // Generate verification token
  const token = jwt.sign(
    { username: user.username, email: user.email, role: user.role },
    JWT_KEY,
    { expiresIn: "24h" }
  );

  // Create verification URL
  const CLIENT_URL = makeURL(req, `/auth/verify/${token}`);

  /** TODO: generate email template with https://react.email/, or any other service */
  const output = `
    <h2>Please click on below link to activate your account</h2>
    <a href=${CLIENT_URL}>Verify Email</a>
    <p><b>NOTE: </b> The above activation link expires in 24 hours.</p>
  `;

  try {
    // Send email
    await sendMail({
      from: "<nodejsa@gmail.com>",
      to: user.email,
      subject: "Account Verification: OASIS Nyxcipher Auth",
      // generateTextFromHTML: true,
      html: output,
    });

    return {
      message: "Verification email has been resent successfully",
      email: user.email,
    };
  } catch (error) {
    throw new NotImplementedError(
      "Failed to send verification email. Please try again later."
    );
  }
};
