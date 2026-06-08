const boardElement = document.getElementById('board');
const toggleSizeBtn = document.getElementById('toggle-size-btn');
const undoBtn = document.getElementById('undo-btn');
const resetBtn = document.getElementById('reset-btn');
const cleanBtn = document.getElementById('clean-btn');
const themeBtn = document.getElementById('theme-btn'); // DOM nút đổi giao diện mới
const modalResetBtn = document.getElementById('modal-reset-btn');
const winningModal = document.getElementById('winning-modal');
const winnerText = document.getElementById('winner-text');

const cardX = document.getElementById('card-X');
const cardO = document.getElementById('card-O');

const txtXWin = document.getElementById('score-x-win');
const txtXLose = document.getElementById('score-x-lose');
const txtOWin = document.getElementById('score-o-win');
const txtOLose = document.getElementById('score-o-lose');
const txtDraw = document.getElementById('score-draw');

const SIZE_OPTIONS = [3, 15, 30]; 
let currentSizeIndex = 0; // Mặc định khởi đầu bằng ván cờ 15x15 chuẩn
let BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex]; 

let currentPlayer = 'X';
let isGameActive = true;
let boardData = [];
let moveHistory = [];

let scores = JSON.parse(localStorage.getItem('caro_scores')) || {
    xWin: 0, xLose: 0, oWin: 0, oLose: 0, draw: 0
};

// ================= CHỨC NĂNG LƯU TRỮ & KHỞI TẠO GIAO DIỆN SÁNG/TỐI =================
// Kiểm tra bộ nhớ máy tính xem ván trước người chơi để giao diện Sáng hay Tối
let currentTheme = localStorage.getItem('caro_theme') || 'dark';

if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>'; // Chuyển thành icon Mặt Trời nếu là chế độ Sáng
} else {
    themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>'; // Icon Mặt Trăng cho chế độ Tối
}

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('caro_theme', 'light');
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        localStorage.setItem('caro_theme', 'dark');
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
});
// ====================================================================================

function displayScores() {
    txtXWin.textContent = scores.xWin;
    txtXLose.textContent = scores.xLose;
    txtOWin.textContent = scores.oWin;
    txtOLose.textContent = scores.oLose;
    txtDraw.textContent = scores.draw;
}

function createBoard() {
    boardElement.innerHTML = '';
    boardData = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(''));
    moveHistory = []; 

    boardElement.setAttribute('data-size', BOARD_SIZE);
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-row', r);
            cell.setAttribute('data-col', c);
            cell.addEventListener('click', () => handleCellClick(r, c, cell));
            boardElement.appendChild(cell);
        }
    }
    displayScores();
    toggleSizeBtn.textContent = `${BOARD_SIZE} x ${BOARD_SIZE}`;
}

function handleCellClick(row, col, cellElement) {
    if (boardData[row][col] !== '' || !isGameActive) return;

    moveHistory.push({ row, col, player: currentPlayer });
    boardData[row][col] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.classList.add(currentPlayer.toLowerCase());

    if (checkWin(row, col)) {
        isGameActive = false;
        document.querySelector(`#card-${currentPlayer} .player-status`).textContent = "WINNER! 🎉";
        document.querySelector(`#card-${currentPlayer === 'X' ? 'O' : 'X'} .player-status`).textContent = "THUA CUỘC";
        
        if (currentPlayer === 'X') { scores.xWin++; scores.oLose++; } 
        else { scores.oWin++; scores.xLose++; }
        localStorage.setItem('caro_scores', JSON.stringify(scores));
        displayScores();

        setTimeout(() => showWinner(`${currentPlayer} Chiến Thắng! 🎉`), 200);
        return;
    }

    if (boardData.flat().every(cell => cell !== '')) {
        isGameActive = false;
        cardX.classList.remove('active');
        cardO.classList.remove('active');
        document.querySelector('#card-X .player-status').textContent = "HÒA";
        document.querySelector('#card-O .player-status').textContent = "HÒA";
        
        scores.draw++;
        localStorage.setItem('caro_scores', JSON.stringify(scores));
        displayScores();

        setTimeout(() => showWinner("Trận đấu Hòa! 🤝"), 200);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
}

undoBtn.addEventListener('click', () => {
    if (moveHistory.length === 0 || !isGameActive) return;

    if (confirm("Bạn có chắc chắn muốn quay lại nước đi vừa rồi không?")) {
        const lastMove = moveHistory.pop();
        boardData[lastMove.row][lastMove.col] = '';

        const cellElement = document.querySelector(`[data-row='${lastMove.row}'][data-col='${lastMove.col}']`);
        if (cellElement) {
            cellElement.textContent = '';
            cellElement.classList.remove('x', 'o');
        }

        currentPlayer = lastMove.player;
        updateTurnIndicator();
    }
});

resetBtn.addEventListener('click', () => {
    if (isGameActive && moveHistory.length > 0) {
        if (confirm("Ván đấu hiện tại chưa kết thúc. Bạn có chắc chắn muốn hủy và bắt đầu Ván Mới không?")) {
            resetGame();
        }
    } else {
        resetGame();
    }
});

cleanBtn.addEventListener('click', () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử Thắng / Thua của người chơi?")) {
        scores = { xWin: 0, xLose: 0, oWin: 0, oLose: 0, draw: 0 };
        localStorage.setItem('caro_scores', JSON.stringify(scores));
        resetGame();
    }
});

function updateTurnIndicator() {
    if (currentPlayer === 'X') {
        cardX.classList.add('active');
        cardO.classList.remove('active');
        cardX.querySelector('.player-status').textContent = "Đang nghĩ...";
        cardO.querySelector('.player-status').textContent = "Chờ lượt";
    } else {
        cardO.classList.add('active');
        cardX.classList.remove('active');
        cardO.querySelector('.player-status').textContent = "Đang nghĩ...";
        cardX.querySelector('.player-status').textContent = "Chờ lượt";
    }
}

function checkWin(r, c) {
    const player = boardData[r][c];
    const targetCount = (BOARD_SIZE === 3) ? 3 : 5;

    const directions = [
        { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }
    ];

    for (let { dr, dc } of directions) {
        let count = 1;
        let winCells = [[r, c]];

        let i = 1;
        while (true) {
            let nr = r + dr * i;
            let nc = c + dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardData[nr][nc] === player) {
                count++; winCells.push([nr, nc]); i++;
            } else { break; }
        }

        let j = 1;
        while (true) {
            let nr = r - dr * j;
            let nc = c - dc * j;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardData[nr][nc] === player) {
                count++; winCells.push([nr, nc]); j++;
            } else { break; }
        }

        if (count >= targetCount) {
            highlightWinCells(winCells);
            return true;
        }
    }
    return false;
}

function highlightWinCells(cellsCoordinates) {
    cellsCoordinates.forEach(([r, c]) => {
        const cell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
        if (cell) cell.classList.add('win-cell');
    });
}

function showWinner(message) {
    winnerText.textContent = message;
    if (currentPlayer === 'X' && !message.includes("Hòa")) {
        winnerText.style.color = 'var(--color-x)';
    } else if (currentPlayer === 'O' && !message.includes("Hòa")) {
        winnerText.style.color = 'var(--color-o)';
    } else {
        winnerText.style.color = 'var(--text-color)';
    }
    winningModal.classList.add('show');
}

function resetGame() {
    currentPlayer = 'X';
    isGameActive = true;
    winningModal.classList.remove('show');
    updateTurnIndicator();
    createBoard();
}

toggleSizeBtn.addEventListener('click', () => {
    currentSizeIndex = (currentSizeIndex + 1) % SIZE_OPTIONS.length;
    BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex];
    resetGame();
});

// Khởi chạy game lần đầu
createBoard();
modalResetBtn.addEventListener('click', resetGame);