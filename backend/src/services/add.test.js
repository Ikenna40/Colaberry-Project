const test = require('node:test');
const assert = require('node:assert/strict');
const { add } = require('./add');

test('add returns the sum of two positive numbers', () => {
  assert.equal(add(2, 3), 5);
});

test('add handles negative numbers', () => {
  assert.equal(add(-4, 9), 5);
});

test('add handles zero', () => {
  assert.equal(add(0, 7), 7);
});

test('add handles non-integer numbers', () => {
  assert.equal(add(0.1, 0.2), 0.1 + 0.2);
});
