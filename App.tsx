
import React, { useState, useCallback } from 'react';
import { Question, ExamState } from './types';
import { parseMCQs, generateMCQs } from './services/geminiService';
import QuestionCard from './components/QuestionCard';
import ResultsCard from './components/ResultsCard';

const DEFAULT_MCQS = `1. What is the capital of France?
a) Berlin
b) Madrid
c) Paris*
d) Rome

2. What is 2 + 2?
a) 3
b) 4*
c) 5
d) 6

3. Which planet is known as the Red Planet?
a) Earth
b) Mars*
c) Jupiter
d) Saturn

4. What is the largest ocean on Earth?
a) Atlantic Ocean
b) Indian Ocean
c) Arctic Ocean
d) Pacific Ocean*
`;

export default function App() {
  const [examState, setExamState] = useState<ExamState>(ExamState.SETUP);
  const [mcqInput, setMcqInput] = useState<string>(DEFAULT_MCQS);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'paste' | 'generate'>('paste');
  const [files, setFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const startExam = useCallback(async () => {
    if (mcqInput.trim().length === 0) {
      setError("Please enter some multiple choice questions.");
      return;
    }
    setError(null);
    setExamState(ExamState.PARSING);
    try {
      const parsedQuestions = await parseMCQs(mcqInput);
      if (parsedQuestions && parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
        setUserAnswers(new Array(parsedQuestions.length).fill(null));
        setCurrentQuestionIndex(0);
        setExamState(ExamState.EXAM);
      } else {
        throw new Error("Could not parse the questions. Please check the format and try again.");
      }
    // FIX: Added curly braces to the catch block to fix a syntax error.
    } catch (e: any) {
      setError(e.message || "An unknown error occurred during parsing.");
      setExamState(ExamState.SETUP);
    }
  }, [mcqInput]);

  const handleGenerateExam = useCallback(async () => {
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    setError(null);
    setExamState(ExamState.GENERATING);

    try {
      const generatedQuestions = await generateMCQs(files, numQuestions);
      
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
        setUserAnswers(new Array(generatedQuestions.length).fill(null));
        setCurrentQuestionIndex(0);
        setExamState(ExamState.EXAM);
      } else {
        throw new Error("Could not generate questions from the provided files.");
      }
    } catch (e: any) {
      setError(e.message || "An unknown error occurred during generation.");
      setExamState(ExamState.SETUP);
    }
  }, [files, numQuestions]);

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishExam = () => {
    setExamState(ExamState.RESULTS);
  };

  const restartExam = () => {
    setExamState(ExamState.SETUP);
    setQuestions([]);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setError(null);
    setFiles([]);
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (question.correctAnswer === userAnswers[index] ? 1 : 0);
    }, 0);
  };
  
  const renderContent = () => {
    switch (examState) {
      case ExamState.PARSING:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-400"></div>
            <p className="text-xl text-slate-300">Analyzing your questions...</p>
            <p className="text-slate-400">Our AI is working its magic!</p>
          </div>
        );

      case ExamState.GENERATING:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-400"></div>
            <p className="text-xl text-slate-300">Generating your exam...</p>
            <p className="text-slate-400">Our AI is reading your files and crafting questions!</p>
          </div>
        );

      case ExamState.EXAM:
        if (questions.length === 0) return null;
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-violet-400">Question {currentQuestionIndex + 1} of {questions.length}</h2>
            </div>
            <div className="flex-grow p-6 overflow-y-auto">
              <QuestionCard
                question={questions[currentQuestionIndex]}
                userAnswer={userAnswers[currentQuestionIndex]}
                onSelectAnswer={handleAnswerSelect}
              />
            </div>
            <div className="flex justify-between p-4 border-t border-slate-700">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-500 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={finishExam}
                  className="px-6 py-2 font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-500 transition-colors"
                >
                  Finish Exam
                </button>
              )}
            </div>
          </div>
        );

      case ExamState.RESULTS:
        const score = calculateScore();
        const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
        const attempted = userAnswers.filter(a => a !== null).length;
        const unattempted = questions.length - attempted;
        const wrong = attempted - score;

        return (
            <div className="flex flex-col h-full">
                <div className="p-6 text-center border-b border-slate-700">
                    <h2 className="text-3xl font-bold text-violet-400">Exam Results</h2>
                    <p className="mt-2 text-5xl font-bold">{percentage}%</p>
                    <p className="mt-2 text-xl text-slate-300">You scored <span className="text-emerald-400">{score}</span> out of <span className="text-slate-400">{questions.length}</span></p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
                        <div className="bg-slate-700/50 p-3 rounded-lg">
                            <p className="text-sm text-slate-400">Attempted</p>
                            <p className="text-2xl font-bold">{attempted}</p>
                        </div>
                        <div className="bg-emerald-900/50 p-3 rounded-lg">
                            <p className="text-sm text-emerald-400">Correct</p>
                            <p className="text-2xl font-bold text-emerald-300">{score}</p>
                        </div>
                        <div className="bg-red-900/50 p-3 rounded-lg">
                            <p className="text-sm text-red-400">Wrong</p>
                            <p className="text-2xl font-bold text-red-300">{wrong}</p>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg">
                            <p className="text-sm text-slate-400">Unattempted</p>
                            <p className="text-2xl font-bold">{unattempted}</p>
                        </div>
                    </div>
                </div>
                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {questions.map((q, i) => (
                        <ResultsCard
                            key={i}
                            question={q}
                            userAnswer={userAnswers[i]}
                            questionNumber={i + 1}
                        />
                    ))}
                </div>
                <div className="p-4 text-center border-t border-slate-700">
                    <button
                        onClick={restartExam}
                        className="px-8 py-3 font-bold text-lg text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors"
                    >
                        Take Another Exam
                    </button>
                </div>
            </div>
        );

      case ExamState.SETUP:
      default:
        return (
          <div className="p-8 flex flex-col h-full">
            <div className="text-center mb-6">
              <i className="fas fa-feather-alt text-5xl text-violet-400"></i>
              <h1 className="text-4xl font-bold mt-2">MCQ Examiner Pro</h1>
              <p className="text-slate-400 mt-2">Paste your questions or let our AI generate them from your files.</p>
            </div>

            <div className="flex border-b border-slate-700 mb-6">
              <button
                onClick={() => setMode('paste')}
                className={`py-2 px-4 font-semibold transition-colors ${mode === 'paste' ? 'border-b-2 border-violet-400 text-violet-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Paste Text
              </button>
              <button
                onClick={() => setMode('generate')}
                className={`py-2 px-4 font-semibold transition-colors ${mode === 'generate' ? 'border-b-2 border-violet-400 text-violet-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Generate from Files
              </button>
            </div>
            
            {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-md mb-4 animate-fade-in">{error}</div>}

            {mode === 'paste' ? (
              <div className="flex flex-col flex-grow animate-fade-in">
                <textarea
                  className="w-full flex-grow p-4 bg-slate-950 border-2 border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-300 resize-none"
                  placeholder="Paste your MCQs here. Indicate the correct answer with an asterisk (*)."
                  value={mcqInput}
                  onChange={(e) => setMcqInput(e.target.value)}
                />
                <button
                  onClick={startExam}
                  className="w-full mt-6 py-3 text-lg font-bold bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors duration-200"
                >
                  Start Exam
                </button>
              </div>
            ) : (
              <div className="flex flex-col flex-grow animate-fade-in">
                <div className="flex-grow space-y-4">
                  <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">Upload Content</label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600 px-6 py-10 hover:border-violet-500 transition-colors">
                      <div className="text-center">
                        <i className="fas fa-file-arrow-up text-4xl text-slate-500"></i>
                        <div className="mt-4 flex text-sm leading-6 text-slate-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-semibold text-violet-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-violet-600 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 hover:text-violet-300"
                          >
                            <span>Upload files</span>
                            <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files || []))} accept=".txt,.md,.csv,.pdf,.doc,.docx,.ppt,.pptx,image/*" />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-slate-500">Supports PDFs, Docs, Images & more</p>
                      </div>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-300">Selected Files:</h4>
                      <ul className="list-disc list-inside bg-slate-950 p-3 rounded-md border border-slate-700 max-h-24 overflow-y-auto">
                        {files.map(file => <li key={file.name} className="text-sm text-slate-400 truncate">{file.name}</li>)}
                      </ul>
                    </div>
                  )}

                  <div>
                    <label htmlFor="num-questions" className="block text-sm font-medium text-slate-300">Number of Questions</label>
                    <input
                      type="number"
                      id="num-questions"
                      value={numQuestions}
                      min="1"
                      onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="mt-1 block w-24 p-2 bg-slate-950 border-2 border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateExam}
                  disabled={files.length === 0}
                  className="w-full mt-6 py-3 text-lg font-bold bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors duration-200 disabled:bg-slate-700 disabled:cursor-not-allowed"
                >
                  Generate & Start Exam
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[90vh] max-h-[800px] bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-violet-900/20 border border-slate-700 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </main>
  );
}