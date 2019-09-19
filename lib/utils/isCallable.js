function isCallable(fn) {
  return typeof fn === 'function' || (typeof fn === 'object' && typeof fn.prototype === 'function');
}

module.exports = isCallable;
