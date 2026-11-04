export function createRequestScope() {
  let generation = 0;
  let currentUserId: string | null = null;

  return {
    begin(userId: string) {
      currentUserId = userId;
      const requestGeneration = ++generation;

      return {
        isCurrent: () => currentUserId === userId && requestGeneration === generation,
      };
    },
    changeUser(userId: string | null) {
      currentUserId = userId;
      generation += 1;
    },
  };
}
