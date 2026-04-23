const { Router } = require("express");
const indexRouter = Router();
const prisma = require("../db/prisma");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const authenticatedUser = require("../middleware/auth");

indexRouter.get("/", authenticatedUser, async (req, res) => {
  const showFollowing = req.query?.showFollowing === "on";
  const followingIds = req.user?.following?.map((f) => f.id);

  try {
    const allPosts = await prisma.post.findMany({
      where: showFollowing ? { authorId: { in: followingIds } } : {},
      include: {
        author: true,
        likes: req.user ? { where: { userId: req.user.id } } : undefined,
        _count: { select: { likes: true } },
        comments: {
          include: { author: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.render("index", { allPosts, query: req.query });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to database");
  }
});

indexRouter.get("/signup", (req, res) => {
  res.render("signup");
});

indexRouter.post("/signup", async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;
  if (password !== confirmPassword)
    return res.render("signup", {
      error: "Passwords do not match",
      email,
      username,
    });

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

indexRouter.post("/guest-login", async (req, res, next) => {
  try {
    const guestUser = await prisma.user.findUnique({
      where: { username: "guest_user" },
    });

    if (!guestUser) {
      return res.render("login", { error: "Guest account error" });
    }

    req.login(guestUser, (err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  } catch (error) {
    next(error);
  }
});

module.exports = indexRouter;
