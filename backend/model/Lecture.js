// server/models/Lecture.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const viewSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  viewedAt: { type: Date, default: Date.now },
});

const lectureSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: String,
    description: String,
    filePath: String,
    fileType: String,
    offlineUrl: String,
    views: { type: [viewSchema], default: [] }, // ← make sure this line is there!
    difficulty: {
      // New field for lecture difficulty
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium", // Default difficulty is "medium"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lecture", lectureSchema);
