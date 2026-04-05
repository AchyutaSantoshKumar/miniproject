const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// IMPORT MODEL
const Complaint = require("./models/Complaint");

const app = express();

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: "10mb" })); // base64 images support

/* ================== MONGODB CONNECT ================== */
mongoose
  .connect("mongodb://127.0.0.1:27017/miniprojectdata")
  .then(() => console.log("✅ MongoDB Connected to miniprojectdata"))
  .catch((err) => {
    console.error("❌ Mongo Error:", err.message);
    process.exit(1); // DB connect avvakapothe server stop
  });

/* ================== TEST ROUTE ================== */
app.get("/", (req, res) => {
  res.send("🚀 Civic Issue Backend Running");
});

/* ================== LOGIN (DEMO) ================== */
app.post("/api/login", (req, res) => {
  res.json({ success: true });
});

/* ================== SUBMIT COMPLAINT ================== */
app.post("/api/complaint", async (req, res) => {
  try {
    // 🔥 DEBUG (VERY IMPORTANT)
    console.log("📩 Incoming Complaint Body:");
    console.log(req.body);

    const { image, lat, lon, address, issue } = req.body;

    // ✅ SAFE VALIDATION
    if (!image || lat === undefined || lon === undefined || !address) {
      console.log("❌ Validation Failed");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ CREATE DOCUMENT
    const complaint = new Complaint({
      image,
      latitude: Number(lat),
      longitude: Number(lon),
      address,
      issue: issue || "unknown", // ML safe
    });

    // ✅ SAVE TO MONGODB
    await complaint.save();

    console.log("✅ Complaint Saved:", complaint._id);

    // ✅ RESPONSE TO FRONTEND
    res.json({
      success: true,
      code: complaint.code,
      status: complaint.status,
      issue: complaint.issue,
    });
  } catch (err) {
    console.error("❌ Complaint Save Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================== TRACK COMPLAINT ================== */
app.post("/api/track", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Complaint code required" });
    }

    const complaint = await Complaint.findOne({ code });

    if (!complaint) {
      return res.status(404).json({ error: "Invalid complaint code" });
    }

    res.json({
      success: true,
      code: complaint.code,
      issue: complaint.issue,
      status: complaint.status,
      address: complaint.address,
      image: complaint.image,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
    });
  } catch (err) {
    console.error("❌ Track Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================== ADMIN → GET ALL COMPLAINTS ================== */
app.get("/api/admin/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints); // ALWAYS array
  } catch (err) {
    console.error("❌ Admin Fetch Error:", err);
    res.status(500).json({ error: "Admin fetch failed" });
  }
});

/* ================== ADMIN → UPDATE STATUS ================== */
app.put("/api/admin/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({ success: true, complaint });
  } catch (err) {
    console.error("❌ Status Update Error:", err);
    res.status(500).json({ error: "Status update failed" });
  }
});

/* ================== START SERVER ================== */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
