function looksLikeAPromise(value) {
  return value && ['object', 'function'].includes(typeof value) && ('then' in value);
}

module.exports = looksLikeAPromise;
