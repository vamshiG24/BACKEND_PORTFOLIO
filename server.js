import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Schema & Model with only name and email
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", ContactSchema);

// API Route
app.post("/send-email", async (req, res) => {
  console.log("🔔 /send-email called");
  console.log("Request body:", req.body);

  const { name, email } = req.body;

  if (!name || !email) {
    console.log("❌ Missing name or email");
    return res.status(400).json({ success: false, message: "Name and Email are required" });
  }

  try {
    // Save to MongoDB
    console.log("💾 Saving contact to DB...");
    const newContact = new Contact({ name, email });
    await newContact.save();
    console.log("✅ Contact saved:", newContact);

    // Email Transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("📧 Sending email to owner...");
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "New Contact Form Submission",
      text: `📩 New contact:\n\nName: ${name}\nEmail: ${email}`,
    });
    console.log("✅ Email sent to owner");

    console.log("📧 Sending auto-reply to sender...");
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "✅ We received your message!",
      text: `Hi ${name},\n\nThanks for reaching out! We'll be in touch soon.\n\nBest regards,\nVamshi Gowni`,
    });
    console.log("✅ Auto-reply sent to sender");

    res.status(200).json({ success: true, message: "Email sent & saved to DB!" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, message: "Error sending email or saving to DB" });
  }
});

app.listen(port, () => {
  console.log("🚀 Server running on http://localhost:5000");
});