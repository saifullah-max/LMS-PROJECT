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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lecture", lectureSchema);
