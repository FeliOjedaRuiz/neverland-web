const cors = require("cors");

module.exports = cors({
  credentials: true,
  origin: (origin, callback) => {
    const envOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];

    const allowedOrigins = [
      ...envOrigins,
      "http://localhost:5173",
      "http://localhost:3000"
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
});
