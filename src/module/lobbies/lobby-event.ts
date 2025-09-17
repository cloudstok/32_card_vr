import { Server as IOServer } from 'socket.io';
import { insertLobbies } from './lobbies-db';
import { createLogger } from '../../utilities/logger';
import { Bonus, GameResult, LobbyData, LobbyStatusData } from '../../interfaces';
import { setCurrentLobby, settleBet } from '../bets/bets-session';
import { emitWinnersStats, getNumberPercentages, historyStats } from '../../utilities/helper-function';
import { play32CardRound } from '../game/game-logic';

const logger = createLogger('32_Card_Game_2D', 'jsonl');

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const roomPlayerCount: { [key: number]: number } = {
    101: 0,
    102: 0,
    103: 0,
    104: 0
};

export const roomWiseHistory: {
    [key: number]: number[]
} = {
    101: [],
    102: [],
    103: [],
    104: []
};

export const roomResultProbs: { [key: number]: { [key: number]: number } } = {
    101: { 8: 0, 9: 0, 10: 0, 11: 0 },
    102: { 8: 0, 9: 0, 10: 0, 11: 0 },
    103: { 8: 0, 9: 0, 10: 0, 11: 0 },
    104: { 8: 0, 9: 0, 10: 0, 11: 0 }
};

export const bonuses: { [key: number]: Bonus } = {
    101: { num: 0, mult: 0 },
    102: { num: 0, mult: 0 },
    103: { num: 0, mult: 0 },
    104: { num: 0, mult: 0 }
};

export const multMapper: { [key: number]: number } = {
    8: 14,
    9: 5.7,
    10: 2.7,
    11: 1.3
}

function updateBonus() {
    for (let bonus in bonuses) {
        const bonusSlot = Math.floor(Math.random() * (11 - 8 + 1)) + 8;
        bonuses[bonus] = { num: bonusSlot, mult: multMapper[bonusSlot] };
    }
};

function resetBonus() {
    for (let bonus in bonuses) {
        bonuses[bonus] = { num: 0, mult: 0 };
    }
}

function updateProbs() {
    for (let room in roomResultProbs) {
        roomResultProbs[room] = getNumberPercentages(roomWiseHistory[room]);
    }
}

async function generateStats() {
    const historyDataFromDB: { [key: string]: number[] } | false = await historyStats();
    if (!historyDataFromDB || Object.keys(historyDataFromDB).length == 0) return;
    for (let room in roomWiseHistory) {
        roomWiseHistory[Number(room)] = historyDataFromDB[room];
    };
}

export const initGame = async (io: IOServer): Promise<void> => {
    logger.info("lobby started");
    await generateStats();
    const delays: number[] = [101, 102, 103, 104];
    delays.forEach((roomId: number) => {
        roomPlayerCount[roomId] = Math.floor(Math.random() * 31) + 30;
        initLobby(io, roomId);
    });
};

const initLobby = async (io: IOServer, roomId: number): Promise<void> => {

    const lobbyId: string = `${Date.now()}-${roomId}`;
    let recurLobbyData: LobbyStatusData = { lobbyId, status: 0 };

    setCurrentLobby(roomId, recurLobbyData);
    let start_delay = 15;
    const mid_delay = 6;
    const result: GameResult = play32CardRound();
    const end_delay = 5;

    for (let x = start_delay; x > 0; x--) {
        io.to(`${roomId}`).emit('message', { eventName: "card", data: { message: `${lobbyId}:${x}:STARTING` } });
        await sleep(1000);
    }

    recurLobbyData.status = 1;
    setCurrentLobby(roomId, recurLobbyData);
    updateBonus();

    for (let y = 1; y <= mid_delay; y++) {
        io.to(`${roomId}`).emit('message', { eventName: 'card', data: { message: `${lobbyId}:${y}:CALCULATING` } })
        await sleep(1000);
    }

    recurLobbyData.status = 2;
    setCurrentLobby(roomId, recurLobbyData);

    const bonus = bonuses[roomId];
    io.to(`${roomId}`).emit('message', { eventName: 'bnDtl', data: bonus });
    await sleep(1000);

    // const dynamicData: GameResult = {
    //     cards: { 8: [], 9: [], 10: [], 11: [] },
    //     roundWisePoints: { 8: [0], 9: [0], 10: [0], 11: [0] },
    //     winner: null
    // }

    // const playerIds = Object.keys(result.cards);
    // const maxRounds = Math.max(...Object.values(result.cards).map(cards => cards.length));
    // let actions = [];

    // for (let i = 0; i < maxRounds; i++) {
    //     for (let playerId of playerIds) {
    //         const card = result.cards[playerId][i];
    //         const point = result.roundWisePoints[playerId][i];
    //         if (card !== undefined) {
    //             actions.push(async () => {
    //                 dynamicData.cards[playerId].push(card);
    //                 io.to(`${roomId}`).emit('message', { eventName: 'card', data: { message: `${lobbyId}:${JSON.stringify(dynamicData)}:RESULT` } });
    //                 dynamicData.roundWisePoints[playerId][0] += point;
    //                 await sleep(1000);
    //                 io.to(`${roomId}`).emit('message', { eventName: 'card', data: { message: `${lobbyId}:${JSON.stringify(dynamicData)}:RESULT` } });
    //             });
    //         }
    //     }
    // };

    // const runActionsSequentially = async () => {
    //     for (let index = 0; index < actions.length; index++) {
    //         const action = actions[index];
    //         action();
    //         await sleep(2000);

    //         if (index === actions.length - 1) {
    //             dynamicData.winner = result.winner;
    //             io.to(`${roomId}`).emit('message', { eventName: 'card', data: { message: `${lobbyId}:${JSON.stringify(dynamicData)}:RESULT` } });
    //         }
    //     }
    // };

    // await runActionsSequentially();
    const resultCardsLen = Object.values(result.cards).flat().length;
    const timer = (3.7 * resultCardsLen) + 2;

    for (let w = 1; w <= timer; w++) {
        io.to(`${roomId}`).emit('message', { eventName: "cards", data: { message: `${lobbyId}:${w}-${timer}:${JSON.stringify(result)}:RESULT` } });
        await sleep(1000);
    }

    await settleBet(io, result, roomId);

    recurLobbyData.status = 3;
    setCurrentLobby(roomId, recurLobbyData);
    emitWinnersStats(io);

    for (let z = 1; z <= end_delay; z++) {
        io.to(`${roomId}`).emit('message', { eventName: "cards", data: { message: `${lobbyId}:${z}:ENDED` } });
        await sleep(1000);
    }

    const history: LobbyData = {
        time: new Date(),
        lobbyId,
        roomId,
        start_delay,
        end_delay,
        result
    };

    if (roomWiseHistory[roomId].length == 100) {
        roomWiseHistory[roomId].pop();
    };

    if (result.winner) roomWiseHistory[roomId].unshift(result.winner);
    updateProbs();
    resetBonus();

    io.to(`${roomId}`).emit('message', { eventName: "history", data: { lobbyId, result: result.winner, roomId, resultProbs: roomResultProbs[roomId] } });
    logger.info(JSON.stringify({ ...history, bonus }));
    await insertLobbies({ ...history, bonus });
    return initLobby(io, roomId);
};