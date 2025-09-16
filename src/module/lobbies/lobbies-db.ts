import { LobbyInsertData } from '../../interfaces';
import { write } from '../../utilities/db-connection';

const SQL_INSERT_LOBBIES = 'INSERT INTO lobbies (lobby_id, room_id, start_delay, end_delay, result, bonus) VALUES (?, ?, ?, ?, ?, ?)';


export const insertLobbies = async (data: LobbyInsertData): Promise<void> => {
    try {
        const { start_delay, lobbyId, roomId, end_delay, result, bonus } = data;
        await write(SQL_INSERT_LOBBIES, [lobbyId, roomId, start_delay, end_delay, JSON.stringify(result), JSON.stringify(bonus)]);
    } catch (err) {
        console.error(err);
    }
};