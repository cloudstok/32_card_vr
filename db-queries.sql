ALTER TABLE `bets` ADD INDEX `inx_bet_id` (`bet_id` ASC) INVISIBLE, ADD INDEX `inx_lobby_id` (`lobby_id` ASC) INVISIBLE, ADD INDEX `inx_user_id` (`user_id` ASC) INVISIBLE, ADD INDEX `inx_operator_id` (`operator_id` ASC) VISIBLE, ADD INDEX `inx_bet_amount` (`bet_amount` ASC) INVISIBLE, ADD INDEX `inx_chip` (`chip` ASC) INVISIBLE, ADD INDEX `inx_room_id` (`room_id` ASC) VISIBLE, ADD INDEX `inx_created_at` (`created_at` ASC) VISIBLE;
ALTER TABLE `settlement` ADD INDEX `inx_bet_id` (`bet_id` ASC) VISIBLE, ADD INDEX `inx_lobby_id` (`lobby_id` ASC) VISIBLE, ADD INDEX `inx_user_id` (`user_id` ASC) INVISIBLE, ADD INDEX `inx_operator_id` (`operator_id` ASC) VISIBLE, ADD INDEX `inx_bet_amount` (`bet_amount` ASC) INVISIBLE, ADD INDEX `inx_chip` (`chip` ASC) INVISIBLE, ADD INDEX `inx_room_id` (`room_id` ASC) INVISIBLE, ADD INDEX `inx_max_mult` (`max_mult` ASC) INVISIBLE, ADD INDEX `inx_win_amount` (`win_amount` ASC) INVISIBLE, ADD INDEX `inx_created_at` (`created_at` ASC) VISIBLE;
ALTER TABLE `lobbies` ADD INDEX `inx_lobby_id` (`lobby_id` ASC) INVISIBLE, ADD INDEX `inx_created_at` (`created_at` ASC) VISIBLE;
CREATE INDEX inx_room_id ON lobbies (room_id);

INSERT INTO game_templates (data) VALUES 
('{"roomId":101,"chips":[50,100,200,300,500,750],"min":50,"max":1473,"plCnt":0}'),
('{"roomId":102,"chips":[100,200,300,500,750,1000],"min":100,"max":3683,"plCnt":0}'),
('{"roomId":103,"chips":[500,750,1000,2000,3000,5000],"min":500,"max":14730,"plCnt":0}'),
('{"roomId":104,"chips":[1000,2000,3000,5000,7500,10000],"min":1000,"max":36840,"plCnt":0}');
