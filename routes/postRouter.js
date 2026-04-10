const { Router } = require("express");
const postRouter = Router();
const prisma = require("../db/prisma");
const authenticatedUser = require("../middleware/auth");

postRouter.get("/new", authenticatedUser, (req, res) => {
  res.render("createPost");
});

postRouter.post("/", authenticatedUser, async (req, res) => {
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
    console.error(error);
    res.status(500).render("createPost", { error: "Failed to create post" });
  }
});

postRouter.post("/:postId/comments", authenticatedUser, async (req, res) => {
  const { content } = req.body;
  const { postId } = req.params;

  try {
    await prisma.comment.create({
      data: {
        content,
        author: {
          connect: { id: req.user.id },
        },
        post: {
          connect: { id: parseInt(postId) },
        },
      },
    });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to leave comment");
  }
});

postRouter.post("/:postId/likes", authenticatedUser, async (req, res) => {
  const { postId } = req.params;

  try {
    await prisma.like.create({
      data: {
        user: {
          connect: { id: req.user.id },
        },
        post: {
          connect: { id: parseInt(postId) },
        },
      },
    });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to like post");
  }
});

postRouter.delete("/:postId/likes", authenticatedUser, async (req, res) => {
  const { postId } = req.params;

  try {
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: parseInt(postId),
        },
      },
    });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to unlike post");
  }
});

module.exports = postRouter;
