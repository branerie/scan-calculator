import { MAX_NUM_ERROR } from './constants';

const areAlmostEqual = (numA: number, numB: number) => Math.abs(numA - numB) < MAX_NUM_ERROR
const isDiffSignificant = (numA: number, numB: number) => Math.abs(numA - numB) > MAX_NUM_ERROR

export {
  areAlmostEqual,
  isDiffSignificant
}