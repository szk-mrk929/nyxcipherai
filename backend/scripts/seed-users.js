const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const User = require("../models/User");
const { ROLE } = require("../config/constant");
const { hashPassword } = require("../utils/utils");
const db = require("../config/key").MongoURI;

/**
 * Utility function to print a title with a separator on the top and bottom
 * @param {string} text
 */
const CLI_Title_Separator = (text) => {
  return `\n----------------------------------\n${text}\n----------------------------------\n`;
};

// Example user data
const users = [
  {
    username: "admin",
    email: "admin@example.com",
    password: "admin123",
    role: ROLE.OWNER,
    phone_number: "9876543210",
    verified: true,
    kyc_verified: true,
    address: {
      street: "456 Admin Ave",
      city: "Adminville",
      state: "NY",
      zip: "54321",
      country: "USA",
    },
  },
  {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    role: ROLE.CUSTOMER,
    phone_number: "1234567890",
    verified: true, // Set to true so we can login immediately
    kyc_verified: false,
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
    },
    resetToken: "",
    resetTokenExpires: null,
  },
];

// Connect to MongoDB
mongoose.set("strictQuery", false);
mongoose
  .connect(db)
  .then(() => console.log("Successfully connected to MongoDB with URI:", db))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to seed users
async function seedUsers() {
  try {
    await mongoose.connection.useDb("oasis").dropCollection("users");
    console.log("\nUsers collection dropped successfully");

    // Clear existing users
    // await User.deleteMany({});
    // console.log("\nCleared existing users");

    // Hash passwords and create users
    const userPromises = users.map(async (user) => {
      // const password_hash = await hashPassword(user.password);
      // { ...user ,password: password_hash }

      return new User(user).save({
        validateBeforeSave: false,
      });
    });

    // Wait for all users to be created
    await Promise.all(userPromises).then((users) => {
      console.log(
        CLI_Title_Separator(`Successfully seeded ${users.length} users:`)
      );
      users.forEach((user) =>
        console.log(
          `- ${user.username} (${user.email}) with role: ${user.role}`
        )
      );
    });

    // Print the credentials for the users
    console.log(
      CLI_Title_Separator("You can now use these credentials to login:")
    );
    users.forEach((user, i) => {
      console.log(
        `${i}. Email: ${user.email}\n   Password: ${user.password}\n`
      );
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB\n");
  } catch (error) {
    console.error("Error seeding users:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seeder
seedUsers();
