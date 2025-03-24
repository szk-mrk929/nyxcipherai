const User = require("../models/User");
const {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  NotImplementedError,
  BadRequestError,
} = require("../utils/errors");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require("jsonwebtoken");
const { ROLE } = require("../config/constant");
const JWT_KEY = "jwtactive987";

// user login function
const verifyUserLogin = async (email, password) => {
  try {
    // Use select('+password') to include the password field which is excluded by default
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new NotFoundError("User not found");

    // Use the comparePassword method we added to the User model
    if (await user.comparePassword(password)) {
      // creating a JWT token
      const token = jwt.sign({ email: user.email, role: user.role }, JWT_KEY, {
        expiresIn: "24h",
      });
      return { status: "ok", data: token };
    } else {
      throw new ValidationError("Invalid password");
    }
  } catch (error) {
    console.log(error);
    if (error instanceof ValidationError) {
      throw error;
    }
    return { status: "error", error: "Authentication failed" };
  }
};

exports.login = async (body) => {
  let { email, password } = body;

  // Find user but don't include password yet
  let user = await User.findOne({
    email: email,
  });

  if (!user) throw new NotFoundError("User not found");
  if (!user.verified)
    throw new BadRequestError(
      "Email not verified. Please verify your email before logging in."
    );

  // Verify login with password
  const response = await verifyUserLogin(email, password);
  if (response.status === "ok") {
    // Store token in password field for response
    user.password = response.data;
    return user;
  } else {
    throw new ValidationError(
      "Invalid credentials. Please check your email and password."
    );
  }
};

exports.register = async (header, body) => {
  let { username, password, email } = body;

  // Check for existing username or email
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new BadRequestError(
        "Username is already taken. Please choose a different username."
      );
    } else {
      throw new BadRequestError(
        "Email is already registered. Please use a different email address."
      );
    }
  }

  // Password strength validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ValidationError(
      "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  }

  // Create new user - password will be hashed by pre-save hook
  let user = new User({
    username,
    password,
    email,
    role: ROLE.CUSTOMER,
  });

  await user.save();

  // Send Mail
  const oauth2Client = new OAuth2(
    "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
    "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token:
      "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
  });
  const accessToken = oauth2Client.getAccessToken();

  const token = jwt.sign(
    { username, email, password, role: ROLE.CUSTOMER },
    JWT_KEY,
    { expiresIn: "24h" }
  );
  const CLIENT_URL = "http://" + header.host;

  console.log(token, CLIENT_URL);
  const output = `
    <h2>Please click on below link to activate your account</h2>
    <a href=${CLIENT_URL}/auth/verify/${token}>Verify Email</a>
    <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
    `;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "nodejsa@gmail.com",
      clientId:
        "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
      clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
      refreshToken:
        "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
      accessToken: accessToken,
    },
  });

  // send mail with defined transport object
  const mailOptions = {
    from: "<nodejsa@gmail.com>", // sender address
    to: email, // list of receivers
    subject: "Account Verification: OASIS Nyxcipher Auth", // Subject line
    generateTextFromHTML: true,
    html: output, // html body
  };

  await transporter.sendMail(mailOptions);

  return user;
};

exports.verify = async (params) => {
  const { token } = params;
  if (!token)
    throw new UnauthorizedError("Email not verify! Please write password.");
  const decodeToken = jwt.verify(token, JWT_KEY);
  if (!decodeToken)
    throw new UnauthorizedError(
      "Incorrect or expired link! Please register again."
    );

  const { email } = decodeToken;
  let user = await User.findOne({ email: email });
  if (user.verified) throw new UnauthorizedError("Email already verified.");

  user.verified = true;
  await user.save();
  return user;
};

exports.resend = async (userData) => {
  if (!userData || !userData.email) {
    throw new ValidationError(
      "User information is required to resend verification email"
    );
  }

  const user = await User.findOne({ email: userData.email });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.verified) {
    throw new BadRequestError("Email is already verified");
  }

  // Set up OAuth client
  const oauth2Client = new OAuth2(
    "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
    "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token:
      "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
  });
  const accessToken = oauth2Client.getAccessToken();

  // Generate verification token
  const token = jwt.sign(
    { username: user.username, email: user.email, role: user.role },
    JWT_KEY,
    { expiresIn: "24h" }
  );

  // Create verification URL
  const CLIENT_URL =
    "http://" + (userData.headers ? userData.headers.host : "localhost:3000");
  const output = `
    <h2>Please click on below link to activate your account</h2>
    <a href=${CLIENT_URL}/auth/verify/${token}>Verify Email</a>
    <p><b>NOTE: </b> The above activation link expires in 24 hours.</p>
  `;

  // Create email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "nodejsa@gmail.com",
      clientId:
        "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
      clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
      refreshToken:
        "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
      accessToken: accessToken,
    },
  });

  // Set up email options
  const mailOptions = {
    from: "<nodejsa@gmail.com>",
    to: user.email,
    subject: "Account Verification: OASIS Nyxcipher Auth",
    generateTextFromHTML: true,
    html: output,
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
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

exports.reset = async (body) => {
  let { password, email } = body;

  // Password strength validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ValidationError(
      "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  }

  let user = await User.findOne({
    email: email,
  });

  if (!user) throw new NotFoundError("User not found");

  // Set the new password - will be hashed by pre-save hook
  user.password = password;

  // Clear reset token fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.resetLink = "";

  await user.save();

  return {
    message: "Password has been successfully reset",
    user: user.toProfileJSONFor(),
  };
};

exports.forgot = async (req) => {
  const { email } = req.body;

  if (!email) throw new ValidationError("Please enter an email address");

  // Find the user
  let user = await User.findOne({ email: email });
  if (!user)
    throw new NotFoundError("No account with that email address exists");

  // Generate password reset token using our new method
  const resetToken = user.generatePasswordResetToken();

  // Save the user with the new token and expiry
  await user.save();

  // Create reset URL
  const CLIENT_URL = "http://" + req.headers.host;
  const resetUrl = `${CLIENT_URL}/auth/reset/${resetToken}`;

  // Create email content
  const output = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Please click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p><b>NOTE:</b> This link expires in 30 minutes.</p>
    <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
  `;

  // Set up OAuth2 client
  const oauth2Client = new OAuth2(
    "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
    "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token:
      "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
  });
  const accessToken = oauth2Client.getAccessToken();

  // Create email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "nodejsa@gmail.com",
      clientId:
        "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
      clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
      refreshToken:
        "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
      accessToken: accessToken,
    },
  });

  // Set up email options
  const mailOptions = {
    from: '"Security Team" <nodejsa@gmail.com>',
    to: email,
    subject: "Password Reset Request - OASIS Auth",
    html: output,
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    return {
      message: "Password reset email sent successfully",
      info: info.messageId,
    };
  } catch (error) {
    // If email sending fails, clear the reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    throw new NotImplementedError(
      "Failed to send password reset email. Please try again later."
    );
  }
};
