(() => {
  const board = document.querySelector(".landing-preview-board--quest");
  if (!board) return;

  const rows = Array.from(board.querySelectorAll(".landing-preview-board__row"));
  const rowCells = rows.map(row => Array.from(row.querySelectorAll("i")));

  // Hide all cells initially
  rowCells.forEach(rowCellArray => {
    rowCellArray.forEach(cell => {
      cell.style.opacity = "0";
    });
  });

  const animateTyping = () => {
    let currentDelay = 0;

    // Animate each row sequentially
    rowCells.forEach((rowCellArray, rowIndex) => {
      // Type out this row's letters one by one
      rowCellArray.forEach((cell, cellIndex) => {
        setTimeout(() => {
          cell.style.opacity = "1";
          cell.style.transition = "opacity 100ms ease-in";
        }, currentDelay);
        currentDelay += 120; // 120ms between each letter
      });

      // After this row is complete, pause before starting next row
      currentDelay += 300;
    });

    // After all rows shown, wait 1.5 seconds then reset and repeat
    setTimeout(() => {
      rowCells.forEach(rowCellArray => {
        rowCellArray.forEach(cell => {
          cell.style.opacity = "0";
        });
      });
      setTimeout(animateTyping, 500); // Small delay before restarting
    }, currentDelay + 1500);
  };

  animateTyping();
})();
