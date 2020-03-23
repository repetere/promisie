export default function safeAssign(data) {
    let result = {};
    for (let key in data) {
        let descriptor = Object.getOwnPropertyDescriptor(data, key);
        //@ts-ignore
        if (descriptor && descriptor.writable)
            result[key] = data[key];
    }
    return result;
}
