const MAX_DIGITS = 12;

// Basic operations
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;

// Calls the right function for the operator.
// Returns null if the operation can't be done (divide by zero).
function operate(operator, a, b) {
  let result;

  switch (operator) {
    case "+":
      result = add(a, b);
      break;
    case "-":
      result = subtract(a, b);
      break;
    case "*":
      result = multiply(a, b);
      break;
    case "/":
      if (b === 0) return null;
      result = divide(a, b);
      break;
    default:
      return null;
  }

  // Round to 10 significant digits so long decimals fit on the display
  return Number(result.toPrecision(10));
}

// Converts a number to text that fits on the display
function toDisplayString(n) {
  const text = String(n);
  return text.length <= MAX_DIGITS ? text : n.toExponential(5);
}

// Everything the calculator needs to remember
const state = {
  firstNumber: null,    // number on the left of the operator
  operator: null,       // "+", "-", "*", or "/"
  currentInput: "",     // digits the user is typing right now
  justEvaluated: false, // true right after "=" shows a result
  error: null,          // message to show instead of a number
};

const displayEl = document.getElementById("display");
const decimalBtn = document.querySelector('button[data-key="."]');

function resetState() {
  state.firstNumber = null;
  state.operator = null;
  state.currentInput = "";
  state.justEvaluated = false;
  state.error = null;
}

function showDivideByZero() {
  resetState();
  state.error = "Nice try, genius!";
}

function getDisplayText() {
  if (state.error) return state.error;
  if (state.currentInput !== "") return state.currentInput;
  if (state.firstNumber !== null) return toDisplayString(state.firstNumber);
  return "0";
}

function handleDigit(digit) {
  // A digit after a result starts a new calculation
  if (state.justEvaluated) {
    state.currentInput = "";
    state.justEvaluated = false;
  }

  if (state.currentInput.length >= MAX_DIGITS) return;

  // Replace a lone 0 instead of building up "007"
  state.currentInput = state.currentInput === "0" ? digit : state.currentInput + digit;
}

function handleDecimal() {
  if (state.justEvaluated) {
    state.currentInput = "";
    state.justEvaluated = false;
  }

  // Only one decimal point per number
  if (state.currentInput.includes(".")) return;
  if (state.currentInput.length >= MAX_DIGITS) return;

  state.currentInput = state.currentInput === "" ? "0." : state.currentInput + ".";
}

function handleOperator(op) {
  state.justEvaluated = false;

  if (state.currentInput !== "") {
    const num = parseFloat(state.currentInput);

    if (state.firstNumber === null) {
      // First number of the calculation
      state.firstNumber = num;
    } else {
      // Chaining: evaluate the pending operation before starting the next one
      const result = operate(state.operator, state.firstNumber, num);
      if (result === null) return showDivideByZero();
      state.firstNumber = result;
    }

    state.currentInput = "";
  } else if (state.firstNumber === null) {
    // No number entered yet, so there's nothing to operate on
    return;
  }
  // If there's no new number but a first number exists, this is a second
  // operator in a row. Ignore the previous one and use the latest.

  state.operator = op;
}

function handleEquals() {
  // Need a complete operation: first number, operator, and second number
  if (state.operator === null || state.firstNumber === null || state.currentInput === "") {
    return;
  }

  const result = operate(state.operator, state.firstNumber, parseFloat(state.currentInput));
  if (result === null) return showDivideByZero();

  state.currentInput = toDisplayString(result);
  state.firstNumber = null;
  state.operator = null;
  state.justEvaluated = true;
}

function handleBackspace() {
  state.currentInput = state.currentInput.slice(0, -1);
}

// Every button (mouse or keyboard) goes through this function
function handleInput(key) {
  // Any input after an error starts fresh
  if (state.error) resetState();

  if (/^[0-9]$/.test(key)) handleDigit(key);
  else if (key === ".") handleDecimal();
  else if (["+", "-", "*", "/"].includes(key)) handleOperator(key);
  else if (key === "=") handleEquals();
  else if (key === "Backspace") handleBackspace();
  else if (key === "Clear") resetState();

  updateDisplay();
}

function updateDisplay() {
  const text = getDisplayText();
  displayEl.textContent = text;
  displayEl.classList.toggle("error", state.error !== null);

  // Disable the decimal button when the display already has one
  decimalBtn.disabled = text.includes(".");
}

// Mouse clicks
document.getElementById("buttons").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (btn) handleInput(btn.dataset.key);
});

// Keyboard support
const KEY_ALIASES = {
  Enter: "=",
  Escape: "Clear",
  c: "Clear",
  C: "Clear",
  ",": ".",
};

document.addEventListener("keydown", (e) => {
  const key = KEY_ALIASES[e.key] ?? e.key;
  const btn = document.querySelector(`button[data-key="${CSS.escape(key)}"]`);

  // Ignore keys that don't match a button
  if (!btn) return;

  // Stop the browser from using these keys (for example, Backspace going "back")
  e.preventDefault();

  // Flash the button briefly so the user can see which key registered
  btn.classList.add("active");
  setTimeout(() => btn.classList.remove("active"), 100);

  // Clicking a disabled button does nothing, so the decimal key is blocked too
  btn.click();
});

updateDisplay();