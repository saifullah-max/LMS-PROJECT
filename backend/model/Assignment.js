const mongoose = require("mongoose");
const { Schema } = mongoose;

// a student’s submission
const submissionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filePath: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    grade: Number,
    feedback: String,
    gradedAt: Date,
  },
  { _id: true, id: false }
);

const assignmentSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lecture: { type: Schema.Types.ObjectId, ref: "Lecture", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    deadline: { type: Date, required: true },
    filePath: { type: String, required: true }, // teacher‐uploaded template
    submissions: [submissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
