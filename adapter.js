const { AsPromised } = require('./index');

module.exports = {
    resolved(value) {
        return AsPromised.resolve(value);
    },
    rejected(reason) {
        return AsPromised.reject(reason);
    },
    deferred() {
        let deferred = {};
        const promise = new AsPromised((resolve, reject) => Object.assign(deferred, { resolve, reject }));
        return Object.assign(deferred, { promise });
    }
};
