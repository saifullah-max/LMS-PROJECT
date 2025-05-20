const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lectures: [{ type: Schema.Types.ObjectId, ref: "Lecture" }],
    quizzes: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
    assignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
