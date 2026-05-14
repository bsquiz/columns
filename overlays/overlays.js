function createOverlayController(options) {
  const { overlayEl, text } = options;

  function resetOverlayClasses() {
    overlayEl.classList.remove("overlay-fullscreen", "overlay-illustrated", "overlay-start-screen");
  }

  function showText(message, overlayOptions = {}) {
    resetOverlayClasses();
    overlayEl.classList.toggle("overlay-fullscreen", Boolean(overlayOptions.fullscreen));
    overlayEl.innerHTML = `<div class="overlay-copy">${message.replace(/\n/g, "<br />")}</div>`;
    overlayEl.classList.remove("hidden");
  }

  function hide() {
    resetOverlayClasses();
    overlayEl.classList.add("hidden");
  }

  function showStartScreen() {
    resetOverlayClasses();
    overlayEl.classList.add("overlay-illustrated");
    overlayEl.classList.add("overlay-start-screen");
    overlayEl.innerHTML = `
      <div class="overlay-card d-grid">
        <img
          class="start-screen-logo"
          src="assets/start-screen-logo.png"
          alt="${text.startTitle}"
        />
        <div class="overlay-copy">${text.startBody}</div>
        <div class="overlay-copy">${text.startHint}</div>
      </div>
    `;
    overlayEl.classList.remove("hidden");
  }

  function showGameOverScreen(state, highScores) {
    const rows = highScores
      .map(
        (entry, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${entry.level}</td>
            <td>${entry.gems}</td>
          </tr>
        `
      )
      .join("");

    resetOverlayClasses();
    overlayEl.classList.add("overlay-illustrated");
    overlayEl.innerHTML = `
      <div class="overlay-card overlay-card-game-over d-grid">
        <div class="overlay-title">${text.gameOverTitle}</div>
        <div class="overlay-copy">Score ${state.score} / Level ${state.level} / Gems ${state.clears}</div>
        <div class="high-scores">
          <div class="overlay-copy high-scores-title">${text.gameOverSubtitle}</div>
          <table class="high-scores-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>Lvl</th>
                <th>Gms</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="overlay-copy">${text.gameOverHint}</div>
      </div>
    `;
    overlayEl.classList.remove("hidden");
  }

  function showNameEntryScreen(entry, callbacks) {
    const { defaultName, normalizeName, onSubmit } = callbacks;

    resetOverlayClasses();
    overlayEl.classList.add("overlay-illustrated");
    overlayEl.innerHTML = `
      <div class="overlay-card overlay-card-game-over d-grid">
        <div class="overlay-title">${text.nameEntryTitle}</div>
        <div class="overlay-copy">Score ${entry.score} / Level ${entry.level} / Gems ${entry.gems}</div>
        <div class="overlay-copy">${text.nameEntryBody}</div>
        <div class="high-score-entry d-grid">
          <input
            id="high-score-name"
            class="high-score-input"
            type="text"
            inputmode="text"
            maxlength="8"
            value="${defaultName}"
            aria-label="${text.nameEntryBody}"
          />
          <button id="save-high-score" class="overlay-button box-shadow" type="button">
            ${text.nameEntryButton}
          </button>
        </div>
      </div>
    `;
    overlayEl.classList.remove("hidden");

    const nameInput = document.getElementById("high-score-name");
    const saveButton = document.getElementById("save-high-score");
    const submit = () => {
      onSubmit(normalizeName(nameInput?.value));
    };

    nameInput?.focus();
    nameInput?.select();
    nameInput?.addEventListener("input", () => {
      nameInput.value = normalizeName(nameInput.value);
    });
    nameInput?.addEventListener("keydown", (event) => {
      if (event.code === "Enter") {
        event.preventDefault();
        submit();
      }
    });
    saveButton?.addEventListener("click", submit, { once: true });
  }

  function showSavingHighScoreScreen() {
    resetOverlayClasses();
    overlayEl.classList.add("overlay-illustrated");
    overlayEl.innerHTML = `
      <div class="overlay-card overlay-card-game-over d-grid">
        <div class="overlay-title">${text.savingHighScoreTitle}</div>
        <div class="overlay-copy">${text.savingHighScoreBody}</div>
      </div>
    `;
    overlayEl.classList.remove("hidden");
  }

  return {
    hide,
    showGameOverScreen,
    showNameEntryScreen,
    showSavingHighScoreScreen,
    showStartScreen,
    showText,
  };
}

if (typeof module === "object" && module.exports) {
  module.exports = { createOverlayController };
} else if (typeof globalThis !== "undefined") {
  globalThis.ColumnsOverlays = { createOverlayController };
}
