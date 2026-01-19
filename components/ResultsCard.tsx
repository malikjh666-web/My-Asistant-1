
import React from 'react';
import { Question } from '../types';

interface ResultsCardProps {
  question: Question;
  userAnswer: string | null;
  questionNumber: number;
}

const ResultsCard: React.FC<ResultsCardProps> = ({ question, userAnswer, questionNumber }) => {
  const isCorrect = userAnswer === question.correctAnswer;
  const isUnattempted = userAnswer === null;

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

  const getStatusIcon = () => {
    if (isUnattempted) {
      return <i className="fas fa-minus-circle text-slate-500" title="Unattempted"></i>;
    }
    return isCorrect 
      ? <i className="fas fa-check-circle text-emerald-400" title="Correct"></i>
      : <i className="fas fa-times-circle text-red-400" title="Incorrect"></i>;
  }

  return (
    <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-md animate-fade-in">
      <h4 className="flex items-start text-lg font-semibold mb-4 text-slate-200">
        <span className="mr-3 mt-1 font-bold text-slate-400">{questionNumber}.</span>
        <div className="flex-1">
          {question.question}
          {isUnattempted && (
             <span className="ml-2 text-xs font-medium bg-slate-700 text-slate-400 px-2 py-1 rounded-full">Unattempted</span>
          )}
        </div>
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
