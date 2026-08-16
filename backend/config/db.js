import mongoose from "mongoose";

export async function connectDB() {
  const uri =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/applypilot";

  try {
    await mongoose.connect(uri, {
      // Prefer IPv4 on Windows.
      family: 4,

      // Give MongoDB enough time to find a primary.
      serverSelectionTimeoutMS: 30000,

      // Keep the connection alive.
      socketTimeoutMS: 45000,

      // Don't create a huge connection pool.
      maxPoolSize: 10,

      minPoolSize: 0,

      // Retry temporary network errors.
      retryWrites: true,

      // Useful with Atlas replica sets.
      retryReads: true,
    });

    console.log(
      "MongoDB connected:",
      mongoose.connection.host
    );

    console.log(
      "MongoDB database:",
      mongoose.connection.name
    );
  } catch (err) {
    console.error(
      "MongoDB connection error:",
      err.message
    );

    if (err.reason) {
      console.error(
        "MongoDB topology:",
        err.reason
      );
    }

    process.exit(1);
  }
}