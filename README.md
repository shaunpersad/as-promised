## Lessons learned from implementing a spec-compliant JavaScript Promise
After using Promises ubiquitously in daily coding, it occurred to me that while I (thought I) intuitively knew _what_ a
promise's behavior will be, I realized that I didn't actually know _how_ this magical construct worked.

I decided to implement my own Promise in order to learn precisely how they do what they do. While my initial naiive 
version worked they way I expected, after running the Promise test suite, it turned out there were _a lot_ of cases
that I hadn't thought about. Here are some lessons learned on my journey towards making my Promise spec-compliant.

### 1. What does `then` actually do?

#### It creates child promises from the parent
Example:
```js
promise.then(doSomething).then(doSomethingElse);
```
We're used to writing promise code in this chainable manner, but what's actually happening here? At first glance, it's
difficult to know if we're doing something to _one_ promise v.s. several. How many promises are actually involved?

It turns out that there are three. The first is the initial parent `promise`, then each subsequent call to `then`
creates a _new_ child promise that's intimately tied to the promise that created it. That parent-child relationship is
such that when the parent promise settles, it then fires the callback passed to the `then` call in order to retrieve the
result to settle it's child promise with.

To accomplish this, the `executor` function passed to the child promise's constructor registers callbacks with its
parent promise to be executed upon the parent's settlement, upon which these callbacks then resolve or reject the child
promise using the result.

#### It can also create unrelated child promises
Example:
```js
promise.then(() => console.log('foo'));
promise.then(() => console.log('bar'));
```

In the above, the parent `promise` creates two children that are independent of each other, in that one's fulfillment
does not affect the other. Each non-chained `then` call adds the supplied callback to an array to be executed later.

#### It can handle both the fulfilled and rejected callback




