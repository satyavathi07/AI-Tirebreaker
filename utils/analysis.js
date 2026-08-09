export function generateAnalysis(decision, details, options, type) {
  const baseKeywords = collectKeywords(`${decision} ${details}`);
  const optionSummaries = options.map((option) => analyzeOption(option, baseKeywords));

  if (type === 'comparison') {
    return buildComparison(optionSummaries);
  }

  if (type === 'swot') {
    return buildSwot(optionSummaries);
  }

  return buildProsCons(optionSummaries);
}

function collectKeywords(text) {
  const normalized = text.toLowerCase();
  const keywords = new Set();
  const tokens = normalized.match(/\b[a-z]{3,}\b/g) || [];
  const relevant = [
    'cost', 'time', 'risk', 'stress', 'energy', 'quality', 'growth', 'career', 'health', 'fun', 'flexible',
    'fast', 'slow', 'secure', 'creative', 'impact', 'team', 'remote', 'learning', 'financial', 'reliable', 'travel',
    'money', 'schedule', 'deadline', 'investment', 'family', 'status', 'comfort', 'independence', 'challenge'
  ];
  tokens.forEach((token) => {
    if (relevant.includes(token)) {
      keywords.add(token);
    }
  });
  return [...keywords];
}

function analyzeOption(option, baseKeywords) {
  const optionText = option.toLowerCase();
  const has = (term) => optionText.includes(term);
  const traits = {
    convenient: has('easy') || has('convenient') || has('quick') || has('fast'),
    stable: has('stable') || has('safe') || has('secure') || has('reliable'),
    ambitious: has('grow') || has('promotion') || has('career') || has('advance') || has('challenge'),
    creative: has('creative') || has('design') || has('art') || has('innovation') || has('idea'),
    affordable: has('cheap') || has('affordable') || has('budget') || has('lower'),
    flexible: has('flexible') || has('remote') || has('part-time') || has('schedule'),
  };

  const positive = [];
  const negative = [];

  if (traits.convenient) positive.push('Seems easier to implement and reduces friction.');
  if (traits.stable) positive.push('Offers a strong foundation with low downside risk.');
  if (traits.ambitious) positive.push('Supports growth and long-term progress.');
  if (traits.creative) positive.push('Encourages innovation and satisfying work.');
  if (traits.affordable) positive.push('Likely easier on your budget or resources.');
  if (traits.flexible) positive.push('Gives you more freedom to adjust over time.');

  if (!positive.length) {
    positive.push('Has potential benefits that align with your goal.');
  }

  if (traits.convenient) negative.push('May trade off deeper value for faster execution.');
  if (traits.stable) negative.push('Could feel too safe and limit new opportunities.');
  if (traits.ambitious) negative.push('May require more effort, attention, or stress.');
  if (traits.creative) negative.push('Could be harder to predict and manage consistently.');
  if (traits.affordable) negative.push('Might come with limitations or lower quality.');
  if (traits.flexible) negative.push('Could create ambiguity around commitments or structure.');

  if (!negative.length) {
    negative.push('May introduce trade-offs you should consider carefully.');
  }

  const scores = {
    suitability: 3 + (traits.stable ? 1 : 0) + (traits.ambitious ? 1 : 0),
    cost: 3 + (traits.affordable ? 1 : 0) - (traits.ambitious ? 1 : 0),
    ease: 3 + (traits.convenient ? 1 : 0) + (traits.flexible ? 1 : 0),
    risk: 3 - (traits.stable ? 1 : 0) + (traits.ambitious ? 1 : 0),
  };

  return {
    option,
    pros: positive.slice(0, 3),
    cons: negative.slice(0, 3),
    scores: clampScores(scores),
    guidance: generateGuidance(option, baseKeywords),
  };
}

function generateGuidance(option, keywords) {
  const suggestions = [];
  keywords.forEach((keyword) => {
    if (keyword === 'cost') {
      suggestions.push('Look for whether this option keeps costs under control.');
    }
    if (keyword === 'time') {
      suggestions.push('Check whether this option helps you save time or avoid delays.');
    }
    if (keyword === 'risk') {
      suggestions.push('Consider how much uncertainty or downside this option carries.');
    }
    if (keyword === 'growth') {
      suggestions.push('Decide if this option supports growth and future momentum.');
    }
    if (keyword === 'health') {
      suggestions.push('Think about whether this option is sustainable for your wellbeing.');
    }
    if (keyword === 'fun') {
      suggestions.push('Evaluate whether this choice makes the experience more enjoyable.');
    }
    if (keyword === 'family') {
      suggestions.push('Weigh how this option impacts your personal and family balance.');
    }
  });
  return suggestions.length > 0
    ? suggestions[0]
    : `Review how well "${option}" fits the important criteria for your decision.`;
}

function clampScores(scores) {
  return {
    suitability: Math.min(5, Math.max(1, scores.suitability)),
    cost: Math.min(5, Math.max(1, scores.cost)),
    ease: Math.min(5, Math.max(1, scores.ease)),
    risk: Math.min(5, Math.max(1, scores.risk)),
  };
}

function buildProsCons(items) {
  return items.map((item) => ({
    option: item.option,
    pros: item.pros,
    cons: item.cons,
    guidance: item.guidance,
  }));
}

function buildComparison(items) {
  return items.map((item) => ({
    option: item.option,
    suitability: item.scores.suitability,
    cost: item.scores.cost,
    ease: item.scores.ease,
    risk: item.scores.risk,
    guidance: item.guidance,
  }));
}

function buildSwot(items) {
  return items.map((item) => ({
    option: item.option,
    strengths: [
      item.pros[0],
      `This choice aligns with the most important aspects of your decision.`,
    ],
    weaknesses: [
      item.cons[0],
      `It may come with some trade-offs or assumptions that matter here.`,
    ],
    opportunities: [
      `Could create new potential for progress, learning, or savings.`,
      `May open the door to future positive outcomes if you commit to it.`,
    ],
    threats: [
      `Could face unexpected obstacles or pressure over time.`,
      `Might reduce your ability to pursue one of the other options later.`,
    ],
    guidance: item.guidance,
  }));
}
