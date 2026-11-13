const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'assets', 'js', 'custom.js');
const { formatLithuanianPhone, validationMessage, calculateAverage } = require(scriptPath);

test('Lithuanian mobile input is formatted without changing its digits', () => {
  assert.equal(formatLithuanianPhone('37061234567'), '+370 612 34567');
  assert.equal(formatLithuanianPhone('861234567'), '+370 612 34567');
  assert.equal(formatLithuanianPhone('+370 612 34567'), '+370 612 34567');
  assert.equal(formatLithuanianPhone('3706123456789'), '+370 612 34567');
});

test('required fields, Unicode names, email, phone and ratings are validated', () => {
  assert.match(validationMessage('firstName', ''), /required/i);
  assert.equal(validationMessage('firstName', 'Efe'), '');
  assert.equal(validationMessage('lastName', 'Žukauskas'), '');
  assert.match(validationMessage('lastName', 'Smith2'), /letters/i);
  assert.match(validationMessage('email', 'bad@'), /valid email/i);
  assert.equal(validationMessage('email', 'efe@example.org'), '');
  assert.match(validationMessage('phone', '+370 512 34567'), /Lithuanian/i);
  assert.match(validationMessage('phone', '+370 612 3456'), /Lithuanian/i);
  assert.equal(validationMessage('phone', '+370 612 34567'), '');
  assert.match(validationMessage('ratingContent', '0'), /1 to 10/i);
  assert.match(validationMessage('ratingDesign', '11'), /1 to 10/i);
  assert.match(validationMessage('ratingUsability', '2.5'), /whole number/i);
  assert.equal(validationMessage('ratingUsability', '10'), '');
});

test('average is arithmetic mean of the three ratings', () => {
  assert.equal(calculateAverage([8, 9, 10]), 9);
  assert.equal(calculateAverage([7, 8, 9]), 8);
});

function formHarness() {
  const names = ['firstName', 'lastName', 'email', 'phone', 'address', 'ratingContent', 'ratingDesign', 'ratingUsability'];
  const ids = ['first-name', 'last-name', 'contact-email', 'contact-phone', 'contact-address', 'rating-content', 'rating-design', 'rating-usability'];
  const elements = new Map();
  const fields = {};
  function element(id) {
    const listeners = new Map();
    const classes = new Set();
    return {
      id, value: '', textContent: '', hidden: false, disabled: false,
      selectionStart: 0, selectionEnd: 0,
      classList: {
        toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
        remove(name) { classes.delete(name); },
        contains(name) { return classes.has(name); }
      },
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
      addEventListener(name, handler) { listeners.set(name, handler); },
      fire(name, details = {}) { const event = { preventDefault() { event.prevented = true; }, key: '', ...details }; listeners.get(name)(event); return event; }
    };
  }
  names.forEach((name, i) => {
    fields[name] = element(ids[i]);
    elements.set(ids[i], fields[name]);
    elements.set(ids[i] + '-error', element(ids[i] + '-error'));
  });
  const form = element('cv-feedback-form');
  form.elements = { namedItem(name) { return fields[name]; } };
  form.reset = () => names.forEach((name) => { fields[name].value = ''; });
  elements.set(form.id, form);
  const submit = element('submit-feedback'); submit.disabled = true; elements.set(submit.id, submit);
  const clear = element('clear-feedback'); elements.set(clear.id, clear);
  const results = element('form-results'); results.hidden = true; elements.set(results.id, results);
  const resultIds = ['result-first-name', 'result-last-name', 'result-email', 'result-phone', 'result-address', 'result-rating-content', 'result-rating-design', 'result-rating-usability'];
  const resultFields = resultIds.map((id) => element(id));
  resultFields.forEach((value) => elements.set(value.id, value));
  results.querySelectorAll = () => resultFields;
  elements.set('rating-average', element('rating-average'));
  const document = { activeElement: null, getElementById(id) { return elements.get(id) || null; } };
  const logged = [];
  const context = { document, console: { log(value) { logged.push(value); } }, module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(scriptPath, 'utf8'), context);
  return { fields, elements, form, submit, clear, results, logged };
}

test('form submit stays disabled until valid, displays data, then Clear resets everything', () => {
  const ui = formHarness();
  assert.equal(ui.submit.disabled, true);
  ui.fields.email.value = 'invalid'; ui.fields.email.fire('input');
  assert.equal(ui.submit.disabled, true);
  assert.match(ui.elements.get('contact-email-error').textContent, /valid email/i);
  const values = {
    firstName: 'Efe', lastName: 'Muzbeg', email: 'efe@example.org', phone: '37061234567',
    address: 'Vilnius', ratingContent: '8', ratingDesign: '9', ratingUsability: '10'
  };
  for (const [name, value] of Object.entries(values)) {
    ui.fields[name].value = value;
    ui.fields[name].fire('input');
  }
  assert.equal(ui.fields.phone.value, '+370 612 34567');
  assert.equal(ui.submit.disabled, false);
  const submitEvent = ui.form.fire('submit');
  assert.equal(submitEvent.prevented, true);
  assert.equal(ui.results.hidden, false);
  assert.equal(ui.logged.length, 1);
  assert.equal(ui.logged[0].firstName, 'Efe');
  assert.equal(ui.logged[0].ratingUsability, 10);
  assert.equal(ui.elements.get('result-phone').textContent, '+370 612 34567');
  assert.equal(ui.elements.get('rating-average').textContent, 'Efe Muzbeg: 9.00');
  ui.clear.fire('click');
  assert.equal(ui.submit.disabled, true);
  assert.equal(ui.results.hidden, true);
  assert.equal(ui.elements.get('rating-average').textContent, '');
  assert.equal(ui.elements.get('contact-email-error').textContent, '');
  assert.ok(Object.values(ui.fields).every((field) => field.value === ''));
});
