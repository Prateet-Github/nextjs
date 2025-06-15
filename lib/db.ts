import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in environment variables");
}

// Extend global type for mongoose caching
declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  // Return existing connection if available
  if (cached.conn) {
    console.log("Using existing database connection");
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // ✅ Fixed: should be false in serverless environments
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // ✅ Added: timeout for server selection
      socketTimeoutMS: 45000, // ✅ Added: socket timeout
      family: 4, // ✅ Added: Use IPv4, skip trying IPv6
    };

    console.log("Creating new database connection...");
    
    // ✅ Fixed: Properly create and assign the promise
    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log("Database connected successfully");
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // ✅ Fixed: Reset promise on error so it can be retried
    cached.promise = null;
    console.error("Database connection failed:", error);
    throw error;
  }

  return cached.conn;
}

// ✅ Added: Function to disconnect (useful for cleanup)
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("Database disconnected");
  }
}

// ✅ Added: Function to check connection status
export function getDatabaseConnectionStatus(): string {
  if (!cached.conn) return "disconnected";
  
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  
  return states[cached.conn.readyState as keyof typeof states] || "unknown";
}

// ✅ Added: Connection event listeners for better debugging
if (typeof window === "undefined") { // Only on server side
  mongoose.connection.on("connected", () => {
    console.log("Mongoose connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("Mongoose connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected from MongoDB");
  });

  // ✅ Added: Graceful shutdown
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("Mongoose connection closed due to app termination");
    process.exit(0);
  });
}