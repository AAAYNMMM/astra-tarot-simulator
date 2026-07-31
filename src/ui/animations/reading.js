import { createElement, replaceChildren } from "../safe-dom.js";

export function createReadingAnimation({ windowRef, documentRef, reducedMotion, state, dom, cardBackPath }) {
  function delay(milliseconds) {
    const duration = reducedMotion.matches ? Math.min(milliseconds, 35) : milliseconds;
    return new Promise((resolve) => windowRef.setTimeout(resolve, duration));
  }

  async function runShuffleAnimation() {
    dom.shuffleScene.hidden = false;
    const backPath = cardBackPath(state.reading?.deckStyle);
    const cards = Array.from({ length: 7 }, (_, index) => {
      const span = createElement(documentRef, "span", { className: `shuffle-card shuffle-card-${index}` });
      span.style.setProperty("--i", String(index));
      span.append(createElement(documentRef, "img", { attributes: { src: backPath, alt: "" } }));
      return span;
    });
    replaceChildren(dom.shuffleDeck, cards);
    const phases = [
      { at: 0, text: "正在净化牌面能量" },
      { at: 34, text: "正在回应你的问题" },
      { at: 68, text: "正在寻找回应问题的牌" },
      { at: 92, text: "牌阵即将显现" },
    ];
    const totalDuration = reducedMotion.matches ? 90 : 2350;
    const startedAt = windowRef.performance.now();
    let lastPhase = -1;
    await new Promise((resolve) => {
      const tick = (now) => {
        const percentage = Math.min(100, ((now - startedAt) / totalDuration) * 100);
        dom.shuffleProgress.style.width = `${percentage}%`;
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
    await delay(180);
    dom.shuffleScene.hidden = true;
    dom.shuffleProgress.style.width = "0";
  }

  return Object.freeze({ delay, runShuffleAnimation });
}
