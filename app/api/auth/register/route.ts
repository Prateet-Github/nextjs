import { connectToDatabase } from "@/lib/db";
import User from "@/models/User.model";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // Add this import

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already registered" },
        { status: 409 } // Changed to 409 (Conflict) for existing user
      );
    }

    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with hashed password
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword, // Store hashed password, not plain text
      name: email.split('@')[0], // Optional: add a default name
    });

    return NextResponse.json(
      { 
        message: "User registered successfully",
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle specific MongoDB errors
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: "User already registered" },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (typeof error === "object" && error !== null && "name" in error && (error as any).name === "ValidationError") {
      const validationErrors = Object.values((error as any).errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 } // Changed to 500 for server errors
    );
  }
}