const { Router } = require("express");
const userRouter = Router();
const prisma = require("../db/prisma");
const authenticatedUser = require("../middleware/auth");
const { storage } = require("../storage/storage");
const multer = require("multer");
const upload = multer({ storage });

userRouter.use(authenticatedUser);

// placed this route above the "/:username" route (which is directly below)
// this prevents Express from thinking that "notifications" is a username
userRouter.get("/notifications", async (req, res) => {
  try {
    const requests = await prisma.followRequest.findMany({
      where: { receiverId: req.user.id },
      include: { sender: true },
    });
    res.render("notifications", { requests });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to retrieve friend requests");
  }
});

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
            _count: { select: { likes: true, comments: true } },
            comments: {
              include: { author: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        followers: { select: { followerId: true } },
        followRequestsReceived: {
          where: { senderId: req.user.id },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!profileUser) {
      return res.status(404).send("User not found");
    }

    res.render("profile", { profileUser });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

userRouter.post("/:receiverName/follow-request", async (req, res) => {
  const { receiverName } = req.params;

  if (req.user.username === receiverName) {
    return res.status(400).send("Unable to follow yourself");
  }

  try {
    const receiver = await prisma.user.findUnique({
      where: { username: receiverName },
      select: { id: true },
    });

    if (!receiver) return res.status(404).send("User not found");

    await prisma.followRequest.create({
      data: {
        sender: { connect: { id: req.user.id } },
        receiver: { connect: { id: receiver.id } },
      },
    });
    res.redirect(req.get("referrer") || `/users/${receiverName}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to send follow request");
  }
});

userRouter.delete("/:receiverName/follow-request", async (req, res) => {
  const { receiverName } = req.params;

  try {
    const receiver = await prisma.user.findUnique({
      where: { username: receiverName },
      select: { id: true },
    });

    if (!receiver) return res.status(404).send("User not found");

    await prisma.followRequest.delete({
      where: {
        senderId_receiverId: {
          senderId: req.user.id,
          receiverId: receiver.id,
        },
      },
    });
    res.redirect(req.get("referrer") || `/users/${receiverName}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to cancel follow request");
  }
});

userRouter.post("/:senderName/follow-request/accept", async (req, res) => {
  const { senderName } = req.params;

  try {
    const sender = await prisma.user.findUnique({
      where: { username: senderName },
    });

    if (!sender) return res.status(404).send("User not found");

    await prisma.follow.create({
      data: {
        follower: { connect: { id: sender.id } },
        followed: { connect: { id: req.user.id } },
      },
    });

    await prisma.followRequest.delete({
      where: {
        senderId_receiverId: {
          senderId: sender.id,
          receiverId: req.user.id,
        },
      },
    });
    res.redirect(req.get("referrer") || `/users/${senderName}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to accept follow request");
  }
});

userRouter.delete("/:senderName/follow-request/decline", async (req, res) => {
  const { senderName } = req.params;

  try {
    const sender = await prisma.user.findUnique({
      where: { username: senderName },
    });

    if (!sender) return res.status(404).send("User not found");

    await prisma.followRequest.delete({
      where: {
        senderId_receiverId: {
          senderId: sender.id,
          receiverId: req.user.id,
        },
      },
    });
    res.redirect(req.get("referrer") || `/users/${senderName}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to decline follow request");
  }
});

userRouter.delete("/:username/follow", async (req, res) => {
  const { username } = req.params;

  try {
    const followedUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!followedUser) {
      return res.status(404).send("User not found");
    }

    await prisma.follow.delete({
      where: {
        followerId_followedId: {
          followerId: req.user.id,
          followedId: followedUser.id,
        },
      },
    });
    res.redirect(req.get("referrer") || `/users/${username}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to unfollow user");
  }
});

userRouter.get("/", authenticatedUser, async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({
      include: {
        followers: { where: { followerId: req.user.id } },
        followRequestsReceived: { where: { senderId: req.user.id } },
        _count: {
          select: {
            posts: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { username: "asc" },
    });
    res.render("users", { allUsers });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to database");
  }
});

userRouter.patch(
  "/:userId",
  upload.single("profilePhoto"),
  async (req, res) => {
    const { userId } = req.params;
    const profilePhotoUrl = req.file?.path;

    // verify that request is sent from the profile's user
    // (prevent others from changing a user's profile photo)
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).send("Permission denied");
    }

    try {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { profilePhotoUrl: profilePhotoUrl },
      });

      res.redirect(`/users/${req.user.username}`);
    } catch (error) {
      console.error(error);
      res.status(500).send("Failed to upload image");
    }
  }
);

userRouter.delete("/:userId", async (req, res) => {
  const { userId } = req.params;

  if (parseInt(userId) !== req.user.id) {
    return res.status(403).send("Permission denied");
  }

  try {
    await prisma.user.update({
      where: { id: parseInt(userId) },
      // safer to set to null instead of empty string, so db state is truly empty
      data: { profilePhotoUrl: null },
    });

    res.redirect(`/users/${req.user.username}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to remove image");
  }
});

module.exports = userRouter;
