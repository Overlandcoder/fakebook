const { Router } = require("express");
const userRouter = Router();
const prisma = require("../db/prisma");
const authenticatedUser = require("../middleware/auth");

userRouter.use(authenticatedUser);

userRouter.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const profileUser = await prisma.user.findUnique({
      where: { username: username },
      include: {
        posts: {
          include: {
            author: true,
            likes: req.user ? { where: { userId: req.user.id } } : undefined,
            _count: { select: { likes: true } },
            comments: {
              include: { author: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        followers: { select: { id: true } },
        _count: { select: { followers: true, following: true } },
      },
    });

    if (!profileUser) {
      return res.status(404).send("User not found");
    }

    const isFollowing = req.user
      ? profileUser.followers.some((f) => f.id === req.user.id)
      : false;

    res.render("profile", { profileUser, isFollowing });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

userRouter.post("/:username/follow", async (req, res) => {
  const { username } = req.params;

  if (req.user.username === username) {
    return res.status(400).send("Unable to follow yourself");
  }

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        following: { connect: { username: username } },
      },
    });
    res.redirect(`/users/${username}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to follow user");
  }
});

userRouter.delete("/:username/follow", async (req, res) => {
  const { username } = req.params;

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        following: { disconnect: { username: username } },
      },
    });
    res.redirect(`/users/${username}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to unfollow user");
  }
});

module.exports = userRouter;
