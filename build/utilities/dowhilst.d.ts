export default function makeDoWhilstGenerator<T>(fn: () => any, evaluate: (val: T) => boolean): () => Generator;
