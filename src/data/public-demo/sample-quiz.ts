export const publicSampleQuiz = {
  title: 'JavaScript sample quiz',
  questions: [
    {
      id: 'sample-typeof-number',
      prompt: 'What does typeof 42 return?',
      options: ['number', 'integer', 'numeric'],
      correctOption: 0,
    },
    {
      id: 'sample-missing-property',
      prompt: 'What is returned when you read a missing object property?',
      options: ['null', 'undefined', 'false'],
      correctOption: 1,
    },
  ],
} as const;
