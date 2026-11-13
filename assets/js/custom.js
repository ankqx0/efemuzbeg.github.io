/* Contact form validation and skill progress dashboard. */
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

/* LW12: interactive Skill Kanban and versioned status-only persistence. */
(function () {
  "use strict";

  const storageKey = "efe-cv-skill-status-v1";
  const statuses = ["Planned", "In Progress", "Completed"];
  const statusContainers = {
    Planned: "skill-list-planned",
    "In Progress": "skill-list-in-progress",
    Completed: "skill-list-completed"
  };
  const initialSkills = [
    { id: "html-semantic-structure", name: "HTML & Semantic Structure", status: "Completed", xp: 50 },
    { id: "css-layout", name: "CSS Layout", status: "Completed", xp: 45 },
    { id: "git-github", name: "Git and GitHub", status: "Completed", xp: 50 },
    { id: "javascript-basics", name: "JavaScript Basics", status: "In Progress", xp: 55 },
    { id: "python-automation", name: "Python Automation", status: "In Progress", xp: 65 },
    { id: "linux-fundamentals", name: "Linux Fundamentals", status: "In Progress", xp: 45 },
    { id: "network-security", name: "Network Security", status: "Planned", xp: 60 },
    { id: "web-security-basics", name: "Web Security Basics", status: "Planned", xp: 50 }
  ];

  function levelDetails(earnedXp) {
    if (earnedXp < 50) return { level: 1, rank: "Beginner", start: 0, next: 50 };
    if (earnedXp < 150) return { level: 2, rank: "Trainee", start: 50, next: 150 };
    if (earnedXp < 300) return { level: 3, rank: "Specialist", start: 150, next: 300 };
    return { level: 4, rank: "Professional", start: 300, next: null };
  }

  function calculateSkillProgress(skills) {
    const assignedXp = skills.reduce((sum, skill) => sum + skill.xp, 0);
    const completedSkills = skills.filter((skill) => skill.status === "Completed");
    const earnedXp = completedSkills.reduce((sum, skill) => sum + skill.xp, 0);
    const level = levelDetails(earnedXp);
    const progressPercent = level.next === null
      ? 100
      : Math.max(0, Math.min(100, (earnedXp - level.start) / (level.next - level.start) * 100));
    return {
      assignedXp, earnedXp, level: level.level, rank: level.rank, nextLevelXp: level.next,
      progressPercent, totalSkills: skills.length, completedSkills: completedSkills.length,
      completionPercent: skills.length ? completedSkills.length / skills.length * 100 : 0
    };
  }

  function changeSkillStatus(skills, id, nextStatus) {
    if (!statuses.includes(nextStatus)) return false;
    const skill = skills.find((item) => item.id === id);
    if (!skill || skill.status === nextStatus) return false;
    skill.status = nextStatus;
    return true;
  }

  function parseSavedStatuses(raw) {
    if (!raw) return null;
    try {
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !saved.statuses ||
          typeof saved.statuses !== "object" || Array.isArray(saved.statuses)) return null;
      const restored = {};
      initialSkills.forEach((skill) => {
        const value = saved.statuses[skill.id];
        restored[skill.id] = statuses.includes(value) ? value : skill.status;
      });
      return restored;
    } catch (_) {
      return null;
    }
  }

  if (typeof document === "undefined") return;

  const dashboard = document.getElementById("skill-progress");
  if (!dashboard) return;
  const skills = initialSkills.map((skill) => ({ ...skill }));

  function restoreSkillStatuses() {
    try {
      const restored = parseSavedStatuses(window.localStorage.getItem(storageKey));
      if (restored) skills.forEach((skill) => { skill.status = restored[skill.id]; });
    } catch (_) {
      // The dashboard still works when storage is unavailable.
    }
  }

  function saveSkillStatuses() {
    const statusValues = Object.fromEntries(skills.map((skill) => [skill.id, skill.status]));
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, statuses: statusValues }));
    } catch (_) {
      // Private browsing or storage restrictions must not stop status changes.
    }
  }

  function renderSkillCards() {
    const containers = Object.values(statusContainers).map((id) => document.getElementById(id));
    containers.forEach((container) => container.replaceChildren());
    skills.forEach((skill) => {
      const card = document.createElement("article");
      card.className = "skill-card";
      card.dataset.skillId = skill.id;

      const heading = document.createElement("h4");
      heading.textContent = skill.name;
      const statusText = document.createElement("p");
      statusText.className = "skill-status";
      statusText.textContent = "Status: " + skill.status;
      const xpText = document.createElement("p");
      xpText.className = "skill-xp";
      xpText.textContent = "Assigned XP: " + skill.xp;
      const label = document.createElement("label");
      label.className = "skill-status-label";
      label.htmlFor = "skill-status-" + skill.id;
      label.textContent = "Change status";
      const select = document.createElement("select");
      select.id = label.htmlFor;
      select.className = "form-select skill-status-select";
      select.setAttribute("aria-label", "Change status for " + skill.name);
      statuses.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        select.append(option);
      });
      select.value = skill.status;
      select.addEventListener("change", () => {
        if (!changeSkillStatus(skills, skill.id, select.value)) return;
        saveSkillStatuses();
        renderSkillCards();
        updateSkillStatistics();
      });

      card.append(heading, statusText, xpText, label, select);
      document.getElementById(statusContainers[skill.status]).append(card);
    });
  }

  function updateSkillStatistics() {
    const progress = calculateSkillProgress(skills);
    document.getElementById("earned-xp").textContent = String(progress.earnedXp);
    document.getElementById("assigned-xp").textContent = String(progress.assignedXp);
    document.getElementById("current-level").textContent = String(progress.level);
    document.getElementById("current-rank").textContent = progress.rank;
    document.getElementById("total-skills").textContent = String(progress.totalSkills);
    document.getElementById("completed-skills").textContent = String(progress.completedSkills);
    document.getElementById("completion-percentage").textContent =
      (Number.isInteger(progress.completionPercent) ? progress.completionPercent : progress.completionPercent.toFixed(1)) + "%";
    updateProgressBar(progress);
  }

  function updateProgressBar(progress) {
    const percent = Number(progress.progressPercent.toFixed(1));
    const bar = document.getElementById("xp-progress-bar");
    document.getElementById("xp-progress-fill").style.width = percent + "%";
    bar.setAttribute("aria-valuenow", String(percent));
    bar.setAttribute("aria-label", progress.nextLevelXp === null
      ? "Maximum level reached" : "Progress toward Level " + (progress.level + 1));
    document.getElementById("xp-progress-text").textContent = progress.nextLevelXp === null
      ? progress.earnedXp + " XP - maximum level"
      : progress.earnedXp + " / " + progress.nextLevelXp + " XP";
  }

  restoreSkillStatuses();
  renderSkillCards();
  updateSkillStatistics();
})();
