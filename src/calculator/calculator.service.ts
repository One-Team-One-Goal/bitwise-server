import { Injectable, Logger } from '@nestjs/common';
import { createContext, runInContext } from 'vm';
import {
  CalculationResponse,
  SimplificationResult,
} from './interfaces/calculator.interface';

@Injectable()
export class CalculatorService {
  private readonly logger = new Logger(CalculatorService.name);
  private jsContext: any;

  constructor() {
    this.initializeJavaScriptContext();
  }

  private initializeJavaScriptContext() {
    try {
      this.jsContext = createContext({
        console: console,
        require: require,
      });

  // Original boolean calculator implementation from GitHub
      const jsCode = `
        // Constants from constants.js
        const SYMBOL = {
          NOT: "¬",
          AND: "∧",
          OR: "∨",
          XOR: "⊕",
          IF: "→",
          IFF: "↔"
        };

        // Utils from utils.js
        const Utils = new function() {
          this.parenthesize = function(string, temp = true) {
            if (temp) {
              return "(" + string + ")";
            }
            return string;
          }

          this.arrayToString = function(array, separator) {
            var string = "";
            for (var i = 0; i < array.length; i++) {
              var item = array[i];
              if (i == 0) {
                string += item;
              } else {
                first = true;
                string += (separator + item);
              }
            }
            return string;
          }

          this.setSubtract = function(main, subtract) {
            var newArray = [];
            for (let a of main) {
              if (!subtract.includes(a)) {
                newArray.push(a);
              }
            }
            return newArray;
          };
          
          this.setAdd = function(main, add) {
            var newArray = main.concat();
            for (let a of add) {
              if (!main.includes(a)) {
                newArray.push(a);
              }
            }
            return newArray;
          }
        };

        // Basic expressions from expression.js
        const Generic = new function() {
          this.toString = function() {
            return "...";
          }
          this.equals = function(object) {
            return true;
          }
          this.clone = function() {
            return this;
          }
          this.evaluate = function(variableStates) {
            throw "Operation: evalute not supported.";
          }
        }
        
        const True = new function() {
          this.toString = function() {
            return "T";
          }
          this.equals = function(object) {
            return object == this;
          }
          this.clone = function() {
            return this;
          }
          this.evaluate = function(variableStates) {
            return true;
          }
        }

        const False = new function() {
          this.toString = function() {
            return "F";
          }
          this.equals = function(object) {
            return object == this;
          }
          this.clone = function() {
            return this;
          }
          this.evaluate = function(variableStates) {
            return false;
          }
        }

        function Variable(string) {
          this.variableName = string;
        }
        Variable.prototype.toString = function() {
          return this.variableName;
        }
        Variable.prototype.equals = function(object) {
          if (!(object instanceof Variable)) {
            return false;
          }
          return this.variableName == object.variableName;
        }
        Variable.prototype.evaluate = function(variableStates) {
          return variableStates[this.variableName];
        }

        function isVariable(exp) {
          return exp instanceof Variable;
        }

        function NotExpression(subs) {
          this.subs = subs;
        }
        NotExpression.prototype.toString = function() {
          return SYMBOL.NOT + this.subs[0];
        };
        NotExpression.prototype.equals = function(object) {
          if (!(object instanceof NotExpression)) {
            return false;
          }
          return this.subs[0].equals(object.subs[0]);
        }
        NotExpression.prototype.evaluate = function(variableStates) {
          return !this.subs[0].evaluate(variableStates);
        }

        function OrExpression(subs) {
          this.subs = subs;
        }

        OrExpression.prototype.toString = function() {
          return Utils.parenthesize(Utils.arrayToString(this.subs, " " + SYMBOL.OR + " "));
        }
        OrExpression.prototype.contains = function(object) {
          if (!(object instanceof OrExpression)) {
            for (var i = 0; i < this.subs.length; i++) {
              if (this.subs[i].equals(object)) {
                return true;
              }
            }
            return false;
          }
          for (var i = 0; i < object.subs.length; i++) {
            var sub = object.subs[i];
            if (!this.contains(sub)) {
              return false;
            }
          }
          return true;
        }
        OrExpression.prototype.equals = function(object) {
          if (!(object instanceof OrExpression)) {
            return false;
          }
          if (this.subs.includes(Generic)) {
            if (object.subs.includes(Generic)) {
              return true;
            } else {
              for (let sub of this.subs) {
                if (!sub.equals(Generic)) {
                  if (!object.subs.includes(sub)) {
                    return false;
                  }
                }
              }
              return true;
            }
          } else if (object.subs.includes(Generic)) {
            for (let sub of object.subs) {
              if (!sub.equals(Generic)) {
                if (!this.subs.includes(sub)) {
                  return false;
                }
              }
            }
            return true;
          }
          if (this.subs.length != object.subs.length) {
            return false;
          }
          if (this.toString() == object.toString()) {
            return true;
          }
          return this.subs.concat().sort().toString() == object.subs.concat().sort().toString();
        }
        OrExpression.prototype.evaluate = function(variableStates) {
          for (var i = 0; i < this.subs.length; i++) {
            var p = this.subs[i].evaluate(variableStates);
            if (p) {
              return true;
            }
          }
          return false;
        }

        function AndExpression(subs) {
          this.subs = subs;
        }

        AndExpression.prototype.toString = function() {
          return Utils.parenthesize(Utils.arrayToString(this.subs, " " + SYMBOL.AND + " "));
        }
        AndExpression.prototype.contains = function(object) {
          if (!(object instanceof AndExpression)) {
            for (var i = 0; i < this.subs.length; i++) {
              if (this.subs[i].equals(object)) {
                return true;
              }
            }
            return false;
          }
          for (var i = 0; i < object.subs.length; i++) {
            var sub = object.subs[i];
            if (!(this.contains(sub))) {
              return false;
            }
          }
          return true;
        }
        AndExpression.prototype.equals = function(object) {
          if (!(object instanceof AndExpression)) {
            return false;
          }
          if (this.subs.length != object.subs.length) {
            return false;
          }
          if (this.toString() == object.toString()) {
            return true;
          }
          return this.subs.concat().sort().toString() == object.subs.concat().sort().toString();
        }

        AndExpression.prototype.evaluate = function(variableStates) {
          for (var i = 0; i < this.subs.length; i++) {
            var p = this.subs[i].evaluate(variableStates);
            if (!p) {
              return false;
            }
          }
          return true;
        }

        function equalsNegation(exp1, exp2) {
          var neg1 = new NotExpression([exp1]);
          var neg2 = new NotExpression([exp2]);
          if (neg1.equals(exp2)) {
            return true;
          } else {
            return neg2.equals(exp1);
          }
        }

        function negation(exp) {
          if (exp instanceof NotExpression) {
            return exp.subs[0];
          } else {
            return new NotExpression([exp]);
          }
        }

        function andCombine(exp1, exp2) {
          if (exp1 instanceof AndExpression) {
            if (exp2 instanceof AndExpression) {
              return new AndExpression(Utils.setAdd(exp1.subs, exp2.subs));
            } else {
              return new AndExpression(Utils.setAdd(exp1.subs, [exp2]));
            }
          } else {
            if (exp2 instanceof AndExpression) {
              return new AndExpression(Utils.setAdd(exp2.subs, [exp1]));
            } else {
              return new AndExpression([exp1, exp2]);
            }
          }
        }

        function orCombine(exp1, exp2) {
          if (exp1 instanceof OrExpression) {
            if (exp2 instanceof OrExpression) {
              return new OrExpression(Utils.setAdd(exp1.subs, exp2.subs));
            } else {
              return new OrExpression(Utils.setAdd(exp1.subs, [exp2]));
            }
          } else {
            if (exp2 instanceof OrExpression) {
              return new OrExpression(Utils.setAdd(exp2.subs, [exp1]));
            } else {
              return new OrExpression([exp1, exp2]);
            }
          }
        }

        // Variable Manager from variable.js
        const VariableManager = new function() {
          var variables = [];

          this.get = function(varName) {
            var filter = /^[a-zA-Z]+$/;
            if (!filter.test(varName)) {
              throw "Parsing Error: Variables should be comprised of letters only.";
            }
            if (varName == "T") {
              return True;
            } else if (varName == "F") {
              return False;
            }

            for (var i = 0; i < variables.length; i++) {
              if (varName == variables[i].variableName) {
                return variables[i];
              }
            }
            var newVar = new Variable(varName);
            variables.push(newVar);
            return newVar;
          }

          this.hasVariable = function(varName) {
            for (var i = 0; i < variables.length; i++) {
              if (varName == variables[i].variableName) {
                return true;
              }
            }
            return false;
          }

          this.getVariables = function() {
            return variables;
          }

          this.clear = function() {
            variables = [];
          }

          this.getTruthAssignments = function() {
            var states = [{}];
            for (var i = 0; i < variables.length; i++) {
              var varName = variables[i].variableName;
              var newStates = [];
              for (var j = 0; j < states.length; j++) {
                var state = states[j];
                var trueDict = {};
                trueDict[varName] = true;
                var falseDict = {};
                falseDict[varName] = false;
                var trueCopy = Object.assign({}, state, trueDict);
                var falseCopy = Object.assign({}, state, falseDict);
                newStates.push(trueCopy);
                newStates.push(falseCopy);
              }
              states = newStates;
            }
            return states;
          }
        };

        // Parser from parser.js
        const Parser = new function() {
          var NOT_EXPRESSIONS = [SYMBOL.NOT, "~", "-", "!", "not"];
          var AND_EXPRESSIONS = [SYMBOL.AND, "and", "\\\\^"];
          var OR_EXPRESSIONS = [SYMBOL.OR, "or", "v"];
          var XOR_EXPRESSIONS = [SYMBOL.XOR, "xor"];
          var IF_EXPRESSIONS = [SYMBOL.IF, "->", "then"];
          var IFF_EXPRESSIONS = [SYMBOL.IFF, "<->"];
          var BINARY_EXPRESSIONS = [AND_EXPRESSIONS[0], OR_EXPRESSIONS[0], XOR_EXPRESSIONS[0], IF_EXPRESSIONS[0], IFF_EXPRESSIONS[0]];

          var OPEN_PARENS = "\\(";
          var CLOSE_PARENS = "\\)";

          this.parse = function(expression) {
            if (invalidParentheses(expression)) {
              throw "Parsing Error: Check parentheses count.";
            }
            expression = expression.split(" ").join("");
            if (expression.length == 0) {
              throw "Nothing Entered.";
            }
            return processParsedArray(parseStandard(this.standardize(expression)));
          }

          this.standardize = function(expression) {
            expression = _standard(expression, AND_EXPRESSIONS);
            expression = _standard(expression, XOR_EXPRESSIONS);
            expression = _standard(expression, OR_EXPRESSIONS);
            expression = _standard(expression, IFF_EXPRESSIONS);
            expression = _standard(expression, IF_EXPRESSIONS);
            expression = _standard(expression, NOT_EXPRESSIONS);
            return expression;
          }

          var _standard = function(expression, expressionsArray) {
            for (var i = 0; i < expressionsArray.length; i++) {
              var exp = expressionsArray[i];
              expression = expression.replace(new RegExp(exp, "g"), expressionsArray[0]);
            }
            return expression;
          }

          var parseStandard = function(std) {
            var expressions = [];
            var parenthesisInitIdx = 0;
            var parenthesisStatus = 0;
            var expressionStatus = false;
            for (var idx = 0; idx < std.length; idx++) {
              var currentChar = std.charAt(idx);
              if (currentChar == OPEN_PARENS) {
                if (parenthesisStatus == 0) {
                  expressionStatus = false;
                  parenthesisInitIdx = idx;
                }
                parenthesisStatus++;
              } else if (currentChar == CLOSE_PARENS) {
                parenthesisStatus--;
                if (parenthesisStatus == 0) {
                  expressions.push(std.substring(parenthesisInitIdx + 1, idx));
                }
              } else if (parenthesisStatus != 0) {
                continue;
              } else {
                switch (currentChar) {
                  case NOT_EXPRESSIONS[0]:
                  case AND_EXPRESSIONS[0]:
                  case OR_EXPRESSIONS[0]:
                  case XOR_EXPRESSIONS[0]:
                  case IF_EXPRESSIONS[0]:
                  case IFF_EXPRESSIONS[0]:
                    expressions.push(currentChar);
                    expressionStatus = false;
                    break;
                  default:
                    if (!expressionStatus) {
                      expressionStatus = true;
                      expressions.push("");
                    }
                    expressions[expressions.length - 1] += currentChar;
                }
              }
            }
            return expressions;
          }

          var processParsedArray = function(array) {
            if (array.length == 1) {
              return processParsedSingle(array[0]);
            } else {
              if (isAmbiguousArray(array)) {
                throw "Expression is ambiguous, use parentheses to delimit different binary operators";
              }
              var index = getBinaryIndex(array);
              if (index == -1) {
                if (array.shift() == NOT_EXPRESSIONS[0]) {
                  return new NotExpression([processParsedArray(array)]);
                } else {
                  throw "Parsing error: Unfinished expression";
                }
              } else {
                var preBinary = array.slice(0, index);
                var postBinary = array.slice(index + 1);
                switch (array[index]) {
                  case AND_EXPRESSIONS[0]:
                    return processAndExpression(array);
                  case OR_EXPRESSIONS[0]:
                    return processOrExpression(array);
                  default:
                    throw "Parsing error. AB idx:" + index;
                }
              }
            }
          }

          var processParsedSingle = function(single) {
            var parseAgain = parseStandard(single);
            if (parseAgain == single) {
              if (isBinaryOperator(single) || single == NOT_EXPRESSIONS[0]) {
                throw "Parsing error: Unfinished expression";
              }
              return VariableManager.get(single);
            } else {
              return processParsedArray(parseAgain);
            }
          }

          var processOrExpression = function(array) {
            return processAssociativeExpression(array, SYMBOL.OR, OrExpression);
          }

          var processAndExpression = function(array) {
            return processAssociativeExpression(array, SYMBOL.AND, AndExpression);
          }

          var processAssociativeExpression = function(array, symbol, construct) {
            array.push(symbol);
            var newArray = [];
            var tempNot = [];
            var counter = 0;
            var pushed;
            for (var i = 0; i < array.length; i++) {
              pushed = false;
              if (array[i] == SYMBOL.NOT) {
                tempNot.push(array[i]);
                pushed = true;
              } else {
                counter++;
              }
              if (array[i] == symbol) {
                if (tempNot.length != 0) {
                  newArray.push(processParsedArray(tempNot));
                  tempNot = [];
                }
                if (counter % 2 == 1) {
                  throw "Parsing error: Unfinished expression";
                }
              } else {
                if (tempNot.length == 0) {
                  newArray.push(processParsedSingle(array[i]));
                } else {
                  if (!pushed) {
                    tempNot.push(array[i]);
                  }
                }
              }
            }
            return new construct(newArray);
          }

          var isBinaryOperator = function(exp) {
            for (var idx = 0; idx < BINARY_EXPRESSIONS.length; idx++) {
              if (BINARY_EXPRESSIONS[idx] == exp) {
                return true;
              }
            }
            return false;
          }

          var isAssociativeOperator = function(exp) {
            return exp == AND_EXPRESSIONS[0] || exp == OR_EXPRESSIONS[0] || exp == XOR_EXPRESSIONS[0];
          }

          var invalidParentheses = function(expression) {
            return expression.split(OPEN_PARENS).length != expression.split(CLOSE_PARENS).length;
          }

          var getBinaryIndex = function(array) {
            var binaryIndex = -1;
            for (var idx = 0; idx < array.length; idx++) {
              if (isBinaryOperator(array[idx])) {
                binaryIndex = idx;
                break;
              }
            }
            return binaryIndex;
          }

          var isAmbiguousArray = function(array) {
            var unique = false;
            var binaryCount = 0;
            var associativeCount = 0;
            for (var i = 0; i < array.length; i++) {
              var temp = array[i];
              if (isBinaryOperator(temp)) {
                if (isAssociativeOperator(temp)) {
                  associativeCount++;
                  if (unique == false) {
                    unique = temp;
                  } else {
                    if (unique != temp) {
                      return true;
                    }
                  }
                  if (binaryCount > 0) {
                    return true;
                  }
                } else {
                  binaryCount++;
                  if (associativeCount > 0 || binaryCount > 1) {
                    return true;
                  }
                }
              }
            }
            return false;
          }
        };

        // Settings from simplify/settings.js (headless, no DOM/localStorage)
        const Settings = new function() {
          // Default to short law names and skip COM/ASS like the UI's defaults
          const checkBoxDict = {
            short: true,
            com: true,   // skip Commutative
            ass: true,   // skip Associative
            dist: false,
            i: false,
            neg: false,
            dneg: false,
            id: false,
            ub: false,
            dm: false,
            abs: false,
            ntf: false,
            imp: false,
            xor: false,
            selectAll: false
          };

          this.getValue = function(key) { return checkBoxDict[key]; }
          this.skipLaw = function(law) {
            return checkBoxDict[getLawName(law, true).toLowerCase()];
          }
        };

        // Equivalency Laws from equivalency.js
        var distributeOutwards = true;

        function customSort(expA, expB) {
          var stringA = expA.toString();
          var stringB = expB.toString();
          if (stringA.charAt(0) == SYMBOL.NOT) {
            stringA = stringA.substr(1);
          }
          if (stringB.charAt(0) == SYMBOL.NOT) {
            stringB = stringB.substr(1);
          }
          if (stringA.length < stringB.length) {
            return -1;
          } else if (stringB.length < stringA.length) {
            return 1;
          } else {
            if (stringA < stringB) {
              return -1;
            } else if (stringA > stringB) {
              return 1;
            } else {
              return 0;
            }
          }
        }

        function commutative(expression) {
          var type;
          if (expression instanceof OrExpression) {
            type = OrExpression;
          } else if (expression instanceof AndExpression) {
            type = AndExpression;
          } else {
            return false;
          }
          var newSubs = expression.subs.concat().sort(customSort);
          if (newSubs.toString() == expression.subs.toString()) {
            return false;
          }
          var returnVal = new type(newSubs);
          if (returnVal instanceof Array) {
            throw "eror comm"
          }
          return returnVal;
        }

        function associative(expression) {
          if (expression instanceof AndExpression) {
            var newSubs = associativeHelper(expression.subs, AndExpression);
            if (newSubs.length == expression.subs.length) {
              return false;
            }
            return new AndExpression(newSubs);
          } else if (expression instanceof OrExpression) {
            var newSubs = associativeHelper(expression.subs, OrExpression);
            if (newSubs.length == expression.subs.length) {
              return false;
            }
            return new OrExpression(newSubs);
          }
          return false;
        }

        function associativeHelper(subs, type) {
          var array = [];
          for (var i = 0; i < subs.length; i++) {
            var sub = subs[i];
            if (sub instanceof type) {
              array = array.concat(associativeHelper(sub.subs, type));
            } else {
              array.push(sub);
            }
          }
          return array;
        }

        function distributive(expression) {
          if (!distributeOutwards) {
            return undistribute(expression);
          }
          var type;
          var opposite;
          if (expression instanceof AndExpression) {
            type = AndExpression;
            opposite = OrExpression;
          } else if (expression instanceof OrExpression) {
            type = OrExpression;
            opposite = AndExpression;
          } else {
            return false;
          }
          var idx = distributiveHelper(expression.subs, opposite);
          if (idx == false) {
            return false;
          }
          if (idx == -1) {
            return false;
          }
          var orExp = expression.subs[idx];
          var others = expression.subs.slice(0, idx).concat(expression.subs.slice(idx + 1));
          var newArray = [];
          for (var i = 0; i < orExp.subs.length; i++) {
            var copy = others.slice();
            copy.push(orExp.subs[i])
            newArray.push(new type(copy));
          }
          return new opposite(newArray);
        }

        function undistribute(expression) {
          var type;
          var opposite;
          if (expression instanceof AndExpression) {
            type = AndExpression;
            opposite = OrExpression;
          } else if (expression instanceof OrExpression) {
            type = OrExpression;
            opposite = AndExpression;
          } else {
            return false;
          }
          var others = [];
          for (var i = 0; i < expression.subs.length; i++) {
            var sub = expression.subs[i];
            if (sub instanceof opposite) {
              others.push(sub);
            }
          }
          if (others.length < 2) {
            return false;
          }
          var commonVars = others[0].subs.slice();
          var notCommon = [];
          for (var i = 1; i < others.length; i++) {
            for (var j = 0; j < commonVars.length; j++) {
              if (!(others[i].contains(commonVars[j]))) {
                notCommon.push(commonVars[j]);
              }
            }
          }
          var tempExp = new AndExpression(notCommon);
          var commons = [];
          for (var i = 0; i < commonVars.length; i++) {
            if (!(tempExp.contains(commonVars[i]))) {
              commons.push(commonVars[i]);
            }
          }
          if (commons.length == 0) {
            return false;
          } else {
            commons = new opposite(commons);
          }
          var newOthers = [];
          for (var i = 0; i < others.length; i++) {
            var other = others[i];
            var newOther = [];
            for (var j = 0; j < other.subs.length; j++) {
              var sub = other.subs[j];
              if (commons.contains(sub)) {
              } else {
                newOther.push(sub);
              }
            }
            if (newOther.length == 1) {
              newOthers.push(newOther[0]);
            } else {
              newOthers.push(new opposite(newOther));
            }
          }
          newOthers = new type(newOthers);
          commons.subs.push(newOthers);
          return commons;
        }

        function distributiveHelper(subs, searchFor) {
          var allSearchFors = true;
          var index = -1;
          for (var i = 0; i < subs.length; i++) {
            if (subs[i] instanceof searchFor) {
              if (index == -1) {
                index = i;
              }
            } else {
              allSearchFors = false;
            }
          }
          if (allSearchFors) {
            return false;
          }
          return index;
        }

        function identity(expression) {
          var toRemove;
          var type;
          if (expression instanceof OrExpression) {
            type = OrExpression;
            toRemove = False;
          } else if (expression instanceof AndExpression) {
            type = AndExpression;
            toRemove = True;
          } else {
            return false;
          }
          if (expression.subs.includes(toRemove)) {
            var newSubs = expression.subs.filter(item => item != toRemove);
            if (newSubs.length == 0) {
              return toRemove;
            } else if (newSubs.length == 1) {
              return newSubs[0];
            } else {
              return new type(newSubs);
            }
          }
          return false;
        }

        function negation(expression) {
          var replacement;
          if (expression instanceof OrExpression) {
            replacement = True;
          } else if (expression instanceof AndExpression) {
            replacement = False;
          } else {
            return false;
          }
          var notNots = [];
          for (var i = 0; i < expression.subs.length; i++) {
            var sub = expression.subs[i];
            if (sub instanceof NotExpression) {
              var inner = sub.subs[0];
              if (notNots.includes(inner)) {
                return replacement;
              }
            } else {
              notNots.push(sub);
            }
          }
          for (var i = 0; i < expression.subs.length; i++) {
            var sub = expression.subs[i];
            if (sub instanceof NotExpression) {
              var inner = sub.subs[0];
              if (notNots.includes(inner)) {
                return replacement;
              }
            }
          }
          return false;
        }

        function doubleNegation(expression) {
          if (expression instanceof NotExpression) {
            if (expression.subs[0] instanceof NotExpression) {
              return expression.subs[0].subs[0];
            }
          }
          return false;
        }

        function idempotent(expression) {
          var type;
          if (expression instanceof OrExpression) {
            type = OrExpression;
          } else if (expression instanceof AndExpression) {
            type = AndExpression;
          } else {
            return false;
          }
          var newArray = [];
          var changed = false;
          for (var i = 0; i < expression.subs.length; i++) {
            var sub = expression.subs[i];
            if (newArray.length == 0 || !newArray[newArray.length - 1].equals(sub)) {
              newArray.push(sub);
            } else {
              changed = true;
            }
          }
          if (changed == false) {
            return false;
          }
          if (newArray.length == 1) {
            return newArray[0];
          }
          return new type(newArray);
        }

        function universalBound(expression) {
          var toCheck;
          if (expression instanceof OrExpression) {
            toCheck = True;
          } else if (expression instanceof AndExpression) {
            toCheck = False;
          } else {
            return false;
          }
          if (expression.subs.includes(toCheck)) {
            return toCheck;
          } else {
            return false;
          }
        }

        function deMorgans(expression) {
          if (expression instanceof NotExpression) {
            var sub = expression.subs[0];
            var newSubs = [];
            if (sub instanceof OrExpression) {
              for (var i = 0; i < sub.subs.length; i++) {
                newSubs.push(new NotExpression([sub.subs[i]]));
              }
              return new AndExpression(newSubs);
            } else if (sub instanceof AndExpression) {
              for (var i = 0; i < sub.subs.length; i++) {
                newSubs.push(new NotExpression([sub.subs[i]]));
              }
              return new OrExpression(newSubs);
            }
          }
          return false;
        }

        function absorption(expression) {
          var type;
          var innerType;
          if (expression instanceof OrExpression) {
            type = OrExpression;
            innerType = AndExpression;
          } else if (expression instanceof AndExpression) {
            type = AndExpression;
            innerType = OrExpression;
          } else {
            return false;
          }
          var others = [];
          for (var i = 0; i < expression.subs.length; i++) {
            var sub = expression.subs[i];
            if (sub instanceof innerType) {
              others.push(sub);
            }
          }
          if (others.length == 0) {
            return false;
          }
          var toRemove = [];
          for (var i = 0; i < others.length; i++) {
            var other = others[i];
            for (var j = 0; j < expression.subs.length; j++) {
              var inner = expression.subs[j];
              if (!(other.equals(inner)) && other.contains(inner)) {
                toRemove.push(other);
                break;
              }
            }
          }
          var newArray = [];
          var changed = false;
          for (var i = 0; i < expression.subs.length; i++) {
            var sub = expression.subs[i];
            if (!toRemove.includes(sub)) {
              newArray.push(sub);
            } else {
              changed = true;
            }
          }
          if (!changed) {
            return false;
          }
          if (newArray.length == 0) {
            return expression.subs[0];
          }
          if (newArray.length == 1) {
            return newArray[0];
          }
          return new type(newArray);
        }

        function negationsOfTF(expression) {
          if (expression instanceof NotExpression) {
            if (expression.subs[0] == False) {
              return True;
            } else if (expression.subs[0] == True) {
              return False;
            }
          }
          return false;
        }

        const EquivalencyLaws = [
          // Order mirrors original simplify/equivalency.js (omitting implication/xor)
          identity,
          negation,
          doubleNegation,
          negationsOfTF,
          universalBound,
          associative,
          commutative,
          idempotent,
          absorption,
          deMorgans,
          distributive
        ];

        const longDict = {
          commutative: "Commutative",
          associative: "Associative",
          distributive: "Distributive",
          identity: "Identity",
          negation: "Negation",
          doubleNegation: "Double Negation",
          idempotent: "Idempotent",
          universalBound: "Universal Bound",
          deMorgans: "De Morgan's",
          absorption: "Absorption",
          negationsOfTF: "Negations of T and F"
        };
        const shortDict = {
          commutative: "COM",
          associative: "ASS",
          distributive: "DIST",
          identity: "I",
          negation: "NEG",
          doubleNegation: "DNEG",
          idempotent: "ID",
          universalBound: "UB",
          deMorgans: "DM",
          absorption: "ABS",
          negationsOfTF: "NTF"
        };

        function getLawName(lawFunction, useShort = Settings.getValue("short")) {
          const dict = useShort ? shortDict : longDict;
          return dict[lawFunction.name] || lawFunction.name;
        }

        function Step(expression, law) {
          this.result = expression;
          this.lawString = law;
          this.extraData = null;
        }

        const Equivalency = new function() {
          const TIMEOUT_STEPS = 100;

          this.simplify = function(expression) {
            var steps = [];
            var current = expression;
            var stepsCount = 0;
            distributeOutwards = true;
            for (var i = 0; i < EquivalencyLaws.length; i++) {
              var law = EquivalencyLaws[i];
              var attempt = applyLawOnce(current, law);
              if (attempt == false) {
                if (i == EquivalencyLaws.length - 1) {
                  if (distributeOutwards) {
                    distributeOutwards = false;
                    i = -1;
                  }
                }
                continue;
              }
              current = attempt;
              if (!Settings.skipLaw(law)) {
                if (law == distributive) {
                  if (steps.length != 0 && (steps[steps.length - 1].extraData == true) && !distributeOutwards) {
                    steps.pop();
                  } else {
                    var newStep = new Step(current.toString(), "by " + getLawName(law));
                    newStep.extraData = distributeOutwards;
                    steps.push(newStep);
                  }
                } else {
                  steps.push(new Step(current.toString(), "by " + getLawName(law)));
                }
              }
              i = -1;
              if (++stepsCount > TIMEOUT_STEPS) {
                throw "Simplification timed out!";
              }
            }
            steps.push(new Step(current.toString(), "result"));
            return steps;
          }

          var applyLawOnce = function(expression, lawFunction) {
            var applied = lawFunction(expression);
            if (applied != false) {
              return applied;
            } else {
              var subs = expression.subs;
              if (subs == null) {
                return false;
              } else {
                var newSubs = [];
                var didApply = false;
                for (var i = 0; i < subs.length; i++) {
                  var subApplied = applyLawOnce(subs[i], lawFunction);
                  if (subApplied != false) {
                    newSubs.push(subApplied);
                    newSubs = newSubs.concat(subs.splice(i + 1));
                    didApply = true;
                    break;
                  } else {
                    newSubs.push(subs[i]);
                  }
                }
                if (didApply) {
                  return new expression.constructor(newSubs);
                } else {
                  return false;
                }
              }
            }
          }
        };

        // AST-based uid annotation and tokenizer for UI
        function hashString(str) {
          var h = 5381;
          for (var i = 0; i < str.length; i++) {
            h = ((h << 5) + h) + str.charCodeAt(i);
            h = h & h; // keep in 32bit
          }
          return (h >>> 0).toString(36);
        }

        this.annotateNodeUids = function(node) {
          // assign deterministic uid based on subtree string
          function walk(n) {
            if (!n) return;
            var key = n.toString();
            n._uid = n._uid || (n.constructor.name + '_' + hashString(key));
            if (n.subs && n.subs.length) {
              for (var i = 0; i < n.subs.length; i++) {
                walk(n.subs[i]);
              }
            } else if (n instanceof NotExpression && n.subs && n.subs[0]) {
              walk(n.subs[0]);
            }
          }
          walk(node);
          return node;
        };

        this.tokenizeASTForUI = function(node) {
          var tokens = [];
          var parenCounter = 0;
          function emit(text, kind, id) {
            tokens.push({ id: id || (text + '_' + tokens.length), text: text, kind: kind });
          }

          function walk(n) {
            if (n == null) return;
            if (n instanceof Variable) {
              emit(n.toString(), 'var', n._uid);
            } else if (n instanceof NotExpression) {
              // unary operator token
              emit(SYMBOL.NOT, 'op', n._uid + '_not');
              walk(n.subs[0]);
            } else if (n instanceof AndExpression || n instanceof OrExpression) {
              // parentheses
              emit('(', 'paren', n._uid + '_lp' + (parenCounter++));
              for (var i = 0; i < n.subs.length; i++) {
                walk(n.subs[i]);
                if (i < n.subs.length - 1) {
                  emit(n instanceof AndExpression ? SYMBOL.AND : SYMBOL.OR, 'op', n._uid + '_op_' + i);
                }
              }
              emit(')', 'paren', n._uid + '_rp' + (parenCounter++));
            } else {
              // fallback: emit string
              emit(n.toString(), 'other', n._uid || ('node_' + hashString(n.toString())));
            }
          }

          walk(node);
          return tokens;
        };
        // Export main functions
        this.parseExpression = function(expr) {
          VariableManager.clear();
          return Parser.parse(expr);
        };

        this.simplifyExpression = function(expr) {
          VariableManager.clear();
          var parsed = Parser.parse(expr);
          var steps = Equivalency.simplify(parsed);
          // Return previous shape but also allow frontend to request AST tokenization via annotate/tokenize helpers
          return {
            originalExpression: expr,
            simplifiedExpression: steps[steps.length - 1].result,
            steps: steps
              .filter(function(s) { return s.lawString !== 'result'; })
              .map(function(step) {
                return {
                  expression: step.result,
                  law: step.lawString,
                  lawName: step.lawString.replace('by ', '')
                };
              }),
            stepLines: steps
              .filter(function(s) { return s.lawString !== 'result'; })
              .map(function(step) { return step.result + step.lawString; })
          };
        };

        this.evaluateExpression = function(expr, assignments) {
          VariableManager.clear();
          var parsed = Parser.parse(expr);
          return parsed.evaluate(assignments);
        };

        this.generateTruthTable = function(expr) {
          VariableManager.clear();
          var parsed = Parser.parse(expr);
          var variables = VariableManager.getVariables();
          var assignments = VariableManager.getTruthAssignments();
          
          var table = [];
          for (var i = 0; i < assignments.length; i++) {
            var assignment = assignments[i];
            var result = parsed.evaluate(assignment);
            var row = Object.assign({}, assignment);
            row.result = result;
            table.push(row);
          }
          
          return {
            variables: variables.map(v => v.variableName),
            table: table
          };
        };
      `;

      runInContext(jsCode, this.jsContext);
    } catch (error) {
      this.logger.error('Failed to initialize JavaScript context:', error);
      throw new Error('Calculator initialization failed');
    }
  }

  private sanitizeExpression(expression: string): string {
    // Allow variables, operators, parentheses, and the symbols ^ and v
    return expression.replace(/[^\w\s∧∨¬()~!^v]/g, '');
  }

  async simplifyExpression(expression: string): Promise<CalculationResponse> {
    try {
      const sanitizedExpression = this.sanitizeExpression(expression);
      // call the JS simplifier (embedded in the vm context)
      const result: any = runInContext(
        `this.simplifyExpression("${sanitizedExpression}")`,
        this.jsContext,
      );

      // Build linear list of expressions: original + each step expression
      const exprList: string[] = [];
      exprList.push(result.originalExpression);
      (result.steps || []).forEach((s: any) => exprList.push(s.expression));

      // Tokenize each expression via the injected AST-based helpers in the VM
      const tokenizedList: Array<Array<{ text: string; kind: string; id?: string }>> = exprList.map((expr) => {
        try {
          const code = `(function(){ var p = this.parseExpression(${JSON.stringify(expr)}); this.annotateNodeUids(p); return this.tokenizeASTForUI(p); })()`;
          return runInContext(code, this.jsContext) as any;
        } catch (e) {
          // fallback naive tokenizer
          const fallback = (expr.match(/[A-Za-z]+'+|[A-Za-z]+|[∧∨⊕→↔¬()]/g) || []).map(m => ({ text: m, kind: (/^[A-Za-z]/.test(m) ? 'var' : (/^[() ]$/.test(m) ? 'paren' : 'op')) }));
          return fallback;
        }
      });

      // Create a stable id registry from the original expression tokens (use AST ids when available)
      const registry: Record<string, string[]> = {};
      const usedIndex: Record<string, number> = {};
      function sanitizeId(text: string) {
        return text.replace(/[^a-zA-Z0-9]/g, (c) => '_' + c.charCodeAt(0).toString(16));
      }
      // assign ids for original tokens
      tokenizedList[0].forEach((t: any, i: number) => {
        const key = t.id || t.text;
        const id = t.id || `tok_${sanitizeId(t.text)}_${i}`;
        registry[key] = registry[key] || [];
        registry[key].push(id);
      });

      let newCounter = 0;
      // helper to get next id for a token text or AST uid
      function nextIdFor(text: string) {
        usedIndex[text] = usedIndex[text] || 0;
        if (registry[text] && usedIndex[text] < registry[text].length) {
          return registry[text][usedIndex[text]++];
        }
        const id = `new_${sanitizeId(text)}_${newCounter++}`;
        registry[text] = registry[text] || [];
        registry[text].push(id);
        usedIndex[text]++;
        return id;
      }

      // build script steps: for each simplification step produce before/after states
      const steps: any[] = [];
      const jsSteps = result.steps || [];
      for (let i = 0; i < jsSteps.length; i++) {
        const beforeTokensRaw = tokenizedList[i] || [];
        const afterTokensRaw = tokenizedList[i + 1] || [];

        // build keys for before/after (use provided id if available, else text_index)
        const beforeKeys: string[] = beforeTokensRaw.map((t: any, idx: number) => t.id || `${t.text}_${idx}`);
        const afterKeys: string[] = afterTokensRaw.map((t: any, idx: number) => t.id || `${t.text}_${idx}`);

        // reset usedIndex each step so reuse favors earliest available ids in order
        Object.keys(usedIndex).forEach(k => usedIndex[k] = 0);

        // create mapped tokens with stable ids
        const beforeTokens = beforeTokensRaw.map((t: any, idx: number) => {
          const key = t.id || `${t.text}_${idx}`;
          const id = nextIdFor(key);
          return { id, text: t.text, kind: t.kind, highlight: false };
        });

        const afterTokens = afterTokensRaw.map((t: any, idx: number) => {
          const key = t.id || `${t.text}_${idx}`;
          const id = nextIdFor(key);
          const isNew = !beforeKeys.includes(key);
          return { id, text: t.text, kind: t.kind, isNew, highlight: false };
        });

        // compute highlight tokens: tokens that were added or removed in this step
        const beforeSet = new Set(beforeKeys);
        const afterSet = new Set(afterKeys);
        const added = new Set<string>(afterKeys.filter(k => !beforeSet.has(k)));
        const removed = new Set<string>(beforeKeys.filter(k => !afterSet.has(k)));
        const changedKeys = new Set<string>([...added, ...removed]);

        // mark highlights on before and after token arrays by matching their original keys
        const markIdFromKey = (key: string) => {
          // return the assigned id from registry (first occurrence)
          const arr = registry[key];
          return arr && arr.length ? arr[0] : undefined;
        }

        const changedIds = new Set<string>();
        changedKeys.forEach(k => {
          const mapped = registry[k];
          if (mapped && mapped.length) mapped.forEach((mid: string) => changedIds.add(mid));
        });

        // Apply highlight flag
        beforeTokens.forEach(bt => {
          bt.highlight = changedIds.has(bt.id);
        });
        afterTokens.forEach(at => {
          at.highlight = changedIds.has(at.id) || at.isNew;
        });

        steps.push({
          id: String(i + 1),
          law: (jsSteps[i].lawName || jsSteps[i].law || '').toLowerCase(),
          description: jsSteps[i].law || jsSteps[i].lawName || undefined,
          before: { raw: exprList[i], tokens: beforeTokens },
          after: { raw: exprList[i + 1], tokens: afterTokens },
        });
      }

      const script = {
        defaultExpression: result.originalExpression,
        steps: steps,
      };

      return {
        success: true,
        result: script,
      };
    } catch (error: any) {
      return {
        success: false,
        result: null,
        error: error?.message || 'Failed to simplify expression',
      };
    }
  }

  async evaluateExpression(
    expression: string,
    assignments: Record<string, boolean>,
  ): Promise<CalculationResponse> {
    try {
      const sanitizedExpression = this.sanitizeExpression(expression);
      
      const result = runInContext(
        `this.evaluateExpression("${sanitizedExpression}", ${JSON.stringify(assignments)})`,
        this.jsContext,
      );

      return {
        success: true,
        result: {
          expression: sanitizedExpression,
          assignments: assignments,
          result: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message || 'Failed to evaluate expression',
      };
    }
  }

  async generateTruthTable(expression: string): Promise<CalculationResponse> {
    try {
      const sanitizedExpression = this.sanitizeExpression(expression);
      
      const result = runInContext(
        `this.generateTruthTable("${sanitizedExpression}")`,
        this.jsContext,
      );

      return {
        success: true,
        result: {
          expression: sanitizedExpression,
          variables: result.variables,
          table: result.table,
        },
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message || 'Failed to generate truth table',
      };
    }
  }

  async calculate(expression: string): Promise<CalculationResponse> {
    return this.simplifyExpression(expression);
  }
}