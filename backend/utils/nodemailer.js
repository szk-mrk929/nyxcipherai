const nodemailer = require("nodemailer");
const SMTPTransport = require("nodemailer/lib/smtp-transport");
const merge = require("lodash/merge");
const { oauth2Client } = require("./oauth2");
const { NotImplementedError } = require("./errors");
const Mail = require("nodemailer/lib/mailer");

/**
 * ------------ Create Transporter ------------
 * @param { SMTPTransport | SMTPTransport.Options | string } [options]
 */
exports.createNodemailer = async (options) => {
  if (process.env.NODE_ENV === "production") {
    oauth2Client.setCredentials({
      refresh_token:
        "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
    });
    const accessToken = await oauth2Client.getAccessToken();

    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport(
      merge(
        {
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: "nodejsa@gmail.com",
            clientId:
              "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
            clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
            refreshToken:
              "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
            accessToken,
          },
        },
        options
      )
    );

    return transporter;
  }
  // For development/test, we can use a test account from Ethereal
  // Create a test account on Ethereal
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport(
    merge(
      {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      },
      options
    )
  );

  return transporter;
};

/**
 * ------------ Send Mail ------------
 * @param {import('nodemailer').SendMailOptions} options
 * @param {Mail['sendMail']} [callback]
 */
exports.sendMail = async (options, callback) => {
  const transporter = await exports.createNodemailer();
  const sendMail = transporter.sendMail(options);

  if (!sendMail)
    throw new NotImplementedError(
      "Something went wrong on our end. Please try again later."
    );

  return sendMail;
};
