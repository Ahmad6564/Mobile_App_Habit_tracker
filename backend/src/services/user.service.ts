import { User, IUser } from "../models/User";
import { Habit } from "../models/Habit";
import { HabitLog } from "../models/HabitLog";
import { Streak } from "../models/Streak";
import { Task } from "../models/Task";
import { Follow } from "../models/Follow";
import { Errors } from "../utils/AppError";
import { Types } from "mongoose";

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw Errors.notFound("User");
    return user;
  }

  async getUserByUsername(username: string): Promise<IUser> {
    const user = await User.findOne({ username });
    if (!user) throw Errors.notFound("User");
    return user;
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<IUser, "username" | "bio" | "avatarUrl" | "timezone">>
  ): Promise<IUser> {
    if (updates.username) {
      const exists = await User.findOne({ username: updates.username, _id: { $ne: userId } });
      if (exists) throw Errors.conflict("Username is already taken");
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
    if (!user) throw Errors.notFound("User");
    return user;
  }

  async searchUsers(query: string, page = 1, limit = 20): Promise<{ users: IUser[]; total: number }> {
    // Escape special regex characters to prevent ReDoS
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = {
      $or: [
        { username: { $regex: escaped, $options: "i" } },
        { bio:      { $regex: escaped, $options: "i" } },
      ],
      banned: false,
    };
    const [users, total] = await Promise.all([
      User.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ totalPoints: -1 }),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }

  async followUser(followerId: string, targetId: string): Promise<void> {
    if (followerId === targetId) throw Errors.badRequest("Cannot follow yourself");

    const targetOid    = new Types.ObjectId(targetId);
    const followerOid  = new Types.ObjectId(followerId);

    await Promise.all([
      User.findByIdAndUpdate(followerId, { $addToSet: { following: targetOid } }),
      User.findByIdAndUpdate(targetId,   { $addToSet: { followers: followerOid } }),
    ]);
  }

  async unfollowUser(followerId: string, targetId: string): Promise<void> {
    const targetOid   = new Types.ObjectId(targetId);
    const followerOid = new Types.ObjectId(followerId);

    await Promise.all([
      User.findByIdAndUpdate(followerId, { $pull: { following: targetOid } }),
      User.findByIdAndUpdate(targetId,   { $pull: { followers: followerOid } }),
    ]);
  }

  async deleteAccount(userId: string): Promise<void> {
    // Clean up user-owned data
    await Promise.all([
      Habit.deleteMany({ userId }),
      HabitLog.deleteMany({ userId }),
      Streak.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      Follow.deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] }),
    ]);

    // Remove from other users' follower/following arrays
    const userOid = new Types.ObjectId(userId);
    await User.updateMany(
      { $or: [{ followers: userOid }, { following: userOid }] },
      { $pull: { followers: userOid, following: userOid } }
    );

    await User.findByIdAndDelete(userId);
  }
}
