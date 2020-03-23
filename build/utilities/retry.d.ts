export default function makeRetryGenerator<T>(fn: () => any, options: {
    times: number;
    timeout?: number;
}): () => Generator;
