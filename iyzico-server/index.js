const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const paymentRoutes = require("./routes/payment"); // initiate + callback burada

dotenv.config();

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://dark-velvet.com",
  "https://www.dark-velvet.com",
];

const envAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...defaultAllowedOrigins,
  ...envAllowedOrigins,
]);

app.use((req, res, next) => {
  console.log(`📥 ${req.method} - ${req.originalUrl}`);
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.warn("⛔️ CORS reddedildi:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("✅ Iyzico ödeme sunucusu çalışıyor");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});