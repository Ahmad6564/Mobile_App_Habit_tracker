import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id:             Types.ObjectId;
  username:        string;
  email:           string;
  passwordHash:    string | null;
  role:            "user" | "moderator" | "admin";
  isVerified:      boolean;
  avatarUrl:       string | null;
  bio:             string;
  timezone:        string;
  /** public = anyone can follow; private = requires approval */
  privacy:         "public" | "private";

  // Profile info
  firstName:       string;
  lastName:        string;
  dateOfBirth:     string | null;   // "YYYY-MM-DD", optional
  age:             number;
  gender:          "male" | "female" | "non-binary" | "prefer-not-to-say" | "";

  // Streak / gamification (Phase 2 & beyond)
  currentStreak:   number;
  longestStreak:   number;
  totalPoints:     number;

  // Moderation (Phase 14)
  banned:          boolean;
  suspendedUntil:  Date | null;
  banReason:       string | null;

  // Referral (Phase 13)
  referralCode:    string;

  // OAuth providers
  authProvider:    "local" | "google";
  googleId:        string | null;

  // Social (Phase 3)
  followers:       Types.ObjectId[];
  following:       Types.ObjectId[];

  // Push notifications (Phase 9)
  pushTokens: { token: string; platform: string; createdAt: Date }[];

  // Per-user settings (Phase 9)
  settings: {
    notifications: boolean;
    reminderTime:  string;   // "HH:MM" UTC
  };

  // Timestamps
  lastSeenAt:      Date;
  createdAt:       Date;
  updatedAt:       Date;

  // Methods
  comparePassword(candidate: string): Promise<boolean>;
  isSuspended(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    username:       { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:   { type: String, default: null, select: false },
    role:           { type: String, enum: ["user", "moderator", "admin"], default: "user" },
    isVerified:     { type: Boolean, default: false },
    avatarUrl:      { type: String, default: null },
    bio:            { type: String, default: "", maxlength: 300 },
    timezone:       { type: String, default: "UTC" },

    firstName:      { type: String, required: true, trim: true, maxlength: 60 },
    lastName:       { type: String, required: true, trim: true, maxlength: 60 },
    dateOfBirth:    { type: String, default: null },  // "YYYY-MM-DD"
    age:            { type: Number, default: 0, min: 0, max: 120 },
    gender:         { type: String, enum: ["male", "female", "non-binary", "prefer-not-to-say", ""], default: "" },

    currentStreak:  { type: Number, default: 0 },
    longestStreak:  { type: Number, default: 0 },
    totalPoints:    { type: Number, default: 0 },

    privacy:        { type: String, enum: ["public", "private"], default: "public" },

    banned:         { type: Boolean, default: false },
    suspendedUntil: { type: Date, default: null },
    banReason:      { type: String, default: null },

    referralCode:   { type: String, default: "", index: true },

    authProvider:   { type: String, enum: ["local", "google"], default: "local" },
    googleId:       { type: String, default: null, sparse: true },

    followers:      [{ type: Schema.Types.ObjectId, ref: "User" }],
    following:      [{ type: Schema.Types.ObjectId, ref: "User" }],

    pushTokens: [
      {
        token:     { type: String, required: true },
        platform:  { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    settings: {
      notifications: { type: Boolean, default: true },
      reminderTime:  { type: String,  default: "21:00" },
    },

    lastSeenAt:     { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret["passwordHash"];
        delete ret["__v"];
        return ret;
      },
    },
  }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash as string);
};

userSchema.methods.isSuspended = function (): boolean {
  return this.suspendedUntil !== null && new Date() < this.suspendedUntil;
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

export const User = model<IUser>("User", userSchema);
