import _ from "lodash";
import R from "ramda";

const isFilledString = R.allPass([
  R.complement(_.isEmpty),
  _.isString
]);

export default isFilledString;
