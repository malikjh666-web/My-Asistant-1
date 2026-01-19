
import React from 'react';
import { Question } from '../types';

interface ResultsCardProps {
  question: Question;
  userAnswer: string | null;
  questionNumber: number;
}

const ResultsCard: React.FC<ResultsCardProps> = ({ question, userAnswer, questionNumber }) => {
  const isCorrect = userAnswer === question.correctAnswer;

  const getOptionClasses = (option: string) => {
    const base = "flex items-center justify-between p-3 rounded-md transition-colors text-base";
    
    // Correct Answer style
    if (option === question.correctAnswer) {
      return `${base} bg-emerald-500/20 border border-emerald-500 text-emerald-300`;
    }

    // User's Incorrect Answer style
    if (option === userAnswer && !isCorrect) {
      return `${base} bg-red-500/20 border border-red-500 text-red-300`;
    }

    // Other neutral options
    return `${base} bg-slate-700/50 border border-slate-600 text-slate-400`;
  };

  const getIcon = (option: string) => {
    if (option === question.correctAnswer) {
      return <i className="fas fa-check-circle text-emerald-400"></i>;
    }
    if (option === userAnswer && !isCorrect) {
      return <i className="fas fa-times-circle text-red-400"></i>;
    }
    return null;
  };

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-md animate-fade-in">
      <h4 className="text-lg font-semibold mb-4 text-slate-200">
        <span className={`mr-2 font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
          {questionNumber}.
        </span>
        {question.question}
      </h4>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div key={index} className={getOptionClasses(option)}>
            <span>{option}</span>
            {getIcon(option)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsCard;
