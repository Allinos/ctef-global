// Non-DB content (per the agreed scope, only Events/Journal/Gallery/News are
// admin-editable). Sourced once from the original static site via
// scripts/extract-legacy.js -> data/legacy-content.json.
const legacy = require('./legacy-content.json');

module.exports = {
  boards: legacy.boards,
  life: legacy.life,
  inst: legacy.inst,
  plans: legacy.plans,
  benefits: legacy.benefits,
  objectives: legacy.objectives,
  states: legacy.states,
  chapters: legacy.chapters,
};
