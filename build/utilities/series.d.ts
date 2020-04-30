export default function makeSeriesGenerator<TOut = any>(fns: Array<((state: any) => any) | any[]>): () => Generator;
