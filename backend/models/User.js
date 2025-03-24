const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const { ROLE } = require("../config/constant");
const { validate_Password } = require("../utils/validations");
const { hashPassword } = require("../utils/utils");

//------------ User Schema ------------//
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      minlength: [3, "Username must be at least 3 characters long"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email address is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't return password by default in queries
      validate: {
        validator: validate_Password,
        message:
          "Password must contain at least one uppercase letter, one number, and one special character",
      },
    },
    role: { type: String, default: ROLE.CUSTOMER },
    phone_number: { type: String, default: "" },
    verified: { type: Boolean, default: false },
    resetToken: { type: String, default: "" },
    resetTokenExpires: { type: Number, default: 0 },
    cart_entry: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cart" }],
    kyc_verified: { type: Boolean, default: false },
    address: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    methods: {
      /**
       * Method to compare password for login
       * @param {string} password
       */
      async comparePassword(password) {
        try {
          return await bcryptjs.compare(password, this.password);
        } catch (error) {
          throw error;
        }
      },

      /**
       * Method to generate password reset token
       */
      async generatePasswordResetToken() {
        // Generate token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token and set to resetPasswordToken field
        this.resetToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

        // Set token expire time (30 minutes)
        this.resetTokenExpires = Date.now() + 30 * 60 * 1000;
        await this.save();
        // await this.updateOne({ $set: { $where: { _id: this._id }, resetToken: this.resetToken, resetTokenExpires: this.resetTokenExpires, }, });

        return resetToken;
      },

      /**
       * Method to return user profile data
       */
      async toProfileJSONFor() {
        return {
          isModified: this.isModified("password"),
          username: this.username,
          email: this.email,
          role: this.role,
          phone_number: this.phone_number,
          verified: this.verified,
          resetToken: this.resetToken,
          resetTokenExpires: this.resetTokenExpires,
          cart_entry: this.cart_entry,
          kyc_verified: this.kyc_verified,
          address: this.address,
        };
      },
    },
  }
);

// Custom error messages for duplicate fields
UserSchema.plugin(uniqueValidator, {
  message: "Error '{PATH}': {VALUE} is already taken.",
});

// Hash password before saving
// @ts-expect-error
UserSchema.pre("save", async function (next, options) {
  if (this.isModified("password"))
    this.password = await hashPassword(this.password);

  next();
});

module.exports = mongoose.model("User", UserSchema);
