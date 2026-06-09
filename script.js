const boardElement = document.getElementById('board');
const toggleSizeBtn = document.getElementById('toggle-size-btn');
const undoBtn = document.getElementById('undo-btn');
const resetBtn = document.getElementById('reset-btn');
const cleanBtn = document.getElementById('clean-btn');
const themeBtn = document.getElementById('theme-btn'); 
const modalResetBtn = document.getElementById('modal-reset-btn');
const winningModal = document.getElementById('winning-modal');
const winnerText = document.getElementById('winner-text');

// Các thành phần DOM cho Confirm Modal & Toast
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-modal-title');
const confirmMessage = document.getElementById('confirm-modal-message');
const confirmIcon = document.getElementById('confirm-modal-icon');
const confirmBtnOk = document.getElementById('confirm-btn-ok');
const confirmBtnCancel = document.getElementById('confirm-btn-cancel');
const toastContainer = document.getElementById('toast-container');

const cardX = document.getElementById('card-X');
const cardO = document.getElementById('card-O');

const txtXWin = document.getElementById('score-x-win');
const txtXLose = document.getElementById('score-x-lose');
const txtOWin = document.getElementById('score-o-win');
const txtOLose = document.getElementById('score-o-lose');
const txtDraw = document.getElementById('score-draw');

const SIZE_OPTIONS = [3, 15, 30]; 
let currentSizeIndex = 0; 
let BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex]; 

// --- QUẢN LÝ LƯỢT ĐI ---
let firstPlayerOfMatch = 'X'; 
let currentPlayer = 'X';      
let isGameActive = true;
let boardData = [];
let moveHistory = [];

let scores = JSON.parse(localStorage.getItem('caro_scores')) || {
    xWin: 0, xLose: 0, oWin: 0, oLose: 0, draw: 0
};

// ================= BỘ KHỞI TẠO ÂM THANH NÂNG CẤP =================
let audioCtx = null;

function playSound(type) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click-x') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now); 
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } 
        else if (type === 'click-o') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(493.88, now); 
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } 
        else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); 
            osc.frequency.setValueAtTime(659.25, now + 0.1); 
            osc.frequency.setValueAtTime(783.99, now + 0.2); 
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.4); 
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        } 
        else if (type === 'action') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); 
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    } catch (e) {
        console.log(e);
    }
}

// ================= HỆ THỐNG TOAST & CONFIRM MODAL CUSTOM =================
function showToast(message, iconClass = 'fa-circle-check') {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function showConfirmModal(title, message, type = 'primary') {
    playSound('action');
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        
        if (type === 'danger') {
            confirmIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>';
            confirmBtnOk.className = 'popup-btn-danger';
        } else {
            confirmIcon.innerHTML = '<i class="fa-solid fa-circle-question" style="color: var(--color-x);"></i>';
            confirmBtnOk.className = 'popup-btn-primary';
        }
        
        confirmModal.classList.add('show');
        
        confirmBtnOk.onclick = () => {
            playSound('action');
            confirmModal.classList.remove('show');
            resolve(true);
        };
        
        confirmBtnCancel.onclick = () => {
            playSound('action');
            confirmModal.classList.remove('show');
            resolve(false);
        };
    });
}

// BỘ KHỞI TẠO GIAO DIỆN SÁNG/TỐI
let currentTheme = localStorage.getItem('caro_theme') || 'dark';

if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
} else {
    themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
}

themeBtn.addEventListener('click', () => {
    playSound('action');
    document.body.classList.toggle('light-mode');
    
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('caro_theme', 'light');
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        showToast("Đã chuyển sang giao diện Sáng", "fa-sun");
    } else {
        localStorage.setItem('caro_theme', 'dark');
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        showToast("Đã chuyển sang giao diện Tối", "fa-moon");
    }
});

function displayScores() {
    txtXWin.textContent = scores.xWin;
    txtXLose.textContent = scores.xLose;
    txtOWin.textContent = scores.oWin;
    txtOLose.textContent = scores.oLose;
    txtDraw.textContent = scores.draw;
}

// Hàm khởi tạo lưới ô cờ vẽ ra màn hình dựa trên dữ liệu boardData hiện tại
function drawBoardElements() {
    boardElement.innerHTML = '';
    boardElement.setAttribute('data-size', BOARD_SIZE);
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-row', r);
            cell.setAttribute('data-col', c);
            
            // Nếu ô này đã có dữ liệu cờ cũ, vẽ lại quân cờ đó lên màn hình
            if (boardData[r][c] !== '') {
                cell.textContent = boardData[r][c];
                cell.classList.add(boardData[r][c].toLowerCase());
            }
            
            cell.addEventListener('click', () => handleCellClick(r, c, cell));
            boardElement.appendChild(cell);
        }
    }
    toggleSizeBtn.textContent = `${BOARD_SIZE} x ${BOARD_SIZE}`;
}

function createBoard() {
    boardData = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(''));
    moveHistory = []; 
    drawBoardElements();
    displayScores();
}

function handleCellClick(row, col, cellElement) {
    if (boardData[row][col] !== '' || !isGameActive) return;

    if (currentPlayer === 'X') {
        playSound('click-x');
    } else {
        playSound('click-o');
    }

    moveHistory.push({ row, col, player: currentPlayer });
    boardData[row][col] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.classList.add(currentPlayer.toLowerCase());

    if (checkWin(row, col)) {
        isGameActive = false;
        playSound('win');
        document.querySelector(`#card-${currentPlayer} .player-status`).textContent = "WINNER! 🎉";
        document.querySelector(`#card-${currentPlayer === 'X' ? 'O' : 'X'} .player-status`).textContent = "THUA CUỘC";
        
        if (currentPlayer === 'X') { 
            scores.xWin++; scores.oLose++; 
            firstPlayerOfMatch = 'O'; 
        } 
        else { 
            scores.oWin++; scores.xLose++; 
            firstPlayerOfMatch = 'X'; 
        }
        localStorage.setItem('caro_scores', JSON.stringify(scores));
        displayScores();

        setTimeout(() => showWinner(`${currentPlayer} Chiến Thắng! 🎉`), 200);
        return;
    }

    // TỰ ĐỘNG GỢI Ý MỞ RỘNG BÀN CỜ KHI HẾT Ô TRỐNG
    if (boardData.flat().every(cell => cell !== '')) {
        if (BOARD_SIZE < 30) {
            showToast("Bàn cờ đã đầy! Đang tự động mở rộng không gian ván đấu...", "fa-expand");
            setTimeout(() => expandBoardSize(), 800);
        } else {
            isGameActive = false;
            cardX.classList.remove('active');
            cardO.classList.remove('active');
            document.querySelector('#card-X .player-status').textContent = "HÒA";
            document.querySelector('#card-O .player-status').textContent = "HÒA";
            
            scores.draw++;
            localStorage.setItem('caro_scores', JSON.stringify(scores));
            displayScores();
            setTimeout(() => showWinner("Trận đấu Hòa trên mọi mặt trận! 🤝"), 200);
        }
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
}

// --- THUẬT TOÁN ĐỈNH CAO: DỊCH CHUYỂN QUÂN CỜ VÀO KHU VỰC TÂM MẠP MỚI ---
function expandBoardSize() {
    const oldSize = BOARD_SIZE;
    currentSizeIndex = (currentSizeIndex + 1) % SIZE_OPTIONS.length;
    BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex];

    // Tạo một ma trận bàn cờ mới trống rỗng hoàn toàn với kích thước mới
    const newBoardData = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(''));
    
    // Tính khoảng cách offset để đặt mảng cũ lọt thỏm vào chính giữa mảng mới
    const offsetRow = Math.floor((BOARD_SIZE - oldSize) / 2);
    const offsetCol = Math.floor((BOARD_SIZE - oldSize) / 2);

    // Tiến hành sao chép vị trí dữ liệu
    for (let r = 0; r < oldSize; r++) {
        for (let c = 0; c < oldSize; c++) {
            newBoardData[r + offsetRow][c + offsetCol] = boardData[r][c];
        }
    }

    // Cập nhật lại tọa độ lịch sử moveHistory để tính năng Undo (Hoàn tác) không bị lệch ô
    moveHistory = moveHistory.map(move => ({
        row: move.row + offsetRow,
        col: move.col + offsetCol,
        player: move.player
    }));

    boardData = newBoardData;
    drawBoardElements(); // Vẽ lại giao diện bàn cờ mới giữ nguyên các quân cũ
    showToast(`Đã dịch chuyển ván đấu vào tâm map lớn ${BOARD_SIZE}x${BOARD_SIZE}!`, "fa-up-down-left-right");
}

// Xử lý sự kiện bấm nút Đổi Kích Thước Bàn Cờ ngoài thanh công cụ
toggleSizeBtn.addEventListener('click', async () => {
    playSound('action');

    // NÂNG CẤP CHẶN RIÊNG CHO MAP 30x30 ĐANG CHƠI DỞ
    if (BOARD_SIZE === 30 && isGameActive && moveHistory.length > 0) {
        const confirmChange = await showConfirmModal(
            "Ván đấu chưa kết thúc!",
            "Bạn đang chiến đấu trên chiến trường 30x30 vĩ đại. Đổi cỡ bàn cờ lúc này sẽ hủy bỏ và làm mất toàn bộ nước đi hiện tại. Bạn vẫn muốn tiếp tục chứ?",
            "danger" // Hiện icon cảnh báo tam giác đỏ rực chuyên nghiệp
        );
        
        // Nếu người chơi chọn "Hủy bỏ", dừng luồng code lại không làm gì cả
        if (!confirmChange) return;

        // Nếu chấp nhận hủy để đổi map: vòng về map đầu tiên (3x3 hoặc 15x15 tùy mảng SIZE_OPTIONS)
        currentSizeIndex = (currentSizeIndex + 1) % SIZE_OPTIONS.length;
        BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex];
        firstPlayerOfMatch = 'X'; 
        resetGame();
        showToast(`Đã hủy trận và đổi sang bàn cờ ${BOARD_SIZE}x${BOARD_SIZE}`, "fa-border-all");
        return;
    }
    // Nếu ván đấu đang diễn ra và đã có nước cờ, thực hiện mở rộng bảo lưu ván đấu
    if (isGameActive && moveHistory.length > 0) {
        expandBoardSize();
    } else {
        // Nếu ván đấu chưa bắt đầu hoặc đã kết thúc, tiến hành đổi kích thước map trống bình thường
        currentSizeIndex = (currentSizeIndex + 1) % SIZE_OPTIONS.length;
        BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex];
        firstPlayerOfMatch = 'X'; 
        resetGame();
        showToast(`Đã mở map trống kích thước ${BOARD_SIZE}x${BOARD_SIZE}`, "fa-border-all");
    }
});

undoBtn.addEventListener('click', async () => {
    if (moveHistory.length === 0 || !isGameActive) return;

    const confirmResult = await showConfirmModal(
        "Quay lại nước đi", 
        "Bạn có chắc chắn muốn rút lại nước đi vừa rồi không?",
        "primary"
    );

    if (confirmResult) {
        const lastMove = moveHistory.pop();
        boardData[lastMove.row][lastMove.col] = '';

        const cellElement = document.querySelector(`[data-row='${lastMove.row}'][data-col='${lastMove.col}']`);
        if (cellElement) {
            cellElement.textContent = '';
            cellElement.classList.remove('x', 'o');
        }

        currentPlayer = lastMove.player;
        updateTurnIndicator();
        showToast("Đã rút lại nước đi thành công!");
    }
});

resetBtn.addEventListener('click', async () => {
    if (isGameActive && moveHistory.length > 0) {
        const confirmResult = await showConfirmModal(
            "Hủy trận đấu hiện tại",
            "Ván đấu vẫn chưa phân định thắng bại. Bạn có muốn bắt đầu ván mới không?",
            "primary"
        );
        if (confirmResult) {
            resetGame();
            showToast("Đã bắt đầu ván đấu mới!");
        }
    } else {
        playSound('action');
        resetGame();
    }
});

cleanBtn.addEventListener('click', async () => {
    const confirmResult = await showConfirmModal(
        "Xóa toàn bộ tỷ số",
        "Hành động này sẽ đặt lại toàn bộ lịch sử Thắng / Thua về 0 và không thể hoàn tác. Bạn chắc chắn chứ?",
        "danger"
    );

    if (confirmResult) {
        scores = { xWin: 0, xLose: 0, oWin: 0, oLose: 0, draw: 0 };
        localStorage.setItem('caro_scores', JSON.stringify(scores));
        firstPlayerOfMatch = 'X'; 
        resetGame();
        showToast("Đã xóa toàn bộ bảng xếp hạng!", "fa-trash-can");
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
    
    const modalIcon = winningModal.querySelector('.modal-icon');
    if (message.includes("Hòa")) {
        winnerText.style.color = 'var(--text-color)';
        modalIcon.innerHTML = '<i class="fa-solid fa-handshake" style="color: #94a3b8;"></i>';
    } else {
        winnerText.style.color = currentPlayer === 'X' ? 'var(--color-x)' : 'var(--color-o)';
        modalIcon.innerHTML = '<i class="fa-solid fa-trophy" style="color: #eab308;"></i>';
    }
    
    winningModal.classList.add('show');
}

function resetGame() {
    currentPlayer = firstPlayerOfMatch; 
    isGameActive = true;
    winningModal.classList.remove('show');
    updateTurnIndicator();
    createBoard();
    // showToast(`Ván mới! Người chơi ${currentPlayer} đi trước.`, currentPlayer === 'X' ? 'fa-xmark' : 'fa-circle');
}

// Khởi chạy game lần đầu
createBoard();
modalResetBtn.addEventListener('click', () => {
    playSound('action');
    resetGame();
});