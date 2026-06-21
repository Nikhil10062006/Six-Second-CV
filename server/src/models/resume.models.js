import mongoose from "mongoose";

const textItemsSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    fontSize: {
      type: Number,
      required: true,
    },
    fontName: {
      type: String,
      required: true,
    },
    page: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const pagesSchema = new mongoose.Schema(
  {
    pageNumber: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    textItems: [textItemsSchema],
  },
  { _id: false },
);

const atsOrderBlockSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    page: {
      type: Number,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    atsText: {
      type: String,
      required: true,
    },
    foundInVisual: {
      type: Boolean,
      required: true,
    },
    foundInAts: {
      type: Boolean,
      required: true,
    },
    visualOrder: {
      type: Number,
      required: true,
    },
    atsOrder: {
      type: Number,
      required: true,
    },
    embedding: {
      type: [Number],
      default: null,
    },
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
     },
    cloudinaryPublicId:{
      type:String,
      required:true,
    },
    originalFileName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "parsing", "parsed", "failed"],
      default: "uploaded",
    },
    parseError: {
      type: String,
      default: null,
    },
    pages: [pagesSchema],
    atsOrderText: {
      type: String,
      default: null,
    },
    atsOrderBlocks: [atsOrderBlockSchema],
    sections: [sectionSchema],
  },
  { timestamps: true },
);

export const Resume = mongoose.model("Resume", resumeSchema);
