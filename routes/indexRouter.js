const { Router } = require("express");
const indexRouter = Router();
const prisma = require("../db/prisma");
const passport = require("passport");
const bcrypt = require("bcryptjs");

indexRouter.get("/", async (req, res) => {
  try {
    const allPosts = await prisma.post.findMany({
      include: {
        author: true,
        likes: req.user ? { where: { userId: req.user.id } } : false,
        _count: { select: { likes: true } },
        comments: {
          include: { author: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.render("index", { allPosts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to database");
  }
});

indexRouter.get("/signup", (req, res) => {
  res.render("signup");
});

indexRouter.post("/signup", async (req, res) => {
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
    console.error(error);
    res.status(500).send({ error: "Failed to create user" });
  }
});

indexRouter.get("/login", (req, res) => {
  res.render("login");
});

indexRouter.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

indexRouter.post("/logout", (req, res, next) => {
  req.logout(function (error) {
    if (error) {
      return next(error);
    }

    res.redirect("/");
  });
});

module.exports = indexRouter;
