function async(fn) {
    return setTimeout(fn, 0);
}

class AsPromised {
    constructor(executor) {
        this.state = AsPromised.STATE_PENDING;
        this.result = undefined;
        this.fulfilledCallbacks = [];
        this.rejectedCallbacks = [];

        const resolve = value => async(() => {
            if (value instanceof AsPromised) {
                return value.then(resolve).catch(reject);
            }
            this.state = AsPromised.STATE_FULFILLED;
            this.result = value;
            async(() => this.fulfilledCallbacks.forEach(callback => callback(value)));
        });
        const reject = err => async(() => {
            if (!this.rejectedCallbacks.length) {
                throw new Error('Unhandled Promise rejection.');
            }
            this.state = AsPromised.STATE_REJECTED;
            this.result = err;
            async(() => this.rejectedCallbacks.forEach(callback => callback(err)));
        });
        try {
            executor(resolve, reject);
        } catch (err) {
            reject(err);
        }
    }

    then(onSuccessCallback) {
        switch (this.state) {
            case AsPromised.STATE_REJECTED:
                return AsPromised.reject(this.result);
            case AsPromised.STATE_FULFILLED:
                return new AsPromised((resolve, reject) => {
                    try {
                        resolve(onSuccessCallback(this.result));
                    } catch (err) {
                        reject(err);
                    }
                });
            default:
                return new AsPromised((resolve, reject) => {
                    this.fulfilledCallbacks.push(value => {
                        try {
                            resolve(onSuccessCallback(value));
                        } catch (err) {
                            reject(err);
                        }
                    });
                    this.rejectedCallbacks.push(err => reject(err));
                });
        }
    }

    catch(onErrorCallback) {
        switch (this.state) {
            case AsPromised.STATE_REJECTED:
                return new AsPromised((resolve, reject) => {
                    try {
                        resolve(onErrorCallback(this.result));
                    } catch (err) {
                        reject(err);
                    }
                });
            case AsPromised.STATE_FULFILLED:
                return AsPromised.resolve(this.result);
            default:
                return new AsPromised((resolve, reject) => {
                    this.fulfilledCallbacks.push(value => resolve(value));
                    this.rejectedCallbacks.push(err => {
                        try {
                            resolve(onErrorCallback(err));
                        } catch (err) {
                            reject(err);
                        }
                    });
                });
        }
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

const p = new AsPromised(resolve => resolve('hello'));
p
    .then(console.log)
    .then(() => AsPromised.resolve('world'))
    .then(console.log)
    .then(() => 'more')
    .then(console.log)
    .catch(err => console.log('hmm?') || err.message)
    .then(console.log);
