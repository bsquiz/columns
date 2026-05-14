const PREVIEW_GEM_SIZE = 40;

function createHud(options) {
  const { scoreEl, levelEl, clearsEl, nextPieceEl, musicToggleEl, drawPreviewGem } = options;

  function renderStats(state) {
    scoreEl.textContent = String(state.score);
    levelEl.textContent = String(state.level);
    clearsEl.textContent = String(state.clears);
  }

  function renderNextPiece(piece) {
    nextPieceEl.innerHTML = "";

    piece.gems.forEach((color) => {
      const gem = document.createElement("canvas");
      gem.className = "preview-gem d-block";
      gem.width = PREVIEW_GEM_SIZE;
      gem.height = PREVIEW_GEM_SIZE;
      drawPreviewGem(gem, color);
      nextPieceEl.appendChild(gem);
    });
  }

  function updateMusicToggleLabel(isMuted) {
    if (!musicToggleEl) {
      return;
    }

    musicToggleEl.textContent = isMuted ? "Unmute Music" : "Mute Music";
  }

  return {
    renderNextPiece,
    renderStats,
    updateMusicToggleLabel,
  };
}

if (typeof module === "object" && module.exports) {
  module.exports = { createHud };
} else if (typeof globalThis !== "undefined") {
  globalThis.ColumnsHud = { createHud };
}
