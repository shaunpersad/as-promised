function onceFactory() {
    let called = false;
    return fn => {
        return result => {
            if (!called) {
                called = true;
                fn(result);
            }
        };
    };
}

module.exports = onceFactory;
