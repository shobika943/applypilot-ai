import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    /* =====================================================
       AVATAR
       ===================================================== */

    avatarStyle: {
      type: String,
      enum: [
        "male",
        "female",
        "neutral",
      ],
      default: "neutral",
    },

    /* =====================================================
       RESUME
       ===================================================== */

    resumeText: {
      type: String,
      default: "",
    },

    resumeSkills: [
      {
        type: String,
      },
    ],

    resumeFileName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "User",
  userSchema
);