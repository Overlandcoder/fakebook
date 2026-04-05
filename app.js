const express = require("express");
const app = express();
const prisma = require("./db/prisma");

app.set("view engine", "ejs");

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
