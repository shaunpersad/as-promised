function async(fn) {
    if (process && process.nextTick) {
        return process.nextTick(fn);
    }
    setTimeout(fn, 0);
}

module.exports = async;
