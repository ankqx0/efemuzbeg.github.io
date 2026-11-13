const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'assets', 'js', 'custom.js');
const {
  formatLithuanianPhone, validationMessage, calculateAverage, initialSkills,
  levelDetails, calculateSkillProgress, changeSkillStatus, parseSavedStatuses
} = require(scriptPath);

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

test('the same eight LW10 skills retain their assigned XP and initial categories', () => {
  assert.equal(initialSkills.length, 8);
  assert.equal(new Set(initialSkills.map((skill) => skill.id)).size, 8);
  assert.ok(initialSkills.every((skill) => skill.xp >= 20 && skill.xp <= 80));
  const progress = calculateSkillProgress(initialSkills);
  assert.equal(progress.assignedXp, 420);
  assert.equal(progress.earnedXp, 145);
  assert.equal(progress.completedSkills, 3);
  assert.equal(progress.completionPercent, 37.5);
  assert.equal(progress.level, 2);
  assert.equal(progress.rank, 'Trainee');
  assert.equal(progress.progressPercent, 95);
});

test('level boundaries and next-level progress work in both directions', () => {
  const expected = [
    [0, 1, 'Beginner', 0], [49, 1, 'Beginner', 98],
    [50, 2, 'Trainee', 0], [100, 2, 'Trainee', 50],
    [149, 2, 'Trainee', 99], [150, 3, 'Specialist', 0],
    [299, 3, 'Specialist', 149 / 150 * 100], [300, 4, 'Professional', 100]
  ];
  expected.forEach(([xp, level, rank, percent]) => {
    assert.equal(levelDetails(xp).level, level);
    const progress = calculateSkillProgress([{ id: 'example', status: 'Completed', xp }]);
    assert.equal(progress.rank, rank);
    assert.equal(progress.progressPercent, percent);
  });
  const skills = initialSkills.map((skill) => ({ ...skill }));
  assert.equal(changeSkillStatus(skills, 'network-security', 'Completed'), true);
  assert.equal(calculateSkillProgress(skills).earnedXp, 205);
  assert.equal(changeSkillStatus(skills, 'network-security', 'Planned'), true);
  assert.equal(calculateSkillProgress(skills).earnedXp, 145);
  assert.equal(changeSkillStatus(skills, 'html-semantic-structure', 'In Progress'), true);
  assert.equal(calculateSkillProgress(skills).earnedXp, 95);
  assert.equal(changeSkillStatus(skills, 'network-security', 'Invalid'), false);
  assert.equal(changeSkillStatus(skills, 'missing', 'Completed'), false);
  skills.forEach((skill) => { skill.status = 'Completed'; });
  assert.equal(calculateSkillProgress(skills).earnedXp, 420);
  assert.equal(calculateSkillProgress(skills).progressPercent, 100);
});

test('saved skill statuses restore safely and malformed or outdated data fall back', () => {
  assert.equal(parseSavedStatuses(null), null);
  assert.equal(parseSavedStatuses('{broken'), null);
  assert.equal(parseSavedStatuses(JSON.stringify({ version: 2, statuses: {} })), null);
  const saved = parseSavedStatuses(JSON.stringify({ version: 1, statuses: {
    'network-security': 'Completed', 'css-layout': 'unknown', extra: 'Planned'
  } }));
  assert.equal(saved['network-security'], 'Completed');
  assert.equal(saved['css-layout'], 'Completed');
  assert.equal(Object.hasOwn(saved, 'extra'), false);
});

function dashboardHarness(storage = new Map()) {
  const elements = new Map();
  function element(tag = 'div') {
    const listeners = new Map();
    return {
      tag, id: '', className: '', dataset: {}, style: {}, attributes: {}, children: [],
      textContent: '', value: '',
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = [...children]; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, handler) { listeners.set(name, handler); },
      fire(name) { listeners.get(name)(); }
    };
  }
  const ids = [
    'skill-progress', 'skill-list-planned', 'skill-list-in-progress', 'skill-list-completed',
    'earned-xp', 'assigned-xp', 'current-level', 'current-rank', 'total-skills',
    'completed-skills', 'completion-percentage', 'xp-progress-bar', 'xp-progress-fill', 'xp-progress-text'
  ];
  ids.forEach((id) => elements.set(id, element()));
  const document = {
    getElementById(id) { return elements.get(id) || null; },
    createElement(tag) { return element(tag); }
  };
  const window = { localStorage: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, value); }
  } };
  vm.runInNewContext(fs.readFileSync(scriptPath, 'utf8'), { document, window, module: { exports: {} } });
  return { elements, storage };
}

test('dynamic cards move, recompute metrics and persist statuses across reload', () => {
  const storage = new Map();
  const ui = dashboardHarness(storage);
  assert.equal(ui.elements.get('skill-list-planned').children.length, 2);
  assert.equal(ui.elements.get('skill-list-in-progress').children.length, 3);
  assert.equal(ui.elements.get('skill-list-completed').children.length, 3);
  assert.equal(ui.elements.get('earned-xp').textContent, '145');
  assert.equal(ui.elements.get('xp-progress-fill').style.width, '95%');
  const card = ui.elements.get('skill-list-planned').children.find((item) => item.dataset.skillId === 'network-security');
  const select = card.children.at(-1);
  select.value = 'Completed'; select.fire('change');
  assert.equal(ui.elements.get('skill-list-completed').children.length, 4);
  assert.equal(ui.elements.get('earned-xp').textContent, '205');
  assert.equal(ui.elements.get('current-level').textContent, '3');
  assert.equal(ui.elements.get('completion-percentage').textContent, '50%');
  const saved = JSON.parse(storage.get('efe-cv-skill-status-v1'));
  assert.deepEqual(Object.keys(saved).sort(), ['statuses', 'version']);
  assert.equal(saved.statuses['network-security'], 'Completed');
  assert.equal(Object.hasOwn(saved, 'email'), false);
  const reloaded = dashboardHarness(storage);
  assert.equal(reloaded.elements.get('earned-xp').textContent, '205');
  const moved = reloaded.elements.get('skill-list-completed').children.find((item) => item.dataset.skillId === 'network-security');
  moved.children.at(-1).value = 'Planned'; moved.children.at(-1).fire('change');
  assert.equal(reloaded.elements.get('earned-xp').textContent, '145');
  assert.equal(reloaded.elements.get('skill-list-planned').children.length, 2);
  storage.clear();
  assert.equal(dashboardHarness(storage).elements.get('earned-xp').textContent, '145');
});
