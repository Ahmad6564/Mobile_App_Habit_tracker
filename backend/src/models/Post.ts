import { Schema, model, Document, Types } from "mongoose";

interface IMediaItem {
  url:       string;
  type:      string;  // "image" | "video"
  width?:    number;
  height?:   number;
  thumbnail?: string;
}

export interface IPost extends Document {
  _id:           Types.ObjectId;
  userId:        Types.ObjectId;
  kind:          "post" | "reel";
  format:        "text" | "gallery" | "video";
  caption:       string;
  media:         IMediaItem[];
  tags:          string[];
  song:          string;
  likesCount:    number;
  commentsCount: number;
  repostsCount:  number;
  visibility:    "public" | "followers" | "private";
  createdAt:     Date;
  updatedAt:     Date;
}

const postSchema = new Schema<IPost>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind:          { type: String, enum: ["post", "reel"], default: "post" },
    format:        { type: String, enum: ["text", "gallery", "video"], default: "text" },
    caption:       { type: String, default: "", maxlength: 2200 },
    media: [
      {
        url:       { type: String, required: true },
        type:      { type: String, required: true },
        width:     { type: Number },
        height:    { type: Number },
        thumbnail: { type: String },
      },
    ],
    tags:          [{ type: String, lowercase: true, trim: true }],
    song:          { type: String, default: "" },
    likesCount:    { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    repostsCount:  { type: Number, default: 0, min: 0 },
    visibility:    { type: String, enum: ["public", "followers", "private"], default: "public" },
  },
  { timestamps: true }
);

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });          // explore / trending

export const Post = model<IPost>("Post", postSchema);
