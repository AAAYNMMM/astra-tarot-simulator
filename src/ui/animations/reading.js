import { createElement, replaceChildren } from "../safe-dom.js";

export function createReadingAnimation({ windowRef, documentRef, reducedMotion, state, dom, cardBackPath }) {
  function delay(milliseconds) {
    const duration = reducedMotion.matches ? 0 : milliseconds;
    return new Promise((resolve) => windowRef.setTimeout(resolve, duration));
  }

  async function runShuffleAnimation() {
    dom.shuffleScene.hidden = false;
    const backPath = cardBackPath(state.reading?.deckStyle);
    const cards = Array.from({ length: 7 }, (_, index) => {
      const span = createElement(documentRef, "span", { className: `shuffle-card shuffle-card-${index}` });
      span.append(createElement(documentRef, "img", { attributes: { src: backPath, alt: "" } }));
      return span;
    });
    replaceChildren(dom.shuffleDeck, cards);
    const phases = [
      { at: 0, text: "正在净化牌面能量" },
      { at: 38, text: "正在回应你的问题" },
      { at: 75, text: "正在寻找回应问题的牌" },
      { at: 94, text: "牌阵即将显现" },
    ];
    const totalDuration = reducedMotion.matches ? 1 : 900;
    const progressAnimation = dom.shuffleProgress.animate?.(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: totalDuration, easing: "linear", fill: "forwards" },
    );
    const startedAt = windowRef.performance.now();
    let lastPhase = -1;
    await new Promise((resolve) => {
      const tick = (now) => {
        const percentage = Math.min(100, ((now - startedAt) / totalDuration) * 100);
        let phaseIndex = 0;
        for (let index = phases.length - 1; index >= 0; index -= 1) {
          if (percentage >= phases[index].at) { phaseIndex = index; break; }
        }
        if (phaseIndex !== lastPhase) {
          lastPhase = phaseIndex;
          dom.shufflePhase.textContent = phases[phaseIndex].text;
        }
        if (percentage < 100) windowRef.requestAnimationFrame(tick); else resolve();
      };
      windowRef.requestAnimationFrame(tick);
    });
    await delay(60);
    progressAnimation?.cancel();
    dom.shuffleScene.hidden = true;
  }

  return Object.freeze({ delay, runShuffleAnimation });
}
