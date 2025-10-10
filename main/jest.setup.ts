import '@testing-library/jest-dom';

// Polyfill for TextEncoder and TextDecoder
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any; // Cast to any to avoid TS errors if TextDecoder types are slightly off
