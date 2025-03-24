const dotenv = require("dotenv");
dotenv.config();

const MongoURI_default =
  process.env.NODE_ENV === "development"
    ? "mongodb://localhost:27017/oasis"
    : "mongodb://admin:admin987@cluster0-shard-00-00.r3fs6.mongodb.net:27017,cluster0-shard-00-01.r3fs6.mongodb.net:27017,cluster0-shard-00-02.r3fs6.mongodb.net:27017/auth?authSource=admin&replicaSet=atlas-638q0p-shard-0&readPreference=primary&ssl=true";
const MongoURI = process.env.MONGO_URI || MongoURI_default;

/**
 * @type {import('mongoose').ConnectOptions}
 */
const MongoOptions = {
  auth: {
    username: process.env.MONGO_USERNAME || "root",
    password: process.env.MONGO_PASSWORD || "examplepw",
  },
  authSource: "admin",
};

module.exports = {
  MongoURI,
  MongoOptions,
  JWT_KEY: process.env.JWT_KEY || "secret",
};
