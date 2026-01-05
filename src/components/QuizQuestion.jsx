// src/components/QuizQuestion.js
import React from "react";

function QuizQuestion({ question, onAnswerSelect }) {
  if (!question) {
    return <div>No question available.</div>;
  }

  return (
    <div>
      <h3>{question.text}</h3>
      <ul>
        {question.choices.map((choice, index) => (
          <li key={index}>
            <button onClick={() => onAnswerSelect(index)}>{choice}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QuizQuestion;
