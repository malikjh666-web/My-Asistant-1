
import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  userAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, userAnswer, onSelectAnswer }) => {
  return (
    <div className="animate-fade-in">
      <h3 className="text-2xl font-semibold mb-6 text-slate-100">{question.question}</h3>
      <div className="space-y-4">
        {question.options.map((option, index) => {
          const isSelected = userAnswer === option;
          const baseClasses = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-lg";
          const selectedClasses = "bg-violet-500/30 border-violet-400 ring-2 ring-violet-400 text-white font-semibold";
          const unselectedClasses = "bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-300";
          
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(option)}
              className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
