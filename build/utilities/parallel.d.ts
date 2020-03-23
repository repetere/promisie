export default function parallel<T>(fns: {
    [key: string]: T;
}, args: any, concurrency: any, cb?: (...args: any[]) => void): Promise<any>;
export declare function handleRecursiveParallel<T>(fns: {
    [key: string]: any;
}): {
    [key: string]: any;
};
