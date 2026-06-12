const boardElement = document.getElementById('board');
const toggleSizeBtn = document.getElementById('toggle-size-btn');
const modeBtn = document.getElementById('mode-btn'); 
const undoBtn = document.getElementById('undo-btn');
const resetBtn = document.getElementById('reset-btn');
const cleanBtn = document.getElementById('clean-btn');
const themeBtn = document.getElementById('theme-btn'); 
const modalResetBtn = document.getElementById('modal-reset-btn');
const winningModal = document.getElementById('winning-modal');
const winnerText = document.getElementById('winner-text');

const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-modal-title');
const confirmMessage = document.getElementById('confirm-modal-message');
const confirmIcon = document.getElementById('confirm-modal-icon');
const confirmBtnOk = document.getElementById('confirm-btn-ok');
const confirmBtnCancel = document.getElementById('confirm-btn-cancel');
const toastContainer = document.getElementById('toast-container');

const cardX = document.getElementById('card-X');
const cardO = document.getElementById('card-O');
const nameX = document.getElementById('name-X');
const nameO = document.getElementById('name-O');

const txtXWin = document.getElementById('score-x-win');
const txtXLose = document.getElementById('score-x-lose');
const txtOWin = document.getElementById('score-o-win');
const txtOLose = document.getElementById('score-o-lose');

const SIZE_OPTIONS = [3, 15, 30]; 
let currentSizeIndex = 0; 
let BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex]; 

let isVsAI = false;           
let firstPlayerOfMatch = 'X'; 
let currentPlayer = 'X';      
let isGameActive = true;
let boardData = [];
let moveHistory = [];

// ĐÃ BỎ SCORE ĐOẠN HÒA
let scores = JSON.parse(localStorage.getItem('caro_scores')) || {
    xWin: 0, xLose: 0, oWin: 0, oLose: 0
};

// AUDIO BỘ KHỞI TẠO
let audioCtx = null;
function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'click-x') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'click-o') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(493.88, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
            gainNode.gain.setValueAtTime(0.15, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        } else if (type === 'win') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.1); osc.frequency.setValueAtTime(783.99, now + 0.2);
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.4);
            gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start(now); osc.stop(now + 0.6);
        } else if (type === 'action') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
            gainNode.gain.setValueAtTime(0.08, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        }
    } catch (e) { console.log(e); }
}

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
            confirmIcon.innerHTML = '<i class="fa-solid fa-circle-question" style="color: #38bdf8;"></i>';
            confirmBtnOk.className = 'popup-btn-primary';
        }
        confirmModal.classList.add('show');
        confirmBtnOk.onclick = () => { playSound('action'); confirmModal.classList.remove('show'); resolve(true); };
        confirmBtnCancel.onclick = () => { playSound('action'); confirmModal.classList.remove('show'); resolve(false); };
    });
}

// THEME CONTROL
let currentTheme = localStorage.getItem('caro_theme') || 'dark';
if (currentTheme === 'light') {
    document.body.classList.add('light-mode'); themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
} else {
    themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
}
themeBtn.addEventListener('click', () => {
    playSound('action'); document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('caro_theme', 'light'); themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        localStorage.setItem('caro_theme', 'dark'); themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
});

// Tìm và thay thế sự kiện click của modeBtn bằng đoạn mã này:
modeBtn.addEventListener('click', async () => {
    playSound('action');
    if (moveHistory.length > 0 && isGameActive) {
        const resetOk = await showConfirmModal(
            "Đổi chế độ chơi?", 
            "Trận đấu đang diễn ra sẽ bị hủy bỏ hoàn toàn để áp dụng chế độ mới. Bạn đồng ý chứ?", 
            "danger"
        );
        if (!resetOk) return;
    }
    
    const modeIcon = document.getElementById('mode-icon');
    isVsAI = !isVsAI;
    
    if (isVsAI) {
        // Chuyển sang chế độ Máy AI
        modeBtn.className = "icon-btn mode-pve";
        modeIcon.className = "fa-solid fa-robot"; // Đổi sang icon robot
        nameO.textContent = "Siêu Máy AI 🤖"; 
        showToast("Kích hoạt Siêu Máy AI!", "fa-robot");
    } else {
        // Quay về chế độ Người vs Người
        modeBtn.className = "icon-btn secondary-glow mode-pvp";
        modeIcon.className = "fa-solid fa-user-group"; // Đổi lại icon nhóm người
        nameO.textContent = "Người chơi O"; 
        showToast("Đã chuyển về chế độ PvP!", "fa-user-group");
    }
    
    firstPlayerOfMatch = 'X';
    resetGame();
});

function displayScores() {
    txtXWin.textContent = scores.xWin; txtXLose.textContent = scores.xLose;
    txtOWin.textContent = scores.oWin; txtOLose.textContent = scores.oLose;
}

function drawBoardElements() {
    boardElement.innerHTML = '';
    boardElement.setAttribute('data-size', BOARD_SIZE);
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell'); cell.setAttribute('data-row', r); cell.setAttribute('data-col', c);
            if (boardData[r][c] !== '') {
                cell.textContent = boardData[r][c]; cell.classList.add(boardData[r][c].toLowerCase());
            }
            cell.addEventListener('click', () => handleCellClick(r, c, cell));
            boardElement.appendChild(cell);
        }
    }
    toggleSizeBtn.textContent = `${BOARD_SIZE} x ${BOARD_SIZE}`;
}

function createBoard() {
    boardData = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(''));
    moveHistory = []; drawBoardElements(); displayScores();
}

function handleCellClick(row, col, cellElement) {
    if (boardData[row][col] !== '' || !isGameActive) return;
    if (isVsAI && currentPlayer === 'O') return;
    makeMove(row, col, cellElement);
}

function makeMove(row, col, cellElement) {
    if (!cellElement) {
        cellElement = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    }

    if (currentPlayer === 'X') playSound('click-x'); else playSound('click-o');

    moveHistory.push({ row, col, player: currentPlayer });
    boardData[row][col] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.classList.add(currentPlayer.toLowerCase());

    document.querySelectorAll('.cell').forEach(c => c.classList.remove('last-move'));
    cellElement.classList.add('last-move');

    if (checkWin(row, col)) {
        isGameActive = false; playSound('win');
        document.querySelector(`#card-${currentPlayer} .player-status`).textContent = "WINNER! 🎉";
        document.querySelector(`#card-${currentPlayer === 'X' ? 'O' : 'X'} .player-status`).textContent = "THUA CUỘC";
        
        if (currentPlayer === 'X') { scores.xWin++; scores.oLose++; firstPlayerOfMatch = 'O'; } 
        else { scores.oWin++; scores.xLose++; firstPlayerOfMatch = 'X'; }
        localStorage.setItem('caro_scores', JSON.stringify(scores)); displayScores();
        setTimeout(() => showWinner(isVsAI && currentPlayer === 'O' ? "Máy AI đã chiến thắng! 🤖" : `${currentPlayer} Chiến Thắng! 🎉`), 200);
        return;
    }

    if (boardData.flat().every(cell => cell !== '')) {
        if (BOARD_SIZE === 3 || BOARD_SIZE === 30) {
            isGameActive = false; cardX.classList.remove('active'); cardO.classList.remove('active');
            setTimeout(() => showWinner("Trận đấu Hòa! 🤝"), 200); // Không cộng điểm vào score nữa
        } else {
            showToast("Bàn cờ đã đầy! Đang tự động mở rộng không gian ván đấu...", "fa-expand");
            setTimeout(() => expandBoardSize(), 800);
        }
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();

    if (isGameActive && isVsAI && currentPlayer === 'O') {
        setTimeout(() => makeAIMove(), 100); 
    }
}

// ==================== SIÊU AI NÂNG CẤP CHUYÊN SÂU ====================

// Bộ lọc tìm kiếm các ô tiềm năng xung quanh các quân cờ đã đánh
function getPotentialMoves() {
    let moveSet = new Set();
    let hasPieces = false;

    // Quét toàn bộ bàn cờ để tìm các ô trống trong phạm vi 2 ô xung quanh quân đã có
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (boardData[r][c] !== '') {
                hasPieces = true;
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardData[nr][nc] === '') {
                            moveSet.add(`${nr},${nc}`);
                        }
                    }
                }
            }
        }
    }

    // Nếu bàn cờ trống, ưu tiên đánh ngay chính giữa
    if (!hasPieces) {
        let center = Math.floor(BOARD_SIZE / 2);
        return [{r: center, c: center, score: 1000}];
    }

    // Chuyển Set thành mảng và đánh giá sơ bộ điểm số để lọc ra các ô tốt nhất
    let moves = Array.from(moveSet).map(str => {
        let [r, c] = str.split(',').map(Number);
        // Điểm kết hợp: Ưu tiên tối đa cho việc vừa Tấn công vừa chặn đứng Phòng ngự
        let scoreAI = evaluateStaticPoint(r, c, 'O');
        let scoreHuman = evaluateStaticPoint(r, c, 'X');
        
        // Trọng số chiến thuật: Kết hợp khôn ngoan giữa Công và Thủ
        let combinedScore = scoreAI + scoreHuman * 0.95;
        return { r, c, score: combinedScore };
    });

    // Sắp xếp giảm dần theo điểm số
    moves.sort((a, b) => b.score - a.score);
    
    // Cắt tỉa (Pruning): Chỉ lấy tối đa 8 nước đi tốt nhất để đi sâu tính toán, tránh treo máy
    return moves.slice(0, 8);
}

// Hàm kích hoạt nước đi của AI
function makeAIMove() {
    // Tăng độ sâu tính toán: Bản 3x3 tính hết 10 bước, bản lớn tính sâu tối ưu
    let depth = (BOARD_SIZE === 3) ? 10 : 6; 
    let bestScore = -Infinity;
    let bestMove = null;

    let potentialMoves = getPotentialMoves();

    for (let move of potentialMoves) {
        // Giả lập AI đánh thử
        boardData[move.r][move.c] = 'O';
        // Tính toán phản ứng của đối thủ qua nhiều bước đi bằng thuật toán Minimax Alpha-Beta
        let score = minimaxAlphaBeta(depth - 1, -Infinity, Infinity, false, move.r, move.c);
        // Trả lại trạng thái bàn cờ
        boardData[move.r][move.c] = '';

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    // Thực hiện nước đi tối ưu và tinh quái nhất tìm được
    if (bestMove) {
        makeMove(bestMove.r, bestMove.c, null);
    }
}

// Thuật toán duyệt cây tính trước nước đi có cắt tỉa Alpha-Beta
function minimaxAlphaBeta(depth, alpha, beta, isMaximizing, lastR, lastC) {
    // Nếu nước đi trước đó dẫn đến chiến thắng đổi trạng thái điểm số cực đại
    if (checkWinStatic(lastR, lastC)) {
        return isMaximizing ? -20000000 - depth : 20000000 + depth;
    }
    // Nếu chạm đến giới hạn bước tính toán trước hoặc hết ô trống, trả về điểm thực tế của bàn cờ
    if (depth === 0) {
        return evaluateGlobalBoard();
    }

    let potentialMoves = getPotentialMoves();
    if (potentialMoves.length === 0) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of potentialMoves) {
            boardData[move.r][move.c] = 'O';
            let evaluation = minimaxAlphaBeta(depth - 1, alpha, beta, false, move.r, move.c);
            boardData[move.r][move.c] = '';
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break; // Cắt nhánh Alpha
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of potentialMoves) {
            boardData[move.r][move.c] = 'X';
            let evaluation = minimaxAlphaBeta(depth - 1, alpha, beta, true, move.r, move.c);
            boardData[move.r][move.c] = '';
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break; // Cắt nhánh Beta
        }
        return minEval;
    }
}

// Hàm lượng giá toàn bộ cục diện bàn cờ từ góc nhìn của AI
function evaluateGlobalBoard() {
    let totalScore = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (boardData[r][c] === 'O') {
                totalScore += evaluateStaticPoint(r, c, 'O');
            } else if (boardData[r][c] === 'X') {
                totalScore -= evaluateStaticPoint(r, c, 'X') * 1.15; // Đánh giá cao mối nguy hiểm từ người chơi
            }
        }
    }
    return totalScore;
}

// HỆ THỐNG ĐIỂM CHIẾN THUẬT: ĐỊNH NGHĨA CÁC THẾ CỜ CÔNG, THỦ VÀ ĐÁNH LỪA (BẪY)
function evaluateStaticPoint(r, c, player) {
    const directions = [ {dr:0, dc:1}, {dr:1, dc:0}, {dr:1, dc:1}, {dr:1, dc:-1} ];
    let score = 0;
    
    // Đếm số lượng đường tạo bẫy nước đôi (Ví dụ: đồng thời tạo 2 đường 3 mở hoặc đường 4)
    let openThrees = 0;
    let openFours = 0;

    for (let {dr, dc} of directions) {
        let count = 1;
        let openEnds = 0;

        // Quét theo chiều tiến
        let i = 1;
        while (true) {
            let nr = r + dr * i, nc = c + dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (boardData[nr][nc] === player) { count++; i++; }
                else if (boardData[nr][nc] === '') { openEnds++; break; }
                else { break; } // Bị chặn bởi đối thủ
            } else { break; } // Chạm biên bàn cờ
        }

        // Quét theo chiều lùi
        let j = 1;
        while (true) {
            let nr = r - dr * j, nc = c - dc * j;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (boardData[nr][nc] === player) { count++; j++; }
                else if (boardData[nr][nc] === '') { openEnds++; break; }
                else { break; }
            } else { break; }
        }

        // --- HỆ THỐNG CỘNG ĐIỂM CHIẾN THUẬT CHUYÊN SÂU ---
        if (count >= 5) {
            score += 10000000; // Đánh nước này là thắng luôn ngay lập tức
        } else if (count === 4) {
            if (openEnds === 2) {
                score += 500000; // Đường 4 mở 2 đầu (vô địch, không thể chặn)
                openFours++;
            } else if (openEnds === 1) {
                score += 100000; // Đường 4 bị chặn 1 đầu, đối thủ bắt buộc phải chặn đầu còn lại
            }
        } else if (count === 3) {
            if (openEnds === 2) {
                score += 10000; // Đường 3 mở 2 đầu cực nguy hiểm
                openThrees++;
            } else if (openEnds === 1) {
                score += 1000;
            }
        } else if (count === 2) {
            if (openEnds === 2) score += 200;
            else if (openEnds === 1) score += 40;
        }
    }

    // --- LOGIC KIẾN TẠO NƯỚC ĐÁNH LỪA / TẠO BẪY ĐỐI THỦ ---
    // Nếu nước đi tạo ra thế nước đôi nguy hiểm (Ví dụ: 2 đường 3 mở cùng lúc, hoặc kết hợp 3 mở và 4)
    if (openThrees >= 2) {
        score += 300000; // Bẫy chí mạng "Double Three" - Buộc đối thủ rơi vào bẫy toán học không thể hóa giải
    }
    if (openFours >= 1 && openThrees >= 1) {
        score += 400000; // Bẫy cực mạnh kết hợp tấn công dồn dập
    }

    return score;
}

function checkWinStatic(r, c) {
    const player = boardData[r][c];
    if (!player) return false;
    const targetCount = (BOARD_SIZE === 3) ? 3 : 5;
    const directions = [ { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 } ];

    for (let { dr, dc } of directions) {
        let count = 1;
        let i = 1;
        while (true) {
            let nr = r + dr * i, nc = c + dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardData[nr][nc] === player) { count++; i++; } else { break; }
        }
        let j = 1;
        while (true) {
            let nr = r - dr * j, nc = c - dc * j;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardData[nr][nc] === player) { count++; j++; } else { break; }
        }
        if (count >= targetCount) return true;
    }
    return false;
}

function expandBoardSize() {
    const oldSize = BOARD_SIZE;
    currentSizeIndex = (currentSizeIndex + 1) % SIZE_OPTIONS.length;
    BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex];

    const newBoardData = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(''));
    const offsetRow = Math.floor((BOARD_SIZE - oldSize) / 2);
    const offsetCol = Math.floor((BOARD_SIZE - oldSize) / 2);

    for (let r = 0; r < oldSize; r++) {
        for (let c = 0; c < oldSize; c++) { newBoardData[r + offsetRow][c + offsetCol] = boardData[r][c]; }
    }

    moveHistory = moveHistory.map(move => ({ row: move.row + offsetRow, col: move.col + offsetCol, player: move.player }));
    boardData = newBoardData; drawBoardElements();
    showToast(`Đã dịch chuyển trận đấu vào tâm map lớn ${BOARD_SIZE}x${BOARD_SIZE}!`, "fa-up-down-left-right");
}

toggleSizeBtn.addEventListener('click', async () => {
    playSound('action');
    if (BOARD_SIZE === 30 && isGameActive && moveHistory.length > 0) {
        const confirmChange = await showConfirmModal("Ván đấu chưa kết thúc!", "Bạn đang ở map 30x30 vĩ đại. Đổi cỡ bàn cờ lúc này sẽ hủy trận. Đồng ý chứ?", "danger");
        if (!confirmChange) return;
        currentSizeIndex = (currentSizeIndex + 1) % SIZE_OPTIONS.length;
        BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex];
        firstPlayerOfMatch = 'X'; resetGame();
        return;
    }

    if (isGameActive && moveHistory.length > 0) { expandBoardSize(); } 
    else {
        currentSizeIndex = (currentSizeIndex + 1) % SIZE_OPTIONS.length;
        BOARD_SIZE = SIZE_OPTIONS[currentSizeIndex];
        firstPlayerOfMatch = 'X'; resetGame();
        showToast(`Đã mở map trống kích thước ${BOARD_SIZE}x${BOARD_SIZE}`, "fa-border-all");
    }
});

undoBtn.addEventListener('click', async () => {
    if (moveHistory.length === 0 || !isGameActive) return;
    if (isVsAI && moveHistory.length < 2 && currentPlayer === 'X') return;

    const confirmResult = await showConfirmModal("Quay lại nước đi", "Bạn có chắc muốn rút lại nước đi không?", "primary");
    if (confirmResult) {
        let lastMove = moveHistory.pop(); boardData[lastMove.row][lastMove.col] = '';
        let cellElement = document.querySelector(`[data-row='${lastMove.row}'][data-col='${lastMove.col}']`);
        if (cellElement) { cellElement.textContent = ''; cellElement.className = 'cell'; }

        if (isVsAI && moveHistory.length > 0) {
            lastMove = moveHistory.pop(); boardData[lastMove.row][lastMove.col] = '';
            cellElement = document.querySelector(`[data-row='${lastMove.row}'][data-col='${lastMove.col}']`);
            if (cellElement) { cellElement.textContent = ''; cellElement.className = 'cell'; }
        }
        currentPlayer = 'X'; updateTurnIndicator(); showToast("Đã rút lại nước đi!");
    }
});

resetBtn.addEventListener('click', async () => {
    if (isGameActive && moveHistory.length > 0) {
        const confirmResult = await showConfirmModal("Hủy trận hiện tại", "Ván đấu chưa kết thúc. Bạn có muốn bắt đầu ván mới?", "primary");
        if (confirmResult) { resetGame(); showToast("Đã khởi tạo ván đấu mới!"); }
    } else { playSound('action'); resetGame(); }
});

cleanBtn.addEventListener('click', async () => {
    const confirmResult = await showConfirmModal("Xóa toàn bộ tỷ số", "Đặt lại tỷ số về 0 và không thể phục hồi. Đồng ý chứ?", "danger");
    if (confirmResult) {
        scores = { xWin: 0, xLose: 0, oWin: 0, oLose: 0 };
        localStorage.setItem('caro_scores', JSON.stringify(scores));
        firstPlayerOfMatch = 'X'; resetGame(); showToast("Đã xóa sạch bảng xếp hạng!", "fa-trash-can");
    }
});

function updateTurnIndicator() {
    if (currentPlayer === 'X') {
        cardX.classList.add('active'); cardO.classList.remove('active');
        cardX.querySelector('.player-status').textContent = "Đang nghĩ...";
        cardO.querySelector('.player-status').textContent = "Chờ lượt";
    } else {
        cardO.classList.add('active'); cardX.classList.remove('active');
        cardO.querySelector('.player-status').textContent = isVsAI ? "AI đang tính..." : "Đang nghĩ...";
        cardX.querySelector('.player-status').textContent = "Chờ lượt";
    }
}

function checkWin(r, c) {
    const player = boardData[r][c];
    const targetCount = (BOARD_SIZE === 3) ? 3 : 5;
    const directions = [ { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 } ];

    for (let { dr, dc } of directions) {
        let count = 1; let winCells = [[r, c]];
        let i = 1;
        while (true) {
            let nr = r + dr * i; let nc = c + dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardData[nr][nc] === player) { count++; winCells.push([nr, nc]); i++; } else { break; }
        }
        let j = 1;
        while (true) {
            let nr = r - dr * j; let nc = c - dc * j;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardData[nr][nc] === player) { count++; winCells.push([nr, nc]); j++; } else { break; }
        }
        if (count >= targetCount) { highlightWinCells(winCells); return true; }
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
        winnerText.style.color = 'var(--text-color)'; modalIcon.innerHTML = '<i class="fa-solid fa-handshake" style="color: #94a3b8;"></i>';
    } else {
        winnerText.style.color = currentPlayer === 'X' ? 'var(--color-x)' : 'var(--color-o)';
        modalIcon.innerHTML = message.includes("🤖") ? '<i class="fa-solid fa-robot" style="color: #a855f7;"></i>' : '<i class="fa-solid fa-trophy" style="color: #eab308;"></i>';
    }
    winningModal.classList.add('show');
}

function resetGame() {
    currentPlayer = firstPlayerOfMatch; isGameActive = true;
    winningModal.classList.remove('show'); updateTurnIndicator(); createBoard();
    // showToast(`Trận mới bắt đầu! Lượt đi trước: ${currentPlayer}`, currentPlayer === 'X' ? 'fa-xmark' : 'fa-circle');
    if (isVsAI && currentPlayer === 'O') { setTimeout(() => makeAIMove(), 500); }
}

createBoard();
modalResetBtn.addEventListener('click', () => { playSound('action'); resetGame(); });