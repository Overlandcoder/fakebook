const express = require("express");
const app = express();
const prisma = require("./db/prisma");

app.set("view engine", "ejs");

const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcryptjs");

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const allUsers = await prisma.user.findMany({
      take: 5,
    });

    res.json({
      message: "Welcome to Odinbook",
      dbStatus: "Connected",
      totalUsers: userCount,
      sampleUsers: allUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Database connection error");
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });
    res.redirect("/");
  } catch (error) {
    console.error("Error", error);
    res.status(500).send({ error: "Failed to create user" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
