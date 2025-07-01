/**
 * HOOK
 * @param {object} object 被拦截对象
 * @param {string} functionKey 函数KEY
 * @param {(original: Function, ...args: any[]) => object} handler 处理函数
 */
function hook(object, functionKey, handler) {
    const original = object[functionKey];
    object[functionKey] = function () {
        return handler(original, ...arguments);
    };
}
