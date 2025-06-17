// helper/socket.function.js

const gameList = {
    "hot": "HeadOrTail",
    "dice": "Dice",
    "rps": "RockPaperScissors",
    "wolf": "Werewolf",
    "lowcard": "LowCard", // Added Low Card game
}

// Import game modules
const headOrTailGame = require('../utils/game/hot');
const diceGame = require('../utils/game/dice');
const rockPaperScissorsGame = require('../utils/game/rps');
const werewolfGame = require('../utils/game/werewolf');
const lowCardGame = require('../utils/game/lowcard');

// A mapping for game functions
const gameHandlers = {
    "hot": {
        startGame: headOrTailGame.startGame,
        handleJoin: headOrTailGame.handleJoin,
        handleChoice: headOrTailGame.handleChoice,
    },
    "dice": {
        startGame: diceGame.startGame,
        handleJoin: diceGame.handleJoin,
        handleRoll: diceGame.handleRoll,
        handleStop: diceGame.handleStop,
    },
    "rps": {
        startGame: rockPaperScissorsGame.startGame,
        handleJoin: rockPaperScissorsGame.handleJoin,
        handleMove: rockPaperScissorsGame.handleMove,
        handleStop: rockPaperScissorsGame.handleStop,
    },
    "wolf": {
        startGame: werewolfGame.startGame,
        handleJoin: werewolfGame.handleJoin,
        handleCancelCharge: werewolfGame.handleCancelCharge, // For !no
        handleVote: werewolfGame.handleVote, // For !v
        handleKill: werewolfGame.handleKill, // For !k
        handleSeerInvestigate: werewolfGame.handleSeerInvestigate, // For !s
        handleAlivePlayers: werewolfGame.handleAlivePlayers, // For !a
        handleShowRole: werewolfGame.handleShowRole, // For !r
        handleStop: werewolfGame.handleStop,
    },
    "lowcard": { // Add Low Card game handlers
        startGame: lowCardGame.startGame,
        handleJoin: lowCardGame.handleJoin,
        handleDraw: lowCardGame.handleDraw, // For !d
        handleStop: lowCardGame.handleStop,
    }
};

/**
 * Handles incoming chat commands from users.
 * This function dispatches commands to the appropriate game module or handles general commands.
 * @param {object} data - The message data including user and content.
 * @param {Socket} socket - The socket instance of the user.
 * @param {Server} io - The Socket.IO server instance.
 * @param {object} activeGames - An object storing the state of active games in different rooms.
 */
function handleCommand(data, socket, io, activeGames) {
    const [command, ...args] = data.content.trim().split(" ");
    const room = data.user.room;
    const username = data.user.username;

    switch (command) {
        case "/bot": {
            const botCommand = args[0]; // e.g., "dice", "stop", "rps", "wolf", "lowcard"
            const gameKey = botCommand; // For starting a game, gameKey is the botCommand

            if (gameKey === "stop") {
                const game = activeGames[room];
                if (game) {
                    const gameHandler = gameHandlers[game.typeKey];
                    if (gameHandler && gameHandler.handleStop) {
                        gameHandler.handleStop(room, io, activeGames);
                    } else {
                        // Default stop behavior if no specific handler
                        io.to(room).emit("message:receive", {
                            type: "command",
                            user: "BOT",
                            content: `🛑 Game in this room has been stopped.`
                        });
                        delete activeGames[room];
                    }
                } else {
                    socket.emit("message:receive", { type: "command", user: "System", content: `No active game in this room to stop.` });
                }
                return; // Handled /bot stop
            }

            const gameHandler = gameHandlers[gameKey];

            if (!gameHandler) {
                socket.emit("message:receive", { type: "command", user: "System", content: `Unknown game: ${gameKey}` });
                return;
            }
            if (activeGames[room]) {
                socket.emit("message:receive", { type: "command", user: "System", content: `Game already running in this room.` });
                return;
            }

            // Call the specific game's start function, passing the gameKey and initiator info
            gameHandler.startGame(room, activeGames, io, gameKey, username, socket.id, null); // customCharge is null for free games or handled by !start
            break;
        }

        case "!start": { // For Dice game, !start is used to join with a custom amount; for Werewolf/LowCard, it's just to start (no charges)
            const game = activeGames[room];
            if (!game) {
                socket.emit("message:receive", { type: "command", user: "System", content: `No active game to start or join with !start.` });
                return;
            }

            if (game.typeKey === "dice") {
                const customCharge = parseFloat(args[0]);
                if (isNaN(customCharge) || customCharge <= 0) {
                    socket.emit("message:receive", { type: "command", user: "System", content: `Usage: !start <amount> (e.g., !start 0.06)` });
                    return;
                }
                const gameHandler = gameHandlers[game.typeKey];
                if (gameHandler && gameHandler.handleJoin) { // Dice uses handleJoin for !start command
                    gameHandler.handleJoin(game, username, socket.id, io, customCharge);
                } else {
                    socket.emit("message:receive", { type: "command", user: "System", content: `This game does not support custom start amounts.` });
                }
            } else if (game.typeKey === "wolf" || game.typeKey === "lowcard") {
                // For Werewolf and LowCard, !start is mentioned for optional custom amount, but we're making it free.
                // This command will simply acknowledge the user's intent to start/join with a conceptual amount.
                const customCharge = parseFloat(args[0]);
                if (isNaN(customCharge) || customCharge <= 0) {
                     socket.emit("message:receive", { type: "command", user: "BOT", content: `!start command used. No charge applied (free game).` });
                } else {
                    socket.emit("message:receive", { type: "command", user: "BOT", content: `!start with $${customCharge.toFixed(2)} noted. No actual charge applied (free game).` });
                }
            }
            else {
                 socket.emit("message:receive", { type: "command", user: "System", content: `!start command is not supported for the current game type or phase.` });
            }
            break;
        }

        case "!no": { // Command to cancel charge (primarily for Werewolf, conceptual for free games)
            const game = activeGames[room];
            if (!game) {
                socket.emit("message:receive", { type: "command", user: "System", content: `No active game to cancel charge for.` });
                return;
            }
            const gameHandler = gameHandlers[game.typeKey];
            if (gameHandler && gameHandler.handleCancelCharge) {
                gameHandler.handleCancelCharge(game, username, socket);
            } else {
                socket.emit("message:receive", { type: "command", user: "System", content: `This game does not support charge cancellation.` });
            }
            break;
        }

        case "!j": {
            const game = activeGames[room];
            if (!game) {
                socket.emit("message:receive", { type: "command", user: "System", content: `No game is active in this room to join.` });
                return;
            }

            const gameHandlerKey = game.typeKey;
            console.log(`[DEBUG !j] Attempting to join game with typeKey: ${gameHandlerKey}`);
            const gameHandler = gameHandlers[gameHandlerKey];
            console.log(`[DEBUG !j] Retrieved gameHandler:`, gameHandler ? 'Found' : 'Not Found');

            if (gameHandler && gameHandler.handleJoin) {
                gameHandler.handleJoin(game, username, socket.id, io, null); // No custom charge on !j
            } else {
                socket.emit("message:receive", { type: "command", user: "System", content: `Cannot join this game type.` });
            }
            break;
        }

        case "!v": { // Werewolf vote command
            const game = activeGames[room];
            if (!game || game.typeKey !== "wolf") {
                socket.emit("message:receive", { type: "command", user: "System", content: `!v command is only for the Werewolf game.` });
                return;
            }
            const targetUsername = args[0];
            if (!targetUsername) {
                socket.emit("message:receive", { type: "command", user: "System", content: `Usage: !v <username>` });
                return;
            }
            const gameHandler = gameHandlers[game.typeKey];
            if (gameHandler && typeof gameHandler.handleVote === 'function') {
                gameHandler.handleVote(game, username, targetUsername, socket, io);
            } else {
                socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for !v.` });
            }
            break;
        }

        case "!k": { // Werewolf kill command
            const game = activeGames[room];
            if (!game || game.typeKey !== "wolf") {
                socket.emit("message:receive", { type: "command", user: "System", content: `!k command is only for the Werewolf game.` });
                return;
            }
            const targetUsername = args[0];
            if (!targetUsername) {
                socket.emit("message:receive", { type: "command", user: "System", content: `Usage: !k <username>` });
                return;
            }
            const gameHandler = gameHandlers[game.typeKey];
            if (gameHandler && typeof gameHandler.handleKill === 'function') {
                gameHandler.handleKill(game, username, targetUsername, socket, io);
            } else {
                socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for !k.` });
            }
            break;
        }

        case "!s": { // Werewolf seer investigate command
            const game = activeGames[room];
            if (!game || game.typeKey !== "wolf") {
                socket.emit("message:receive", { type: "command", user: "System", content: `!s command is only for the Werewolf game.` });
                return;
            }
            const targetUsername = args[0];
            if (!targetUsername) {
                socket.emit("message:receive", { type: "command", user: "System", content: `Usage: !s <username>` });
                return;
            }
            const gameHandler = gameHandlers[game.typeKey];
            if (gameHandler && typeof gameHandler.handleSeerInvestigate === 'function') {
                gameHandler.handleSeerInvestigate(game, username, targetUsername, socket, io);
            } else {
                socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for !s.` });
            }
            break;
        }

        case "!a": { // Werewolf alive players command
            const game = activeGames[room];
            if (!game || game.typeKey !== "wolf") {
                socket.emit("message:receive", { type: "command", user: "System", content: `!a command is only for the Werewolf game.` });
                return;
            }
            const gameHandler = gameHandlers[game.typeKey];
            if (gameHandler && typeof gameHandler.handleAlivePlayers === 'function') {
                gameHandler.handleAlivePlayers(game, socket);
            } else {
                socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for !a.` });
            }
            break;
        }

        case "!d": { // Low Card draw command
            const game = activeGames[room];
            if (!game || game.typeKey !== "lowcard") {
                socket.emit("message:receive", { type: "command", user: "System", content: `!d command is only for the Low Card game.` });
                return;
            }
            const gameHandler = gameHandlers[game.typeKey];
            if (gameHandler && typeof gameHandler.handleDraw === 'function') {
                gameHandler.handleDraw(game, username, socket, io, activeGames);
            } else {
                console.error(`[ERROR !d (LowCard)] handleDraw not found or not a function for game type: ${game.typeKey}. GameHandler:`, gameHandler);
                socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for !d in Low Card.` });
            }
            break;
        }

        case "!r": { // Dice roll command OR Werewolf show role command OR RPS Rock
            const game = activeGames[room];
            if (!game) {
                socket.emit("message:receive", { type: "command", user: "System", content: `No active game to use !r command.` });
                return;
            }

            const gameHandler = gameHandlers[game.typeKey];

            if (game.typeKey === "dice") {
                if (gameHandler && typeof gameHandler.handleRoll === 'function') {
                    gameHandler.handleRoll(game, username, socket, io, activeGames);
                } else {
                    console.error(`[ERROR !r (Dice)] handleRoll not found or not a function for game type: ${game.typeKey}. GameHandler:`, gameHandler);
                    socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for !r in Dice.` });
                }
            } else if (game.typeKey === "rps") {
                // RPS uses !r for Rock (command.slice(1) would be 'r')
                if (gameHandler && typeof gameHandler.handleMove === 'function') {
                    gameHandler.handleMove(game, username, command.slice(1), socket, io, activeGames);
                } else {
                    console.error(`[ERROR !r (RPS)] handleMove not found or not a function for game type: ${game.typeKey}. GameHandler:`, gameHandler);
                    socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for RPS move.` });
                }
            } else if (game.typeKey === "wolf") {
                 if (gameHandler && typeof gameHandler.handleShowRole === 'function') {
                    gameHandler.handleShowRole(game, username, socket);
                } else {
                    console.error(`[ERROR !r (Werewolf)] handleShowRole not found or not a function for game type: ${game.typeKey}. GameHandler:`, gameHandler);
                    socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for !r in Werewolf.` });
                }
            }
            else {
                socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command for the current game.` });
            }
            break;
        }

        case "!p": // RPS Paper command
        case "!s": { // RPS Scissors command
            const game = activeGames[room];
            if (!game || game.typeKey !== "rps") {
                socket.emit("message:receive", { type: "command", user: "System", content: `!p or !s commands are only for the Rock Paper Scissors game.` });
                return;
            }
            const gameHandler = gameHandlers[game.typeKey];
            if (gameHandler && typeof gameHandler.handleMove === 'function') {
                gameHandler.handleMove(game, username, command.slice(1), socket, io, activeGames);
            } else {
                console.error(`[ERROR !p/!s (RPS)] handleMove not found or not a function for game type: ${game.typeKey}. GameHandler:`, gameHandler);
                socket.emit("message:receive", { type: "command", user: "System", content: `Invalid command or game state for RPS move.` });
            }
            break;
        }

        /* Other general chat commands */
        case "/gift": {
            console.log(args)
            break;
        }
        case "/me":
            io.to(room).emit("message:receive", { type: "command", user: data.user.username, content: `${data.user.username} ${args.join(" ")}` });
            break;
        case "/sing":
            io.to(room).emit("message:receive", { type: "command", user: data.user.username, content: `${data.user.username} is singing a song!` });
            break;
        case "/brb":
            io.to(room).emit("message:receive", { type: "command", user: data.user.username, content: `${data.user.username} will be right back!` });
            break;

        default:
            socket.emit("message:receive", {
                type: "command",
                user: "System",
                content: `Unknown command: ${command}`
            });
    }
}

module.exports = {
    handleCommand
}
