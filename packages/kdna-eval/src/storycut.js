module.exports = {
  ...require("./defaults/domains"),
  ...require("./defaults/personas"),
  RULE_OF_SIX_DEFAULTS: require("./evaluate").RULE_OF_SIX_DEFAULTS
};
