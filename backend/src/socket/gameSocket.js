const aiService = require('../services/aiService');

/**
 * Game Socket Handler — Quản lý phòng Live Challenge (Real-time Multiplayer)
 *
 * Workflow:
 * 1. Client emit 'game:find_match' → Server tìm/tạo phòng chờ
 * 2. Khi phòng đủ người (MIN_PLAYERS) → Server lock phòng, gọi AI tạo câu hỏi
 * 3. Server broadcast 'game:start' với câu hỏi đầu tiên
 * 4. Mỗi câu hỏi có countdown (TICK_SECONDS). Client gửi 'game:answer' trước khi hết giờ
 * 5. Khi hết giờ hoặc tất cả đã trả lời → Server tính điểm, broadcast kết quả
 * 6. Lặp lại đến hết câu hỏi → broadcast 'game:finished' với bảng xếp hạng
 *
 * Events:
 * Client → Server:
 *   - 'game:find_match'   : Tìm trận
 *   - 'game:answer'       : Gửi đáp án { questionIndex, answer }
 *   - 'game:leave'        : Rời phòng
 *
 * Server → Client:
 *   - 'game:waiting'      : Đang chờ đối thủ { roomId, players }
 *   - 'game:player_joined': Có người mới vào { players }
 *   - 'game:countdown'    : Đếm ngược trước khi bắt đầu { seconds }
 *   - 'game:question'     : Câu hỏi mới { index, total, question, options, timeLeft }
 *   - 'game:tick'         : Cập nhật thời gian còn lại { timeLeft }
 *   - 'game:answer_result': Kết quả trả lời { standings }
 *   - 'game:finished'     : Kết thúc trận { standings, winner }
 *   - 'game:player_left'  : Người chơi rời phòng { players }
 *   - 'game:error'        : Lỗi { message }
 */

const TOTAL_QUESTIONS = 10;
const TICK_SECONDS = 15;          // Giây cho mỗi câu hỏi
const MIN_PLAYERS = 2;            // Tối thiểu để bắt đầu
const MAX_PLAYERS = 8;            // Tối đa mỗi phòng
const COUNTDOWN_SECONDS = 10;     // Đếm ngược trước khi bắt đầu (đủ thời gian cho nhiều người cùng vào)
const CORRECT_POINTS = 100;       // Điểm cơ bản khi đúng
const SPEED_BONUS_MAX = 50;       // Điểm bonus tối đa theo tốc độ

// Lưu trữ các phòng chơi đang hoạt động
// Key: roomId, Value: { players, questions, currentQuestion, timer, state, ... }
const rooms = new Map();

// Ánh xạ: socketId → roomId (để xử lý disconnect)
const playerRoomMap = new Map();

/**
 * Tạo ID phòng ngắn gọn
 */
function generateRoomId() {
    return 'room_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

/**
 * Tìm phòng chờ đang mở (state === 'waiting' và chưa đủ người)
 */
function findAvailableRoom() {
    for (const [roomId, room] of rooms) {
        // Cho phép vào phòng khi đang 'waiting' HOẶC đang 'countdown'
        if ((room.state === 'waiting' || room.state === 'countdown') && room.players.size < MAX_PLAYERS) {
            return roomId;
        }
    }
    return null;
}

/**
 * Tính điểm dựa trên độ chính xác và tốc độ trả lời
 */
function calculatePoints(isCorrect, timeLeft) {
    if (!isCorrect) return 0;
    const speedBonus = Math.round((timeLeft / TICK_SECONDS) * SPEED_BONUS_MAX);
    return CORRECT_POINTS + speedBonus;
}

/**
 * Lấy bảng xếp hạng hiện tại của phòng
 */
function getStandings(room) {
    const standings = [];
    for (const [socketId, player] of room.players) {
        standings.push({
            id: player.userId,
            name: player.name,
            score: player.score,
            correctCount: player.correctCount,
            position: 0 // Sẽ tính sau khi sort
        });
    }
    standings.sort((a, b) => b.score - a.score);
    standings.forEach((s, i) => s.position = i + 1);
    return standings;
}

/**
 * Gửi câu hỏi tiếp theo cho phòng
 */
function sendNextQuestion(io, roomId) {
    const room = rooms.get(roomId);
    if (!room || room.state !== 'playing') return;

    // Đảm bảo dừng timer cũ nếu có
    if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
    }

    const qIndex = room.currentQuestion;

    // Hết câu hỏi → kết thúc
    if (qIndex >= room.questions.length) {
        endGame(io, roomId);
        return;
    }

    const q = room.questions[qIndex];
    // Reset answers cho câu mới
    room.answeredThisRound.clear();
    room.questionStartTime = Date.now();

    // Gửi câu hỏi cho tất cả người chơi (KHÔNG gửi đáp án đúng)
    const questionText = q.content?.split('\n\n[EXPLAIN]')[0] || q.question || '';
    let options = q.options;
    if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch { options = []; }
    }

    const playersList = Array.from(room.players.values()).map(p => ({
        id: p.userId,
        name: p.name,
        score: p.score,
        correctCount: p.correctCount
    }));

    io.to(roomId).emit('game:question', {
        index: qIndex,
        total: room.questions.length,
        question: questionText,
        options: options,
        timeLeft: TICK_SECONDS,
        players: playersList
    });

    // Bắt đầu đếm ngược
    let timeLeft = TICK_SECONDS;
    room.timer = setInterval(() => {
        timeLeft--;
        io.to(roomId).emit('game:tick', { timeLeft });

        if (timeLeft <= 0) {
            clearInterval(room.timer);
            room.timer = null;
            // Xử lý kết quả câu hỏi
            processQuestionEnd(io, roomId);
        }
    }, 1000);
}

/**
 * Xử lý khi câu hỏi kết thúc (hết giờ hoặc tất cả đã trả lời)
 */
function processQuestionEnd(io, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Dừng timer nếu còn
    if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
    }

    const q = room.questions[room.currentQuestion];
    const correctAnswer = q.correct_answer;

    // Tính điểm cho những ai chưa trả lời (coi như sai)
    // Những ai đã trả lời thì đã được tính trong 'game:answer'

    // Gửi kết quả câu hỏi
    const standings = getStandings(room);
    io.to(roomId).emit('game:answer_result', {
        correctAnswer,
        standings,
        questionIndex: room.currentQuestion
    });

    // Chuyển sang câu tiếp theo sau 3 giây
    room.currentQuestion++;
    setTimeout(() => {
        sendNextQuestion(io, roomId);
    }, 3000);
}

/**
 * Kết thúc trận đấu
 */
function endGame(io, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.state = 'finished';
    if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
    }

    const standings = getStandings(room);
    const winner = standings[0] || null;

    io.to(roomId).emit('game:finished', { standings, winner });

    // Xử lý Lưu kết quả vào Database, Badges và xóa ánh xạ
    const { sequelize } = require('../config/database');
    const { QueryTypes } = require('sequelize');
    const badgeChecker = require('../services/badgeChecker');

    for (const [socketId, player] of room.players) {
        playerRoomMap.delete(socketId);
        
        // 1. Lưu kết quả thi đấu vào bảng results để hiển thị trên Leaderboard
        // Tính toán sơ bộ thời gian chơi (khoảng TICK_SECONDS * số câu hỏi)
        const estimatedTime = room.questions.length * TICK_SECONDS;
        
        sequelize.query(`
            INSERT INTO results (user_id, score, correct_count, wrong_count, time_taken, game_mode, created_at)
            VALUES (?, ?, ?, ?, ?, 'LIVE', NOW())
        `, {
            replacements: [
                player.userId,
                player.score,
                player.correctCount,
                Math.max(0, room.questions.length - player.correctCount),
                estimatedTime
            ],
            type: QueryTypes.INSERT
        }).catch(err => console.error("Error saving live result to DB:", err));

        // 2. Gọi service kiểm tra badge
        const isWinner = winner && winner.id === player.userId;
        badgeChecker.processQuizCompletion(player.userId, {
            correctCount: player.correctCount,
            totalQuestions: room.questions.length,
            timeTaken: 0, // Live mode tính time theo tick
            isLiveWinner: isWinner
        }, 'LIVE').then(newBadges => {
            if (newBadges && newBadges.length > 0) {
                io.to(socketId).emit('game:badge_unlocked', { badges: newBadges });
            }
        }).catch(err => console.error("Error processing live badges:", err));
    }

    // Dọn dẹp phòng sau 10 giây
    setTimeout(() => {
        rooms.delete(roomId);
    }, 10000);
}

/**
 * Khởi tạo Game Socket — được gọi từ socket.js chính
 */
function initGameSocket(io) {
    // Sử dụng namespace '/game' để tách biệt khỏi chat
    const gameNs = io.of('/game');

    // Middleware xác thực (tái sử dụng từ main io)
    const jwt = require('jsonwebtoken');
    gameNs.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('No token'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    const updateOnlineCount = () => {
        gameNs.emit('game:online_count', gameNs.sockets.size);
    };

    gameNs.on('connection', (socket) => {
        const userId = socket.user.id;
        const userName = socket.user.name || `Player_${userId}`;
        console.log(`🎮 Game: User ${userName} connected (${socket.id})`);

        updateOnlineCount();

        // ═══ FIND MATCH ═══
        socket.on('game:find_match', async () => {
            // Kiểm tra xem user đã ở trong phòng nào chưa
            if (playerRoomMap.has(socket.id)) {
                socket.emit('game:error', { message: 'Bạn đang trong một trận đấu khác!' });
                return;
            }

            let roomId = findAvailableRoom();
            let room;

            if (roomId) {
                // Vào phòng đã có
                room = rooms.get(roomId);
            } else {
                // Tạo phòng mới
                roomId = generateRoomId();
                room = {
                    state: 'waiting',
                    players: new Map(),
                    questions: [],
                    currentQuestion: 0,
                    answeredThisRound: new Set(),
                    readyPlayers: new Set(),
                    questionStartTime: null,
                    timer: null
                };
                rooms.set(roomId, room);
            }

            // Thêm người chơi vào phòng
            room.players.set(socket.id, {
                userId,
                name: userName,
                score: 0,
                correctCount: 0,
                socketId: socket.id
            });
            playerRoomMap.set(socket.id, roomId);
            socket.join(roomId);

            // Lấy danh sách người chơi
            const playersList = Array.from(room.players.values()).map(p => ({
                id: p.userId,
                name: p.name,
                score: p.score
            }));

            // Thông báo cho tất cả trong phòng
            gameNs.to(roomId).emit('game:player_joined', { players: playersList, roomId });
            socket.emit('game:waiting', { roomId, players: playersList });

            // Nếu người chơi vào lúc phòng đang countdown, thông báo cho họ biết
            if (room.state === 'countdown' && room.currentCountdown !== undefined) {
                socket.emit('game:countdown', { seconds: room.currentCountdown });
            }

            // Nếu đủ người → bắt đầu countdown
            if (room.players.size >= MIN_PLAYERS && room.state === 'waiting') {
                room.state = 'countdown';

                // Countdown 5 giây
                let countdown = COUNTDOWN_SECONDS;
                const countdownTimer = setInterval(async () => {
                    room.currentCountdown = countdown; // Lưu lại để người vào sau biết
                    gameNs.to(roomId).emit('game:countdown', { seconds: countdown });
                    countdown--;

                    if (countdown < 0) {
                        clearInterval(countdownTimer);
                        delete room.currentCountdown;

                        // Tải câu hỏi từ AI
                        try {
                            const questionsFromAi = await aiService.generateRandomQuizFromAI(TOTAL_QUESTIONS);
                            room.questions = questionsFromAi.map(q => ({
                                content: q.question + (q.explanation ? `\n\n[EXPLAIN]${q.explanation}` : ""),
                                options: q.options,
                                correct_answer: q.correct_answer
                            }));

                            room.state = 'playing';
                            room.currentQuestion = 0;
                            room.readyPlayers.clear(); // Reset ready state trước khi bắt đầu

                            gameNs.to(roomId).emit('game:start', {
                                totalQuestions: room.questions.length,
                                players: playersList
                            });

                            // KHÔNG gọi sendNextQuestion ngay, chờ handshake 'game:client_ready'
                            console.log(`🎮 Game: Room ${roomId} started. Waiting for players to be ready...`);
                            
                            // Timeout bảo vệ: Nếu sau 5 giây không đủ người ready, tự động bắt đầu
                            room.startTimeout = setTimeout(() => {
                                if (room.state === 'playing' && room.readyPlayers.size < room.players.size) {
                                    console.log(`🎮 Game: Handshake timeout for ${roomId}. Starting anyway.`);
                                    sendNextQuestion(gameNs, roomId);
                                }
                            }, 5000);

                        } catch (error) {
                            console.error('Game: Error generating questions:', error);
                            gameNs.to(roomId).emit('game:error', { message: 'Lỗi tạo câu hỏi. Vui lòng thử lại!' });
                            room.state = 'waiting';
                        }
                    }
                }, 1000);
            }
        });

        // ═══ CLIENT READY HANDSHAKE ═══
        socket.on('game:client_ready', ({ roomId }) => {
            const room = rooms.get(roomId);
            if (!room || room.state !== 'playing') return;

            room.readyPlayers.add(socket.id);
            console.log(`🎮 Game: Player ${socket.id} ready in ${roomId} (${room.readyPlayers.size}/${room.players.size})`);

            // Nếu tất cả đã sẵn sàng → Gửi câu hỏi đầu tiên
            if (room.readyPlayers.size >= room.players.size) {
                if (room.startTimeout) {
                    clearTimeout(room.startTimeout);
                    room.startTimeout = null;
                }
                // Chỉ gửi câu hỏi đầu tiên nếu chưa bắt đầu (currentQuestion vẫn là 0)
                if (room.timer === null && room.currentQuestion === 0) {
                    sendNextQuestion(gameNs, roomId);
                }
            }
        });

        // ═══ ANSWER ═══
        socket.on('game:answer', ({ questionIndex, answer }) => {
            const roomId = playerRoomMap.get(socket.id);
            if (!roomId) return;

            const room = rooms.get(roomId);
            if (!room || room.state !== 'playing') return;
            if (questionIndex !== room.currentQuestion) return;
            if (room.answeredThisRound.has(socket.id)) return; // Đã trả lời rồi

            const player = room.players.get(socket.id);
            if (!player) return;

            room.answeredThisRound.add(socket.id);

            // Thông báo cho cả phòng biết ai vừa chốt đáp án
            gameNs.to(roomId).emit('game:player_answered', { 
                playerId: player.userId, 
                playerName: player.name 
            });

            const q = room.questions[questionIndex];
            const isCorrect = answer === q.correct_answer;
            const timeElapsed = (Date.now() - room.questionStartTime) / 1000;
            const timeLeft = Math.max(0, TICK_SECONDS - timeElapsed);
            const points = calculatePoints(isCorrect, timeLeft);

            // Cập nhật điểm
            player.score += points;
            if (isCorrect) player.correctCount++;

            // Nếu tất cả đã trả lời → kết thúc câu sớm
            if (room.answeredThisRound.size >= room.players.size) {
                processQuestionEnd(gameNs, roomId);
            }
        });

        // ═══ LEAVE ═══
        socket.on('game:leave', () => {
            handlePlayerLeave(gameNs, socket);
        });

        // ═══ DISCONNECT ═══
        socket.on('disconnect', () => {
            console.log(`🎮 Game: User ${userName} disconnected`);
            handlePlayerLeave(gameNs, socket);
            updateOnlineCount();
        });
    });

    return gameNs;
}

/**
 * Xử lý khi người chơi rời phòng hoặc mất kết nối
 */
function handlePlayerLeave(io, socket) {
    const roomId = playerRoomMap.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) {
        playerRoomMap.delete(socket.id);
        return;
    }

    room.players.delete(socket.id);
    playerRoomMap.delete(socket.id);
    socket.leave(roomId);

    const playersList = Array.from(room.players.values()).map(p => ({
        id: p.userId,
        name: p.name,
        score: p.score
    }));

    io.to(roomId).emit('game:player_left', { players: playersList });

    // Nếu phòng trống → xóa phòng
    if (room.players.size === 0) {
        if (room.timer) clearInterval(room.timer);
        if (room.startTimeout) clearTimeout(room.startTimeout);
        rooms.delete(roomId);
    }
    // Nếu đang trong quá trình chờ handshake mà có người rời
    else if (room.state === 'playing' && room.currentQuestion === 0 && room.readyPlayers) {
        room.readyPlayers.delete(socket.id);
        if (room.readyPlayers.size >= room.players.size && room.players.size > 0) {
            if (room.startTimeout) {
                clearTimeout(room.startTimeout);
                room.startTimeout = null;
            }
            if (room.timer === null) {
                sendNextQuestion(io, roomId);
            }
        }
    }
    // Nếu đang chơi mà chỉ còn 1 người → kết thúc (người còn lại thắng)
    else if (room.state === 'playing' && room.players.size < MIN_PLAYERS) {
        endGame(io, roomId);
    }
}

module.exports = { initGameSocket };
