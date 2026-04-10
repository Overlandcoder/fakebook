const { Router } = require("express");
const userRouter = Router();
const prisma = require("../db/prisma");

userRouter.get("/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const selectedUser = await prisma.user.findUnique({
      where: { username: username },
      include: { posts: true },
    });

    if (!selectedUser) {
      return res.status(404).send("User not found");
    }

    res.render("profile", { profileUser: selectedUser });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

module.exports = userRouter;
