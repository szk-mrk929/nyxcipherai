const express = require("express");
const app = express();
// const expressLayouts = require('express-ejs-layouts');
const mongoose = require("mongoose");
// const flash = require('connect-flash');
const session = require("express-session");
const passport = require("passport");
const server = require("http").createServer(app);
const bodyParser = require("body-parser");
require("express-async-errors");
const cors = require("cors");
const { MongoURI, JWT_KEY } = require("./config/key");

//------------ Variables ------------//
const PORT = process.env.PORT || 5000;

//------------ Express config ------------//
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//------------ Mongo Connection ------------//
mongoose.set("strictQuery", false);
mongoose
  .connect(MongoURI)
  .then(() =>
    console.log("Successfully connected to MongoDB with URI:", MongoURI)
  )
  .catch((err) => console.log(err));

//------------ Express session Configuration ------------//
app.use(
  session({
    secret: JWT_KEY,
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
  })
);

//------------ Passport Middlewares ------------//
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

//------------ Routes ------------//
app.use("/api", require("./routes/index"));
app.use("/auth", require("./routes/auth"));

app.use((req, res, next) => {
  res.status(404).json({ code: 404, message: "Not found" });
});

/// error handlers
app.use(require("./middlewares/ErrorHandler"));

server.listen(PORT, function () {
  console.log(`Server running on PORT ${PORT}`);
});
