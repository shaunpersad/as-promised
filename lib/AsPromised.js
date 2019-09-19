const isCallable = require('./utils/isCallable');
const looksLikeAPromise = require('./utils/looksLikeAPromise');
const onceFactory = require('./utils/onceFactory');
const passThrough = require('./utils/passThrough');
const tryCallback = require('./utils/tryCallback');

class AsPromised {
    constructor(executor) {
        this.state = AsPromised.STATE_PENDING;
        this.result = undefined;
        this.fulfilledCallbacks = [];
        this.rejectedCallbacks = [];
        this.stateChanges = {
            [AsPromised.STATE_PENDING]: (newState, result) => {
                switch (newState) {
                    case AsPromised.STATE_FULFILLED:
                        const value = result;
                        if (looksLikeAPromise(value)) {
                            if (value === this) {
                                return reject(new TypeError('Chaining cycle detected for promise.'));
                            }
                            const once = onceFactory();
                            const successCallback = once(resolve);
                            const errorCallback = once(reject);
                            try {
                                const { then } = value;
                                if (isCallable(then)) {
                                    return then.call(value, successCallback, errorCallback);
                                }
                            } catch (err) {
                                return errorCallback(err);
                            }
                        }
                        this.state = AsPromised.STATE_FULFILLED;
                        this.result = value;
                        this.fulfilledCallbacks.forEach(callback => callback(value));
                        break;
                    case AsPromised.STATE_REJECTED:
                        const err = result;
                        this.state = AsPromised.STATE_REJECTED;
                        this.result = err;
                        this.rejectedCallbacks.forEach(callback => callback(err));
                        break;
                }
            },
            [AsPromised.STATE_FULFILLED]: passThrough,
            [AsPromised.STATE_REJECTED]: passThrough
        };
        const reject = err => this.changeState(AsPromised.STATE_REJECTED, err);
        const resolve = value => this.changeState(AsPromised.STATE_FULFILLED, value);
        try {
            executor(resolve, reject);
        } catch (err) {
            reject(err);
        }
    }

    changeState(newState, result) {
        this.stateChanges[this.state](newState, result);
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

    finally(finalCallback) {
        return this.then(value => {
            finalCallback();
            return value;
        }, err => {
            finalCallback();
            throw err;
        });
    }

    static resolve(value) {
        return new AsPromised(resolve => resolve(value));
    }

    static reject(err) {
        return new AsPromised((resolve, reject) => reject(err));
    }

    static all(promises) {
        return new AsPromised((resolve, reject) => {
            const results = [];
            promises.forEach(promise => {
                promise
                    .then(value => {
                        results.push(value);
                        if (results.length === promises.length) {
                            resolve(results);
                        }
                    })
                    .catch(reject);
            });
        });
    }

    static allSettled(promises) {
        return new AsPromised((resolve, reject) => {
            const results = [];
            promises.forEach(promise => {
                promise
                    .then(() => results.push({ status: promise.status, value: promise.result }))
                    .catch(() => results.push({ status: promise.status, reason: promise.result }))
                    .then(() => {
                        if (results.length === promises.length) {
                            resolve(results);
                        }
                    });
            });
        });
    }

    static race(promises) {
        return new AsPromised((resolve, reject) => {
            promises.forEach(promise => promise.then(resolve).catch(reject));
        });
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

module.exports = AsPromised;
