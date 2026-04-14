const { Router } = require("express");
const postRouter = Router();
const prisma = require("../db/prisma");
const authenticatedUser = require("../middleware/auth");

postRouter.use(authenticatedUser);

postRouter.get("/new", (req, res) => {
  res.render("createPost");
});

postRouter.post("/", async (req, res) => {
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

postRouter.delete("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) return res.status(404).send("Post not found");

    if (post.authorId !== req.user.id) {
      return res.status(403).send("Permission denied - unable to delete post");
    }

    await prisma.post.delete({
      where: { id: parseInt(postId) },
    });

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to delete post");
  }
});

postRouter.patch("/:postId", async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) return res.status(404).send("Post not found");

    if (post.authorId !== req.user.id) {
      return res.status(403).send("Permission denied - unable to edit post");
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(postId) },
      data: { content: content },
    });

    res.json({ content: updatedPost.content });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to edit post");
  }
});

postRouter.post("/:postId/comments", async (req, res) => {
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

postRouter.post("/:postId/likes", async (req, res) => {
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

postRouter.delete("/:postId/likes", async (req, res) => {
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
