function async(fn) {
    if (process && process.nextTick) {
        return process.nextTick(fn);
    }
    setTimeout(fn, 0);
}
function passThrough(result) {
    return result;
}

function tryCallback(callback, result, resolve, reject) {
    async(() => {
        try {
            (typeof callback === 'function') ? resolve(callback(result)) : reject(result);
        } catch (err) {
            reject(err);
        }
    });
}

function looksLikeAPromise(value) {
    return value && ['object', 'function'].includes(typeof value) && ('then' in value);
}

function isCallable(fn) {
    return typeof fn === 'function' || (typeof fn === 'object' && typeof fn.prototype === 'function');
}

class AsPromised {
    constructor(executor) {
        this.state = AsPromised.STATE_PENDING;
        this.result = undefined;
        this.fulfilledCallbacks = [];
        this.rejectedCallbacks = [];

        const reject = err => {
            if (this.state !== AsPromised.STATE_PENDING) {
                return;
            }
            if (!this.rejectedCallbacks.length) {
                // console.warn('UnhandledPromiseRejectionWarning:', err);
            }
            this.state = AsPromised.STATE_REJECTED;
            this.result = err;
            this.rejectedCallbacks.forEach(callback => callback(err));
        };
        const resolve = value => {
            if (this.state !== AsPromised.STATE_PENDING) {
                return;
            }
            if (looksLikeAPromise(value)) {
                if (value === this) {
                    return reject(new TypeError('Chaining cycle detected for promise.'));
                }
                let then;
                try {
                    then = value.then;
                } catch (err) {
                    return reject(err);
                }
                if (isCallable(then)) {
                    let called = false;
                    try {
                        return then.call(value, value => {
                            if (!called) {
                                called = true;
                                resolve(value);
                            }
                        }, err => {
                            if (!called) {
                                called = true;
                                reject(err);
                            }
                        });
                    } catch (err) {
                        if (!called) {
                            called = true;
                            reject(err);
                        }
                        return;
                    }
                }
            }
            this.state = AsPromised.STATE_FULFILLED;
            this.result = value;
            this.fulfilledCallbacks.forEach(callback => callback(value));
        };
        try {
            executor(resolve, reject);
        } catch (err) {
            reject(err);
        }
    }

    then(successCallback = passThrough, errorCallback = null) {
        if (typeof successCallback !== 'function') {
            successCallback = passThrough;
        }
        return new AsPromised((resolve, reject) => {
            switch (this.state) {
                case AsPromised.STATE_PENDING:
                    this.fulfilledCallbacks.push(value => tryCallback(successCallback, value, resolve, reject));
                    this.rejectedCallbacks.push(err => tryCallback(errorCallback, err, resolve, reject));
                    break;
                case AsPromised.STATE_FULFILLED:
                    tryCallback(successCallback, this.result, resolve, reject);
                    break;
                case AsPromised.STATE_REJECTED:
                    tryCallback(errorCallback, this.result, resolve, reject);
                    break;
            }
        });
    }

    catch(errorCallback) {
        return this.then(undefined, errorCallback);
    }

    static resolve(value) {
        return new AsPromised(resolve => resolve(value));
    }

    static reject(err) {
        return new AsPromised((resolve, reject) => reject(err));
    }

    static get STATE_PENDING() {
        return 'pending';
    }

    static get STATE_FULFILLED() {
        return 'fulfilled';
    }

    static get STATE_REJECTED() {
        return 'rejected';
    }
}

const twice = new AsPromised(resolve => {
   resolve('foo');
   resolve('bar');
});
const p = AsPromised.resolve(AsPromised.resolve(twice));
p.then(result => console.log('yes', result), result => console.log('no', result));

module.exports = AsPromised;
