const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport"); 
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(helmet());
app.use(passport.initialize());

app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
)

app.use(express.json());


app.use("/auth", authRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Chat API is running"
    });
});

module.exports = app;