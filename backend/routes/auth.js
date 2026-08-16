import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

const allowedAvatarStyles = [
  "male",
  "female",
  "neutral",
];

function createToken(userId) {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

// REGISTER
router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        avatarStyle = "neutral",
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Name, email and password are required.",
        });
      }

      if (
        password.length < 6
      ) {
        return res.status(400).json({
          error:
            "Password must contain at least 6 characters.",
        });
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const existing =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (existing) {
        return res.status(409).json({
          error:
            "Email already registered.",
        });
      }

      const hashed =
        await bcrypt.hash(
          password,
          10
        );

      const safeAvatar =
        allowedAvatarStyles.includes(
          avatarStyle
        )
          ? avatarStyle
          : "neutral";

      const user =
        await User.create({
          name: name.trim(),
          email:
            normalizedEmail,
          password: hashed,
          avatarStyle:
            safeAvatar,
        });

      const token =
        createToken(
          user._id
        );

      res.status(201).json({
        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarStyle:
            user.avatarStyle,
        },
      });
    } catch (err) {
      console.error(
        "Register error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Unable to create account.",
      });
    }
  }
);

// LOGIN
router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (!user) {
        return res.status(401).json({
          error:
            "Invalid email or password.",
        });
      }

      const match =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!match) {
        return res.status(401).json({
          error:
            "Invalid email or password.",
        });
      }

      const token =
        createToken(
          user._id
        );

      res.json({
        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarStyle:
            user.avatarStyle ||
            "neutral",
        },
      });
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Unable to login.",
      });
    }
  }
);

export default router;