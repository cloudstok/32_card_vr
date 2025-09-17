import { Server, Socket } from 'socket.io';
import { createLogger } from './logger';
import { BetEvent, BetResult, SingleBetObject, SingleRoomDetail, TopWinner } from '../interfaces';
import { bonuses, multMapper, roomPlayerCount } from '../module/lobbies/lobby-event';
import { variableConfig } from './load-config';
import { read } from './db-connection';
const failedBetLogger = createLogger('failedBets', 'jsonl');
const failedJoinLogger = createLogger('failedJoinRoom', 'jsonl');
const failedExitLogger = createLogger('failedExitRoom', 'jsonl');

export const logEventResponse = (
    req: unknown,
    res: string,
    event: BetEvent
): void => {
    const logData = JSON.stringify({ req, res });
    if (event === 'bet') {
        failedBetLogger.error(logData);
    };
    if (event === 'jnRm') {
        failedJoinLogger.error(logData);
    };
    if (event == 'exRm') {
        failedExitLogger.error(logData);
    };
};

export const eventEmitter = (
    socket: Socket | undefined,
    eventName: string,
    data: any
): void => {
    if (socket) socket.emit('message', { eventName, data });
}

export const getUserIP = (socket: any): string => {
    const forwardedFor = socket.handshake.headers?.['x-forwarded-for'];
    if (forwardedFor) {
        const ip = forwardedFor.split(',')[0].trim();
        if (ip) return ip;
    }
    return socket.handshake.address || '';
};

const mults: { [key: number]: number } = {
    8: 11,
    9: 4.5,
    10: 2.2,
    11: 1
};


export const getBetResult = (btAmt: number, chip: number, result: number | null, roomId: number): BetResult => {

    let mult = 0;
    let status: BetResult["status"] = 'loss';
    let isBonus = false;
    let bonusData = null;

    if (chip == result) {
        if (bonuses[roomId].num == result) {
            mult = multMapper[chip] + 1;
            isBonus = true;
            bonusData = bonuses[roomId];
        }
        else mult = mults[chip] + 1;
        status = 'win'
    };

    const winAmt = btAmt * mult;

    return {
        chip,
        btAmt,
        winAmt,
        mult,
        status,
        isBonus,
        bonusData
    };
};

const roomDetails: SingleRoomDetail[] = [
    {
        roomId: 101,
        chips: [50, 100, 200, 300, 500, 750],
        min: 50,
        max: 1473,
        chip8Max: 80,
        chip9Max: 196,
        chip10Max: 408,
        chip11Max: 869,
        plCnt: 0
    },
    {
        roomId: 102,
        chips: [100, 200, 300, 500, 750, 1000],
        min: 100,
        max: 3683,
        chip8Max: 200,
        chip9Max: 490,
        chip10Max: 1020,
        chip11Max: 2173,
        plCnt: 0
    },
    {
        roomId: 103,
        chips: [500, 750, 1000, 2000, 3000, 5000],
        min: 500,
        max: 14730,
        chip8Max: 800,
        chip9Max: 1960,
        chip10Max: 4081,
        chip11Max: 8695,
        plCnt: 0
    },
    {
        roomId: 104,
        chips: [1000, 2000, 3000, 5000, 7500, 10000],
        min: 1000,
        max: 36840,
        chip8Max: 2000,
        chip9Max: 4901,
        chip10Max: 10200,
        chip11Max: 21730,
        plCnt: 0
    }
];

export const getRooms = () => {
    const roomData = variableConfig.games_templates && variableConfig.games_templates.length > 0 ? variableConfig.games_templates : roomDetails;
    roomData.map(room => {
        room['plCnt'] = roomPlayerCount[room.roomId];
        return room;
    });
    return roomData;
};

export const historyStats = async () => {
    try {
        const historyData = await read(`SELECT room_id, result FROM lobbies ORDER BY created_at DESC LIMIT 400`);
        const filteredData: { [key: number]: number[] } = {};
        historyData.map(e => {
            const { room_id, result } = e;
            if (!filteredData[room_id]) filteredData[room_id] = [result.winner];
            else filteredData[room_id].push(result.winner);
        });
        return filteredData;
    } catch (err) {
        console.error('Error fetching history is:::', err);
        return false
    }
}

export function getNumberPercentages(data: number[]) {
    const count: { [key: number]: number } = {
        8: 0, 9: 0, 10: 0,
        11: 0
    };

    let total = 0;

    for (const num of data) {
        if (num >= 8 && num <= 11) {
            count[num]++;
            total++;
        }
    }

    const percentages: { [key: number]: number } = {};
    for (let i = 8; i <= 11; i++) {
        percentages[i] = total > 0 ? (count[i] / total) * 100 : 0;
    }

    return percentages;
}

export let biggestWinners: TopWinner[] = [{
    userId: 'd***0',
    winAmt: 300.00,
    image: 1
},
{
    userId: 'e***0',
    winAmt: 200.00,
    image: 2
},
{
    userId: 't***0',
    winAmt: 100.00,
    image: 3
}
];

export let highestWinners: TopWinner[] = [{
    userId: 'f***0',
    mult: 0.00,
    winAmt: 300.00,
    image: 4
},
{
    userId: 'g***0',
    mult: 0.00,
    winAmt: 200.00,
    image: 5
},
{
    userId: 'h***0',
    mult: 0.00,
    winAmt: 100.00,
    image: 6
}
];

export function updateWinners(results: SingleBetObject[]) {
    const highWins: TopWinner[] = [];
    const bigWins: TopWinner[] = [];

    results.forEach(e => {
        if (e.winAmount) {
            const winAmt = Number(e.winAmount);
            const mult = e.userBets.reduce((a, b) => a + Number(b.mult), 0);

            highWins.push({ userId: e.user_id, mult, winAmt, image: e.image });
            bigWins.push({ userId: e.user_id, winAmt, image: e.image });
        }
    });

    const sortedHighWin = [...highWins]
        .sort((a, b) => (b.mult ?? 0) - (a.mult ?? 0))
        .slice(0, 3);

    const sortedBigWin = [...bigWins]
        .sort((a, b) => Number(b.winAmt) - Number(a.winAmt))
        .slice(0, 3);

    highestWinners = updateUniversalWinners(highestWinners, sortedHighWin, 'mult');
    biggestWinners = updateUniversalWinners(biggestWinners, sortedBigWin, 'winAmt');
};

function updateUniversalWinners(universalWinners: TopWinner[], newRoundWinners: TopWinner[], key: string) {
    const merged = [...universalWinners, ...newRoundWinners];

    const uniqueMap = new Map();
    for (const winner of merged) {
        if (!uniqueMap.has(winner.userId) || uniqueMap.get(winner.userId)[key] < winner[key]) {
            uniqueMap.set(winner.userId, winner);
        }
    }

    const sorted = Array.from(uniqueMap.values()).sort((a, b) => b[key] - a[key]);

    return sorted.slice(0, 3);
};

export function emitWinnersStats(io: Server) {
    io.emit('message', {
        eventName: 'wnSts', data: {
            highWns: highestWinners.map(e => {
                const highWinsObj = { userId: `${e.userId[0]}***${e.userId.slice(-1)}`, winAmt: e.winAmt, image: e.image };
                return highWinsObj
            }),
            bgWns: biggestWinners.map(e => {
                const bigWinsObj = { userId: `${e.userId[0]}***${e.userId.slice(-1)}`, winAmt: e.winAmt, image: e.image };
                return bigWinsObj;
            })
        }
    });
}