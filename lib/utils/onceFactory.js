function onceFactory() {
  let called = false;
  return fn => result => {
    if (!called) {
      called = true;
      fn(result);
    }
  };
}

module.exports = onceFactory;
