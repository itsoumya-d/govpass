/* eslint-disable no-undef */
global._toString = (val) => String(val);
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
