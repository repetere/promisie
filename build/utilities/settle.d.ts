export interface SettleValues<T = any> {
    fulfilled: Fulfilled<T>[];
    rejected: Rejected[];
}
export interface Fulfilled<T = any> {
    value: T;
    status: 'fulfilled';
}
export interface Rejected {
    value: Error;
    status: 'rejected';
}
export default function settle<T = any>(fns: any[], concurrency: any, cb?: (...args: any[]) => void): Promise<any>;
