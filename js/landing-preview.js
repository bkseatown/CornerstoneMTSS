(() => {
  const board = document.querySelector(".landing-preview-board--quest");
  if (!board) return;

  const rows = Array.from(board.querySelectorAll(".landing-preview-board__row"));
  const stages = [
    [
      ["neutral", "neutral", "neutral", "neutral", "neutral"],
      ["neutral", "neutral", "neutral", "neutral", "neutral"],
      ["neutral", "neutral", "neutral", "neutral", "neutral"],
    ],
    [
      ["miss", "miss", "miss", "miss", "miss"],
      ["neutral", "neutral", "neutral", "neutral", "neutral"],
      ["neutral", "neutral", "neutral", "neutral", "neutral"],
    ],
    [
      ["miss", "miss", "miss", "miss", "miss"],
      ["miss", "present", "miss", "miss", "miss"],
      ["neutral", "neutral", "neutral", "neutral", "neutral"],
    ],
    [
      ["miss", "miss", "miss", "miss", "miss"],
      ["miss", "present", "miss", "miss", "miss"],
      ["hit", "hit", "hit", "hit", "hit"],
    ],
  ];

  const stateClasses = ["is-hit", "is-present", "is-miss"];
  let stageIndex = 0;

  const renderStage = () => {
    const stage = stages[stageIndex];
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll("i"));
      cells.forEach((cell, cellIndex) => {
        cell.classList.remove(...stateClasses);
        const nextState = stage?.[rowIndex]?.[cellIndex];
        if (nextState === "hit") cell.classList.add("is-hit");
        if (nextState === "present") cell.classList.add("is-present");
        if (nextState === "miss") cell.classList.add("is-miss");
      });
    });
    stageIndex = (stageIndex + 1) % stages.length;
  };

  renderStage();
  window.setInterval(renderStage, 2400);
})();
