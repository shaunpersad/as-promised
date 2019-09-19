const async = require('./async');

function tryCallback(callback, result, resolve, reject) {
  async(() => {
    try {
      (typeof callback === 'function') ? resolve(callback(result)) : reject(result);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = tryCallback;
