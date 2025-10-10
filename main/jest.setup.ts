import '@testing-library/jest-dom';

// Polyfill for TextEncoder and TextDecoder, only in test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}