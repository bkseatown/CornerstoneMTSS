(() => {
  const board = document.querySelector(".landing-preview-board--quest");
  if (!board) return;

  const rows = Array.from(board.querySelectorAll(".landing-preview-board__row"));
  const rowCells = rows.map(row => Array.from(row.querySelectorAll("i")));

  // Initially: hide letter text and neutralize all tiles to white background
  rowCells.forEach(rowCellArray => {
    rowCellArray.forEach(cell => {
      cell.style.color = "transparent";
      cell.style.backgroundColor = "white"; // Neutral white tiles
    });
  });

  const animateTyping = () => {
    let currentDelay = 0;

    // Animate each row sequentially
    rowCells.forEach((rowCellArray, rowIndex) => {
      // Type out this row's letters one by one
      rowCellArray.forEach((cell, cellIndex) => {
        setTimeout(() => {
          cell.style.color = "inherit"; // Reveal letter
          cell.style.transition = "color 100ms ease-in";
        }, currentDelay);
        currentDelay += 120; // 120ms between each letter
      });

      // After this row is typed, reveal tile colors
      const rowCompleteDelay = currentDelay + 200;
      setTimeout(() => {
        rowCellArray.forEach(cell => {
          const classList = cell.className;

          // Apply colors based on original class
          if (classList.includes("is-miss")) {
            cell.style.backgroundColor = "#787c7f"; // Gray for letters not in word
          } else if (classList.includes("is-present")) {
            cell.style.backgroundColor = "#c9b458"; // Yellow for correct letter, wrong spot
          } else if (classList.includes("is-hit")) {
            cell.style.backgroundColor = "#6ca965"; // Green for correct spot
          }

          cell.style.transition = "background-color 200ms ease-in";
        });
      }, rowCompleteDelay);

      // Pause before starting next row
      currentDelay += 500;
    });

    // After all rows shown with colors, wait then reset and repeat
    setTimeout(() => {
      rowCells.forEach(rowCellArray => {
        rowCellArray.forEach(cell => {
          cell.style.color = "transparent";
          cell.style.backgroundColor = "white"; // Reset to neutral
          cell.style.transition = "background-color 200ms ease-in";
        });
      });
      setTimeout(animateTyping, 500); // Small delay before restarting
    }, currentDelay + 1500);
  };

  animateTyping();
})();
