
export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

export enum ExamState {
  SETUP,
  PARSING,
  GENERATING,
  EXAM,
  RESULTS
}
