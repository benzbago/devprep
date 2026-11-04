export interface DemoQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface DemoChallenge {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate';
  prompt: string;
  code: string;
  objective: string;
  questions: readonly DemoQuestion[];
  hints: readonly [string, string, string];
}

export const demoChallenges: readonly DemoChallenge[] = [
  {
    id: 'frequency-counter',
    title: 'Build a frequency counter',
    level: 'Beginner',
    prompt:
      'Return an object that records how many times each value appears in an array.',
    code: `function countValues(values) {
  // Write your approach here
}`,
    objective: 'Practice loops, object keys, and incremental state.',
    questions: [
      {
        id: 'why-object',
        question: 'Why use an object for counting?',
        answer:
          'An object gives each distinct value its own named slot. The value at that key can hold the running count, so lookup and updates stay direct.',
      },
      {
        id: 'first-seen',
        question: 'What happens when a value appears for the first time?',
        answer:
          'The key does not exist yet, so initialize it to 1. For later appearances, increment the existing count instead.',
      },
      {
        id: 'complexity',
        question: 'What is the time complexity?',
        answer:
          'You visit each array item once, so the loop is O(n). Object lookup is treated as constant time on average for this exercise.',
      },
    ],
    hints: [
      'Ask what needs to persist from one loop iteration to the next: both the value you saw and its current count.',
      'Use each array value as an object key. Initialize a count the first time you see the key; otherwise increment it.',
      'Create an empty object before the loop. For every value, assign `counts[value] = (counts[value] ?? 0) + 1`, then return the object.',
    ],
  },
  {
    id: 'normalize-words',
    title: 'Normalize a list of words',
    level: 'Intermediate',
    prompt: 'Trim each word, convert it to lowercase, and remove empty results.',
    code: `function normalizeWords(words) {
  // Transform and filter the list
}`,
    objective: 'Practice array pipelines and keeping each transformation focused.',
    questions: [
      {
        id: 'order',
        question: 'Why trim before filtering?',
        answer:
          'A string containing only spaces is truthy before trimming. Trim first so whitespace-only entries become empty strings that filtering can remove.',
      },
      {
        id: 'map-filter',
        question: 'Why combine map and filter?',
        answer:
          'Map expresses the normalization step and filter expresses removal. Keeping those jobs separate makes the pipeline easier to read.',
      },
    ],
    hints: [
      'Separate the problem into transformation and selection: first change every item, then decide which results remain.',
      'Use `map` for trimming and lowercasing, followed by `filter` for empty strings.',
      'Return `words.map((word) => word.trim().toLowerCase()).filter(Boolean)`.',
    ],
  },
];
