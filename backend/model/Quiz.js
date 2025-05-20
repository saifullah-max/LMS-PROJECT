// model/Quiz.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
  },
  { _id: false }
);

const attemptSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{ type: Number, required: true }],
    score: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quizSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lecture: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
    title: { type: String, required: true, trim: true },
    questions: [questionSchema],
    attempts: [attemptSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
