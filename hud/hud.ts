import type { GameState, Piece } from "../runtime-types";

const PREVIEW_GEM_SIZE = 40;

type HudOptions = {
  scoreEl: HTMLElement;
  levelEl: HTMLElement;
  clearsEl: HTMLElement;
  nextPieceEl: HTMLElement;
  musicToggleEl: HTMLElement | null;
  drawPreviewGem: (canvas: HTMLCanvasElement, color: string) => void;
};

export type HudController = {
  renderStats: (state: GameState) => void;
  renderNextPiece: (piece: Piece) => void;
  updateMusicToggleLabel: (isMuted: boolean) => void;
};

export function createHud(options: HudOptions): HudController {
  const { scoreEl, levelEl, clearsEl, nextPieceEl, musicToggleEl, drawPreviewGem } = options;

  function renderStats(state: GameState): void {
    scoreEl.textContent = String(state.score);
    levelEl.textContent = String(state.level);
    clearsEl.textContent = String(state.clears);
  }

  function renderNextPiece(piece: Piece): void {
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

  function updateMusicToggleLabel(isMuted: boolean): void {
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
