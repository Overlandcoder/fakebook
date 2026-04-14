const express = require("express");
const app = express();
const prisma = require("./db/prisma");
const passport = require("passport");
const session = require("express-session");
require("./config/passport");
const methodOverride = require("method-override");
const indexRouter = require("./routes/indexRouter");
const postRouter = require("./routes/postRouter");
const userRouter = require("./routes/userRouter");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use("/", indexRouter);

app.use("/posts", postRouter);

app.use("/users", userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
