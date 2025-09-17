const COLS = 10;                                                                                                       
  const ROWS = 20;                                                                                                       
  const BLOCK_SIZE = 30;                                                                                                 
  const COLORS = {                                                                                                       
    I: "#00f0f0",                                                                                                        
    J: "#0000f0",                                                                                                        
    L: "#f0a000",                                                                                                        
    O: "#f0f000",                                                                                                        
    S: "#00f000",                                                                                                        
    T: "#a000f0",                                                                                                        
    Z: "#f00000"                                                                                                         
  };                                                                                                                     
                                                                                                                         
  const SHAPES = {                                                                                                       
    I: [                                                                                                                 
      [0, 0, 0, 0],                                                                                                      
      [1, 1, 1, 1],                                                                                                      
      [0, 0, 0, 0],                                                                                                      
      [0, 0, 0, 0]                                                                                                       
    ],                                                                                                                   
    J: [                                                                                                                 
      [1, 0, 0],                                                                                                         
      [1, 1, 1],                                                                                                         
      [0, 0, 0]                                                                                                          
    ],                                                                                                                   
    L: [                                                                                                                 
      [0, 0, 1],                                                                                                         
      [1, 1, 1],                                                                                                         
      [0, 0, 0]                                                                                                          
    ],                                                                                                                   
    O: [                                                                                                                 
      [1, 1],                                                                                                            
      [1, 1]                                                                                                             
    ],                                                                                                                   
    S: [                                                                                                                 
      [0, 1, 1],                                                                                                         
      [1, 1, 0],                                                                                                         
      [0, 0, 0]                                                                                                          
    ],                                                                                                                   
    T: [                                                                                                                 
      [0, 1, 0],                                                                                                         
      [1, 1, 1],                                                                                                         
      [0, 0, 0]                                                                                                          
    ],                                                                                                                   
    Z: [                                                                                                                 
      [1, 1, 0],                                                                                                         
      [0, 1, 1],                                                                                                         
      [0, 0, 0]                                                                                                          
    ]                                                                                                                    
  };                                                                                                                     
                                                                                                                         
  const boardCanvas = document.getElementById("board");                                                                  
  const boardCtx = boardCanvas.getContext("2d");                                                                         
  const nextCanvas = document.getElementById("next");                                                                    
  const nextCtx = nextCanvas.getContext("2d");                                                                           
  const nextWrapper = document.getElementById("nextWrapper");                                                            
  const scoreEl = document.getElementById("score");                                                                      
  const levelEl = document.getElementById("level");                                                                      
  const startBtn = document.getElementById("startBtn");                                                                  
  const difficultySelect = document.getElementById("difficulty");                                                        
  // タッチ操作用ボタン生成関数
  function createTouchControls() {
    const controlsDiv = document.querySelector('.controls');
    if (!controlsDiv) return;
    // 既存のタッチボタンがあれば削除
    const oldTouch = document.getElementById('touch-controls');
    if (oldTouch) oldTouch.remove();
    const touchDiv = document.createElement('div');
    touchDiv.id = 'touch-controls';
    touchDiv.style.display = 'flex';
    touchDiv.style.justifyContent = 'center';
    touchDiv.style.gap = '8px';
    touchDiv.style.marginTop = '12px';
    // ボタン定義
    const btns = [
      { action: 'left', label: '←' },
      { action: 'rotate', label: '⟳' },
      { action: 'right', label: '→' },
      { action: 'down', label: '↓' },
      { action: 'hardDrop', label: '即落' }
    ];
    btns.forEach(btn => {
      const b = document.createElement('button');
      b.textContent = btn.label;
      b.setAttribute('data-action', btn.action);
      b.style.fontSize = '1.5em';
      b.style.padding = '8px 16px';
      b.style.borderRadius = '8px';
      b.style.border = '1px solid #ccc';
      b.style.background = '#f8f8f8';
      b.style.boxShadow = '1px 1px 2px #ddd';
      b.style.touchAction = 'manipulation';
      touchDiv.appendChild(b);
    });
    controlsDiv.appendChild(touchDiv);
  }

  createTouchControls();
  const touchButtons = document.querySelectorAll('[data-action]');
                                                                                                                         
  const DIFFICULTY_SPEEDS = {                                                                                            
    easy: 1100,                                                                                                          
    normal: 800,                                                                                                         
    hard: 600                                                                                                            
  };                                                                                                                     
  const DROP_ACCELERATION = 80;                                                                                          
                                                                                                                         
  let board;                                                                                                             
  let currentPiece;                                                                                                      
  let nextPiece;                                                                                                         
  let dropInterval;                                                                                                      
  let baseDropSpeed = DIFFICULTY_SPEEDS.normal;                                                                          
  let dropSpeed = DIFFICULTY_SPEEDS.normal;                                                                              
  let score = 0;                                                                                                         
  let level = 1;                                                                                                         
  let isRunning = false;                                                                                                 
  let showNextPiece = true;                                                                                              
                                                                                                                         
  function createBoard() {                                                                                               
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));                                                   
  }                                                                                                                      
                                                                                                                         
  function randomPiece() {                                                                                               
    const keys = Object.keys(SHAPES);                                                                                    
    const type = keys[Math.floor(Math.random() * keys.length)];                                                          
    return {                                                                                                             
      type,                                                                                                              
      matrix: SHAPES[type].map(row => [...row]),                                                                         
      row: 0,                                                                                                            
      col: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2)                                                  
    };                                                                                                                   
  }                                                                                                                      
                                                                                                                         
  function drawCell(ctx, x, y, color, size) {                                                                            
    ctx.fillStyle = color;                                                                                               
    ctx.fillRect(x, y, size, size);                                                                                      
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";                                                                        
    ctx.strokeRect(x, y, size, size);                                                                                    
  }                                                                                                                      
                                                                                                                         
  function drawBoard() {                                                                                                 
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);                                                     
    board.forEach((row, r) => {                                                                                          
      row.forEach((cell, c) => {                                                                                         
        if (cell) {                                                                                                      
          drawCell(boardCtx, c * BLOCK_SIZE, r * BLOCK_SIZE, COLORS[cell], BLOCK_SIZE);                                  
        }                                                                                                                
      });                                                                                                                
    });                                                                                                                  
  }                                                                                                                      
                                                                                                                         
  function drawPiece(targetCtx, piece, size) {                                                                           
    piece.matrix.forEach((row, r) => {                                                                                   
      row.forEach((value, c) => {                                                                                        
        if (value) {                                                                                                     
          drawCell(targetCtx, (piece.col + c) * size, (piece.row + r) * size, COLORS[piece.type], size);                 
        }                                                                                                                
      });                                                                                                                
    });                                                                                                                  
  }                                                                                                                      
                                                                                                                         
  function drawNextPiece() {                                                                                             
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);                                                        
    if (!showNextPiece || !nextPiece) {                                                                                  
      return;                                                                                                            
    }                                                                                                                    
    const size = 24;                                                                                                     
    const previewPiece = {                                                                                               
      ...nextPiece,                                                                                                      
      row: 1,                                                                                                            
      col: 1                                                                                                             
    };                                                                                                                   
    drawPiece(nextCtx, previewPiece, size);                                                                              
  }                                                                                                                      
                                                                                                                         
  function mergePiece() {                                                                                                
    currentPiece.matrix.forEach((row, r) => {                                                                            
      row.forEach((value, c) => {                                                                                        
        if (!value) return;                                                                                              
        board[currentPiece.row + r][currentPiece.col + c] = currentPiece.type;                                           
      });                                                                                                                
    });                                                                                                                  
  }                                                                                                                      
                                                                                                                         
  function rotate(matrix) {                                                                                              
    const size = matrix.length;                                                                                          
    const result = matrix.map((row, rowIndex) =>                                                                         
      row.map((_, colIndex) => matrix[size - colIndex - 1][rowIndex])                                                    
    );                                                                                                                   
    return result;                                                                                                       
  }                                                                                                                      
                                                                                                                         
  function hasCollision(piece, offsetRow = 0, offsetCol = 0) {                                                           
    return piece.matrix.some((row, r) =>                                                                                 
      row.some((value, c) => {                                                                                           
        if (!value) return false;                                                                                        
        const newRow = piece.row + r + offsetRow;                                                                        
        const newCol = piece.col + c + offsetCol;                                                                        
        return (                                                                                                         
          newCol < 0 ||                                                                                                  
          newCol >= COLS ||                                                                                              
          newRow >= ROWS ||                                                                                              
          (newRow >= 0 && board[newRow][newCol])                                                                         
        );                                                                                                               
      })                                                                                                                 
    );                                                                                                                   
  }                                                                                                                      
                                                                                                                         
  function clearLines() {                                                                                                
    let linesCleared = 0;                                                                                                
    board = board.reduce((acc, row) => {                                                                                 
      if (row.every(cell => cell)) {                                                                                     
        linesCleared += 1;                                                                                               
        acc.unshift(Array(COLS).fill(null));                                                                             
      } else {                                                                                                           
        acc.push(row);                                                                                                   
      }                                                                                                                  
      return acc;                                                                                                        
    }, []);                                                                                                              
    if (linesCleared > 0) {                                                                                              
      score += linesCleared * 100;                                                                                       
      level = 1 + Math.floor(score / 500);                                                                               
      dropSpeed = Math.max(150, baseDropSpeed - (level - 1) * DROP_ACCELERATION);                                        
      updateScore();                                                                                                     
      restartInterval();                                                                                                 
    }                                                                                                                    
  }                                                                                                                      
                                                                                                                         
  function updateScore() {                                                                                               
    scoreEl.textContent = score;                                                                                         
    levelEl.textContent = level;                                                                                         
  }                                                                                                                      
                                                                                                                         
  function drop() {                                                                                                      
    if (!isRunning) return;                                                                                              
    if (!movePiece(1, 0)) {                                                                                              
      mergePiece();                                                                                                      
      clearLines();                                                                                                      
      spawnPiece();                                                                                                      
      if (hasCollision(currentPiece)) {                                                                                  
        endGame();                                                                                                       
      }                                                                                                                  
    }                                                                                                                    
    render();                                                                                                            
  }                                                                                                                      
                                                                                                                         
  function movePiece(offsetRow, offsetCol) {                                                                             
    const newRow = currentPiece.row + offsetRow;                                                                         
    const newCol = currentPiece.col + offsetCol;                                                                         
    const testPiece = { ...currentPiece, row: newRow, col: newCol };                                                     
    if (!hasCollision(testPiece)) {                                                                                      
      currentPiece = testPiece;                                                                                          
      return true;                                                                                                       
    }                                                                                                                    
    return false;                                                                                                        
  }                                                                                                                      
                                                                                                                         
  function hardDrop() {
    let moved = false;
    while (movePiece(1, 0)) {
      score += 2;
      moved = true;
    }
    if (moved) {
      updateScore();
    }
    drop();
  }
                                                                                                                         
  function rotatePiece() {
    const rotated = rotate(currentPiece.matrix);
    const testPiece = { ...currentPiece, matrix: rotated };
    if (!hasCollision(testPiece)) {
      currentPiece = testPiece;
      return true;
    }
    return false;
  }
                                                                                                                         
  function spawnPiece() {                                                                                                
    currentPiece = nextPiece || randomPiece();                                                                           
    currentPiece.row = -1;                                                                                               
    currentPiece.col = Math.floor(COLS / 2) - Math.ceil(currentPiece.matrix[0].length / 2);                              
    nextPiece = randomPiece();                                                                                           
    drawNextPiece();                                                                                                     
  }                                                                                                                      
                                                                                                                         
  function render() {                                                                                                    
    drawBoard();                                                                                                         
    drawPiece(boardCtx, currentPiece, BLOCK_SIZE);                                                                       
  }                                                                                                                      
                                                                                                                         
  function startGame() {                                                                                                 
    const selectedDifficulty = difficultySelect.value;                                                                   
    baseDropSpeed = DIFFICULTY_SPEEDS[selectedDifficulty] ?? DIFFICULTY_SPEEDS.normal;                                   
    dropSpeed = baseDropSpeed;                                                                                           
    showNextPiece = selectedDifficulty !== "hard";                                                                       
    nextWrapper.style.display = showNextPiece ? "flex" : "none";                                                         
    board = createBoard();                                                                                               
    score = 0;                                                                                                           
    level = 1;                                                                                                           
    isRunning = true;                                                                                                    
    nextPiece = randomPiece();                                                                                           
    spawnPiece();                                                                                                        
    updateScore();                                                                                                       
    restartInterval();                                                                                                   
    render();                                                                                                            
  }                                                                                                                      
                                                                                                                         
  function restartInterval() {                                                                                           
    clearInterval(dropInterval);                                                                                         
    dropInterval = setInterval(drop, dropSpeed);                                                                         
  }                                                                                                                      
                                                                                                                         
  function endGame() {                                                                                                   
    isRunning = false;                                                                                                   
    clearInterval(dropInterval);                                                                                         
    boardCtx.fillStyle = "rgba(0, 0, 0, 0.8)";                                                                           
    boardCtx.fillRect(0, boardCanvas.height / 2 - 30, boardCanvas.width, 60);                                            
    boardCtx.fillStyle = "#fff";                                                                                         
    boardCtx.font = "24px Segoe UI";                                                                                     
    boardCtx.textAlign = "center";                                                                                       
    boardCtx.fillText("ゲームオーバー！スタートで再挑戦", boardCanvas.width / 2, boardCanvas.height / 2 + 8);            
  }                                                                                                                      
                                                                                                                         
  document.addEventListener("keydown", event => {
    const action = KEYBOARD_ACTIONS[event.key];
    if (!action) {
      return;
    }
    event.preventDefault();
    applyAction(action);
  });

  // タッチ・クリック操作イベント
  if (touchButtons.length) {
    touchButtons.forEach(button => {
      const action = button.dataset.action;
      if (!action) return;
      // タッチ
      button.addEventListener('touchstart', event => {
        event.preventDefault();
        applyAction(action);
      }, { passive: false });
      // クリック（PC用）
      button.addEventListener('click', event => {
        event.preventDefault();
        applyAction(action);
      });
    });
  }

  function applyAction(action) {
    if (!isRunning) {
      return false;
    }

    switch (action) {
      case "left":
        movePiece(0, -1);
        render();
        return true;
      case "right":
        movePiece(0, 1);
        render();
        return true;
      case "down": {
        const moved = movePiece(1, 0);
        if (moved) {
          score += 1;
          updateScore();
        }
        render();
        return true;
      }
      case "rotate":
        rotatePiece();
        render();
        return true;
      case "drop":
        hardDrop();
        return true;
      default:
        return false;
    }
  }

  document.addEventListener("keydown", event => {                                                                        
    if (!isRunning) return;                                                                                              
    switch (event.key) {                                                                                                 
      case "ArrowLeft":                                                                                                  
        movePiece(0, -1);                                                                                                
        break;                                                                                                           
      case "ArrowRight":                                                                                                 
        movePiece(0, 1);                                                                                                 
        break;                                                                                                           
      case "ArrowDown":                                                                                                  
        movePiece(1, 0);                                                                                                 
        score += 1;                                                                                                      
        updateScore();                                                                                                   
        break;                                                                                                           
      case "ArrowUp":                                                                                                    
        rotatePiece();                                                                                                   
        break;                                                                                                           
      case " ":                                                                                                          
        event.preventDefault();                                                                                          
        hardDrop();                                                                                                      
        break;                                                                                                           
      default:                                                                                                           
        return;                                                                                                          
    }                                                                                                                    
    render();                                                                                                            
  });                                                                                                                    
                                                                                                                         
  startBtn.addEventListener("click", () => {                                                                             
    if (isRunning) {                                                                                                     
      clearInterval(dropInterval);                                                                                       
    }                                                                                                                    
    startGame();                                                                                                         
  });                                                                                                                    
                                                                                                                         
  boardCtx.fillStyle = "#fff";                                                                                           
  boardCtx.font = "20px Segoe UI";                                                                                       
  boardCtx.textAlign = "center";                                                                                         
  boardCtx.fillText("スタートボタンを押してね！", boardCanvas.width / 2, boardCanvas.height / 2); 