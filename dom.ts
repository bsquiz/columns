export type GameElements = {
  canvas: HTMLCanvasElement;
  scoreEl: HTMLElement;
  levelEl: HTMLElement;
  clearsEl: HTMLElement;
  nextPieceEl: HTMLElement;
  musicToggleEl: HTMLElement | null;
  overlayEl: HTMLElement;
};

export function getGameElements(root: Document = document): GameElements {
  return {
    canvas: getRequiredElement<HTMLCanvasElement>(root, "game"),
    scoreEl: getRequiredElement(root, "score"),
    levelEl: getRequiredElement(root, "level"),
    clearsEl: getRequiredElement(root, "clears"),
    nextPieceEl: getRequiredElement(root, "next-piece"),
    musicToggleEl: root.getElementById("music-toggle"),
    overlayEl: getRequiredElement(root, "overlay"),
  };
}

function getRequiredElement<T extends HTMLElement>(
  root: Document,
  id: string
): T {
  const element = root.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element as T;
}
