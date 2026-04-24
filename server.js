const express = require("express");
const cors = require("cors");
const path = require("path");
const { processHierarchyInput } = require("./src/processor");

const app = express();
const PORT = process.env.PORT || 3000;

const user_id = process.env.USER_ID || "humairahshaik_16082005";
const email_id = process.env.EMAIL_ID || "humairah_shaik@srmap.edu.in";
const college_roll_number = process.env.ROLL_NUMBER || "AP23110011153";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/bfhl", (req, res) => {
  try {
    const data = req.body?.data;
    const processed = processHierarchyInput(data);

    res.status(200).json({
      user_id,
      email_id,
      college_roll_number,
      ...processed,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.get(/.*/, (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
