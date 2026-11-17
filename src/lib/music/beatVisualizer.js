// MelodyMath — MM-UI-705: Visual beat indicator pure helper & accessible pulse styling
// Provides pure visual state calculation for musical beat sequences with
// full prefers-reduced-motion accessibility support.

((root, factory) => {
  const api = factory();
  if (root) root.MM_BEAT_VISUALIZER = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  /**
   * Computes visual state for a beat step in a sequencer or rhythm display.
   *
   * @param {number} stepIndex - 0-based index of the beat slot/step (e.g. 0 to 9).
   * @param {number} activeStep - 0-based index of currently active step, or -1 when idle/stopped.
   * @param {boolean} [reducedMotion=false] - Whether reduced motion is preferred by user/system.
   * @returns {{ active: boolean, pulse: boolean, glow: boolean, className: string, classes: string[] }}
   */
  function getBeatVisualState(stepIndex, activeStep, reducedMotion) {
    if (
      typeof stepIndex !== 'number' ||
      !Number.isInteger(stepIndex) ||
      stepIndex < 0 ||
      typeof activeStep !== 'number' ||
      !Number.isInteger(activeStep) ||
      activeStep < 0 ||
      stepIndex !== activeStep
    ) {
      return {
        active: false,
        pulse: false,
        glow: false,
        className: '',
        classes: []
      };
    }

    if (reducedMotion) {
      return {
        active: true,
        pulse: false,
        glow: true,
        className: 'beat-active',
        classes: ['beat-active']
      };
    }

    return {
      active: true,
      pulse: true,
      glow: true,
      className: 'beat-active beat-pulse-ring',
      classes: ['beat-active', 'beat-pulse-ring']
    };
  }

  return {
    getBeatVisualState
  };
});
