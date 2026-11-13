/* LW11 form behavior; LW12 skill dashboard behavior is added below later. */
(function () {
  "use strict";

  const formFieldNames = [
    "firstName", "lastName", "email", "phone", "address",
    "ratingContent", "ratingDesign", "ratingUsability"
  ];

  function phoneLocalDigits(value) {
    let digits = String(value).replace(/\D/g, "");
    if (digits.startsWith("370")) digits = digits.slice(3);
    else if (/^[08]6/.test(digits)) digits = digits.slice(1);
    return digits.slice(0, 8);
  }

  function formatLithuanianPhone(value) {
    const digits = phoneLocalDigits(value);
    if (!digits) return "";
    return "+370 " + digits.slice(0, 3) + (digits.length > 3 ? " " + digits.slice(3) : "");
  }

  function phoneCaretPosition(formatted, localDigitCount) {
    if (localDigitCount <= 0) return Math.min(5, formatted.length);
    let seen = 0;
    for (let i = 5; i < formatted.length; i += 1) {
      if (/\d/.test(formatted[i])) seen += 1;
      if (seen === localDigitCount) return i + 1;
    }
    return formatted.length;
  }

  function validationMessage(name, rawValue) {
    const value = String(rawValue).trim();
    if (!value) return "This field is required.";
    if (name === "firstName" || name === "lastName") {
      return /^\p{L}+$/u.test(value) ? "" : "Use letters only.";
    }
    if (name === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address.";
    }
    if (name === "phone") {
      return /^\+370 6\d{2} \d{5}$/.test(value) ? "" : "Enter a Lithuanian mobile number: +370 6xx xxxxx.";
    }
    if (name.startsWith("rating")) {
      return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10
        ? "" : "Enter a whole number from 1 to 10.";
    }
    return "";
  }

  function calculateAverage(ratings) {
    return ratings.reduce((sum, rating) => sum + Number(rating), 0) / ratings.length;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { formatLithuanianPhone, validationMessage, calculateAverage };
  }
  if (typeof document === "undefined") return;

  const form = document.getElementById("cv-feedback-form");
  if (!form) return;

  const fields = Object.fromEntries(formFieldNames.map((name) => [name, form.elements.namedItem(name)]));
  const submitButton = document.getElementById("submit-feedback");
  const clearButton = document.getElementById("clear-feedback");
  const resultPanel = document.getElementById("form-results");
  const touched = new Set();

  function showFieldFeedback(name) {
    const field = fields[name];
    const error = validationMessage(name, field.value);
    const showError = touched.has(name) && Boolean(error);
    const errorElement = document.getElementById(field.id + "-error");
    errorElement.textContent = showError ? error : "";
    field.classList.toggle("is-invalid", showError);
    field.setAttribute("aria-invalid", String(showError));
    return error === "";
  }

  function updateFormState() {
    const valid = formFieldNames.map(showFieldFeedback).every(Boolean);
    submitButton.disabled = !valid;
    return valid;
  }

  function updatePhoneInput() {
    const field = fields.phone;
    const cursor = field.selectionStart ?? field.value.length;
    const digitsBefore = phoneLocalDigits(field.value.slice(0, cursor)).length;
    const formatted = formatLithuanianPhone(field.value);
    field.value = formatted;
    if (document.activeElement === field) {
      const nextCursor = phoneCaretPosition(formatted, digitsBefore);
      field.setSelectionRange(nextCursor, nextCursor);
    }
  }

  formFieldNames.forEach((name) => {
    const field = fields[name];
    field.addEventListener("input", () => {
      if (name === "phone") updatePhoneInput();
      touched.add(name);
      updateFormState();
    });
    field.addEventListener("blur", () => {
      touched.add(name);
      updateFormState();
    });
  });

  fields.phone.addEventListener("keydown", (event) => {
    const field = fields.phone;
    const cursor = field.selectionStart;
    if (event.key !== "Backspace" || cursor !== field.selectionEnd || cursor <= 5 || field.value[cursor - 1] !== " ") return;
    event.preventDefault();
    const digits = phoneLocalDigits(field.value);
    const before = phoneLocalDigits(field.value.slice(0, cursor)).length;
    field.value = formatLithuanianPhone(digits.slice(0, before - 1) + digits.slice(before));
    const nextCursor = phoneCaretPosition(field.value, before - 1);
    field.setSelectionRange(nextCursor, nextCursor);
    touched.add("phone");
    updateFormState();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formFieldNames.forEach((name) => touched.add(name));
    if (!updateFormState()) return;

    const data = {
      firstName: fields.firstName.value.trim(),
      lastName: fields.lastName.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      address: fields.address.value.trim(),
      ratingContent: Number(fields.ratingContent.value),
      ratingDesign: Number(fields.ratingDesign.value),
      ratingUsability: Number(fields.ratingUsability.value)
    };
    console.log(data);

    const resultIds = {
      firstName: "result-first-name", lastName: "result-last-name", email: "result-email",
      phone: "result-phone", address: "result-address", ratingContent: "result-rating-content",
      ratingDesign: "result-rating-design", ratingUsability: "result-rating-usability"
    };
    Object.entries(resultIds).forEach(([key, id]) => {
      document.getElementById(id).textContent = String(data[key]);
    });
    const average = calculateAverage([data.ratingContent, data.ratingDesign, data.ratingUsability]);
    document.getElementById("rating-average").textContent = data.firstName + " " + data.lastName + ": " + average.toFixed(2);
    resultPanel.hidden = false;
  });

  clearButton.addEventListener("click", () => {
    form.reset();
    touched.clear();
    formFieldNames.forEach((name) => {
      const field = fields[name];
      field.classList.remove("is-invalid");
      field.setAttribute("aria-invalid", "false");
      document.getElementById(field.id + "-error").textContent = "";
    });
    resultPanel.querySelectorAll("dd").forEach((element) => { element.textContent = ""; });
    document.getElementById("rating-average").textContent = "";
    resultPanel.hidden = true;
    submitButton.disabled = true;
  });

  updateFormState();
})();
