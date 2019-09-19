const isCallable = require('./utils/isCallable');
const looksLikeAPromise = require('./utils/looksLikeAPromise');
const onceFactory = require('./utils/onceFactory');
const passThrough = require('./utils/passThrough');
const tryCallback = require('./utils/tryCallback');

class AsPromised {
  constructor(executor) {

    const reject = err => this.changeState(AsPromised.STATE_REJECTED, err);
    const resolve = value => this.changeState(AsPromised.STATE_FULFILLED, value);

    this.state = AsPromised.STATE_PENDING;
    this.result = undefined;
    this.fulfilledCallbacks = [];
    this.rejectedCallbacks = [];
    this.stateChanges = {
      [AsPromised.STATE_PENDING]: (newState, result) => {
        this.result = result;
        switch (newState) {
          case AsPromised.STATE_FULFILLED:
            if (looksLikeAPromise(result)) {
              if (result === this) {
                return reject(new TypeError('Chaining cycle detected for promise.'));
              }
              const once = onceFactory();
              const successCallback = once(resolve);
              const errorCallback = once(reject);
              try {
                const { then } = result;
                if (isCallable(then)) {
                  return then.call(result, successCallback, errorCallback);
                }
              } catch (err) {
                return errorCallback(err);
              }
            }
            this.fulfilledCallbacks.forEach(callback => callback(result));
            break;
          case AsPromised.STATE_REJECTED:
            this.rejectedCallbacks.forEach(callback => callback(result));
            break;
          default:
            break;
        }
        this.state = newState;
      },
      [AsPromised.STATE_FULFILLED]: passThrough,
      [AsPromised.STATE_REJECTED]: passThrough,
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  changeState(newState, result) {
    this.stateChanges[this.state](newState, result);
  }

  then(onFulfilled = passThrough, onRejected = null) {
    if (typeof onFulfilled !== 'function') {
      onFulfilled = passThrough;
    }
    return new AsPromised((resolve, reject) => {
      switch (this.state) {
        case AsPromised.STATE_PENDING:
          this.fulfilledCallbacks.push(value => tryCallback(onFulfilled, value, resolve, reject));
          this.rejectedCallbacks.push(err => tryCallback(onRejected, err, resolve, reject));
          break;
        case AsPromised.STATE_FULFILLED:
          tryCallback(onFulfilled, this.result, resolve, reject);
          break;
        case AsPromised.STATE_REJECTED:
          tryCallback(onRejected, this.result, resolve, reject);
          break;
        default:
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
