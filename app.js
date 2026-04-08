const express = require("express");
const app = express();
const prisma = require("./db/prisma");
const session = require("express-session");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
          return done(null, false, { message: "Username not found" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

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

const authenticatedUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

app.get("/", async (req, res) => {
  try {
    res.render("index");
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

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.post("/logout", (req, res, next) => {
  req.logout(function (error) {
    if (error) {
      return next(error);
    }

    res.redirect("/");
  });
});

app.get("/posts/new", authenticatedUser, (req, res) => {
  res.render("createPost");
});

app.post("/posts", authenticatedUser, async (req, res) => {
  const { content } = req.body;
  try {
    await prisma.post.create({
      data: {
        content,
        author: {
          connect: { id: req.user.id },
        },
      },
    });
    res.redirect("/");
  } catch (error) {
    console.error("Error", error);
    res.status(500).send({ error: "Failed to create new post" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
