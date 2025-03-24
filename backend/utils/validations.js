const Joi = require("joi");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

/**
 * Validate password
 * @param {string} v
 */
exports.validate_Password = (v) => passwordRegex.test(v);

exports.validate_Register = (v) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(
        passwordRegex,
        "Password must contain at least one uppercase letter, one number, and one special character"
      )
      .required(),
    phone_number: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip: Joi.string().required(),
      country: Joi.string().required(),
    }),
    // repeat_password: Joi.ref("password"),

    // access_token: [Joi.string(), Joi.number()],

    // birth_year: Joi.number().integer().min(1900).max(2013),

    // email: Joi.string().email({
    //   minDomainSegments: 2,
    //   tlds: { allow: ["com", "net"] },
    // }),
  });
  return { isJoi: true, ...schema.validate(v) };
};
