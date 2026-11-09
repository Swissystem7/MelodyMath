function detectPatternCycle(sequence) {
	if (!Array.isArray(sequence) || sequence.length < 2) return null;
	const maxLen = Math.floor(sequence.length / 2);
	for (let len = 1; len <= maxLen; len++) {
		if (sequence.length % len !== 0) continue;
		const pattern = sequence.slice(0, len);
		let ok = true;
		for (let i = 0; i < sequence.length; i++) {
			if (sequence[i] !== pattern[i % len]) {
				ok = false;
				break;
			}
		}
		if (ok) return { cycleLength: len, pattern: pattern.slice() };
	}
	return null;
}

function predictNextElement(sequence) {
	const detected = detectPatternCycle(sequence);
	if (!detected) return null;
	return detected.pattern[sequence.length % detected.cycleLength];
}

function generateRhythmicSequence(motif, repetitions) {
	if (!Array.isArray(motif) || !Number.isInteger(repetitions) || repetitions < 1) {
		return [];
	}
	const out = [];
	for (let i = 0; i < repetitions; i++) out.push(...motif);
	return out;
}

function explainPatternStep(pattern, nextItem) {
	if (!Array.isArray(pattern) || pattern.length === 0) return "";
	const shown = pattern.join(", ");
	return `התבנית היא [${shown}], והאיבר הבא הוא ${nextItem}`;
}

module.exports = {
	detectPatternCycle,
	predictNextElement,
	generateRhythmicSequence,
	explainPatternStep,
};
