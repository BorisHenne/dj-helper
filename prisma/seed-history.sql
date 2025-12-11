-- Création de la table DJHistory si elle n'existe pas
CREATE TABLE IF NOT EXISTS DJHistory (
    id TEXT PRIMARY KEY,
    djName TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    youtubeUrl TEXT NOT NULL,
    playedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des données historiques
-- Septembre 2025
INSERT OR IGNORE INTO DJHistory (id, djName, title, artist, youtubeUrl, playedAt, createdAt, updatedAt)
VALUES
('ch01_2025-09-16', 'T. Rhyman', 'How It Feels', 'Silky Roads', 'https://www.youtube.com/results?search_query=Silky+Roads+How+It+Feels', '2025-09-16 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch02_2025-09-17', 'H. Faria', 'Unstoppable', 'The Score', 'https://www.youtube.com/results?search_query=The+Score+Unstoppable', '2025-09-17 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch03_2025-09-18', 'V. Ordinario', 'My Own Worst Enemy', 'Lit', 'https://www.youtube.com/results?search_query=Lit+My+Own+Worst+Enemy', '2025-09-18 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch04_2025-09-19', 'G. Luchmun', 'Duality', 'Slipknot', 'https://www.youtube.com/results?search_query=Slipknot+Duality', '2025-09-19 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch05_2025-09-25', 'N. Whewell', 'Foxy Lady', 'Jimmy Hendrix', 'https://www.youtube.com/results?search_query=Jimmy+Hendrix+Foxy+Lady', '2025-09-25 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch06_2025-09-26', 'T. Maurel', 'Petit Pudding, avec le Parasukov Quartet', 'Bleu Jeans Bleu', 'https://www.youtube.com/results?search_query=Bleu+Jeans+Bleu+Petit+Pudding', '2025-09-26 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch07_2025-09-29', 'M.Ladit', 'You can never tell', 'Chuck berry', 'https://www.youtube.com/results?search_query=Chuck+berry+You+can+never+tell', '2025-09-29 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch08_2025-09-30', 'A. Gautier', 'Jekyll and Hyde', 'Five Finger Death Punch', 'https://www.youtube.com/results?search_query=Five+Finger+Death+Punch+Jekyll+and+Hyde', '2025-09-30 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Octobre 2025
('ch09_2025-10-01', 'B. Henne', 'Bach Onto This', 'Jon Lord', 'https://www.youtube.com/results?search_query=Jon+Lord+Bach+Onto+This', '2025-10-01 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch10_2025-10-02', 'I. Digumber', 'I like to move it', 'King Julian', 'https://www.youtube.com/results?search_query=King+Julian+I+like+to+move+it', '2025-10-02 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch11_2025-10-03', 'C. Hubert', 'Whatcha See Is Whatcha Get', 'The Dramatics', 'https://www.youtube.com/results?search_query=The+Dramatics+Whatcha+See+Is+Whatcha+Get', '2025-10-03 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch12_2025-10-06', 'T. Rhyman', 'Cigarettes After Sex', '(510) Apocalypse', 'https://www.youtube.com/results?search_query=Cigarettes+After+Sex', '2025-10-06 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch13_2025-10-07', 'O. Ngabi', 'One Piece', 'x', 'https://www.youtube.com/results?search_query=One+Piece+OST', '2025-10-07 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch14_2025-10-08', 'T. Maurel', 'Fight for Your Right', 'Beastie Boys', 'https://www.youtube.com/results?search_query=Beastie+Boys+Fight+for+Your+Right', '2025-10-08 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch15_2025-10-09', 'S. Mooken', 'Hold the Line', 'Toto', 'https://www.youtube.com/results?search_query=Toto+Hold+the+Line', '2025-10-09 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch16_2025-10-10', 'V. Ordinario', 'Torn', 'Ednaswap', 'https://www.youtube.com/results?search_query=Ednaswap+Torn', '2025-10-10 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch17_2025-10-13', 'V. Ordinario', 'Angel', 'Shaggy', 'https://www.youtube.com/results?search_query=Shaggy+Angel', '2025-10-13 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch18_2025-10-14', 'N. Whewell', 'Hard To Handle', 'Otis Redding', 'https://www.youtube.com/results?search_query=Otis+Redding+Hard+To+Handle', '2025-10-14 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch19_2025-10-15', 'B. Henne', 'Swordland', 'Sword Art Online', 'https://www.youtube.com/results?search_query=Sword+Art+Online+Swordland', '2025-10-15 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch20_2025-10-16', 'O. Ngabi', 'soso', 'Omah Lay', 'https://www.youtube.com/results?search_query=Omah+Lay+soso', '2025-10-16 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch21_2025-10-17', 'V. Ordinario', 'How''s It Going To Be', 'Third Eye Blind', 'https://www.youtube.com/results?search_query=Third+Eye+Blind+How+It+Going+To+Be', '2025-10-17 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch22_2025-10-20', 'M.Ladit', 'The Concert Central Park', 'Simon and Garfunke', 'https://www.youtube.com/results?search_query=Simon+and+Garfunkel+Concert+Central+Park', '2025-10-20 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch23_2025-10-21', 'S. Mooken', 'Music Sounds Better With You', 'Stardust', 'https://www.youtube.com/results?search_query=Stardust+Music+Sounds+Better+With+You', '2025-10-21 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch24_2025-10-22', 'G. Luchmun', 'Hero', 'skillet', 'https://www.youtube.com/results?search_query=Skillet+Hero', '2025-10-22 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch25_2025-10-27', 'T. Rhyman', 'Dreaming', 'Smallpool', 'https://www.youtube.com/results?search_query=Smallpools+Dreaming', '2025-10-27 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch26_2025-10-28', 'T. Marrot', 'Naturträne', 'Nina Hagen Band', 'https://www.youtube.com/results?search_query=Nina+Hagen+Band+Naturtr%C3%A4ne', '2025-10-28 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch27_2025-10-29', 'K. Tang Sak Yuk', 'Fever', 'Peggy Lee', 'https://www.youtube.com/results?search_query=Peggy+Lee+Fever', '2025-10-29 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch28_2025-10-30', 'G. Luchmun', 'MONSTERS', 'Shinedown', 'https://www.youtube.com/results?search_query=Shinedown+MONSTERS', '2025-10-30 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch29_2025-10-31', 'O. Ngabi', 'Mundian To Bach Ke (Beware Of The Boys)', 'anjabi MC', 'https://www.youtube.com/results?search_query=Panjabi+MC+Mundian+To+Bach+Ke', '2025-10-31 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Novembre 2025
('ch30_2025-11-03', 'H. Faria', 'Young Hearts', 'Strange Talk', 'https://www.youtube.com/results?search_query=Strange+Talk+Young+Hearts', '2025-11-03 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch31_2025-11-04', 'A. Gautier', 'Voices in my head', 'Falling in reverse', 'https://www.youtube.com/results?search_query=Falling+in+Reverse+Voices+in+my+head', '2025-11-04 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch32_2025-11-05', 'N. Whewell', 'Money', 'Pink Floyd', 'https://www.youtube.com/results?search_query=Pink+Floyd+Money', '2025-11-05 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch33_2025-11-06', 'G. Luchmun', 'Animals', 'Architects', 'https://www.youtube.com/results?search_query=Architects+Animals', '2025-11-06 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch34_2025-11-07', 'C. Hubert', 'Come To Me 1979', 'France Joli', 'https://www.youtube.com/results?search_query=France+Joli+Come+To+Me', '2025-11-07 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch35_2025-11-10', 'B. Henne', 'The Fight Song', 'Marilyn Manson', 'https://www.youtube.com/results?search_query=Marilyn+Manson+The+Fight+Song', '2025-11-10 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch36_2025-11-12', 'S. Mooken', 'Faint', 'Linkin Park', 'https://www.youtube.com/results?search_query=Linkin+Park+Faint', '2025-11-12 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch37_2025-11-13', 'T. Marrot', 'Gusty Garden (theme from Super Mario Galaxy)', 'Mahito Yokota', 'https://www.youtube.com/results?search_query=Mahito+Yokota+Gusty+Garden+Super+Mario+Galaxy', '2025-11-13 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch38_2025-11-14', 'V. Ordinario', 'The Lion Sleeps Tonight (Wimoweh)', 'The Tokens', 'https://www.youtube.com/results?search_query=The+Tokens+The+Lion+Sleeps+Tonight', '2025-11-14 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch39_2025-11-17', 'A. Cenita', 'Evanescence', 'Lithium', 'https://www.youtube.com/results?search_query=Evanescence+Lithium', '2025-11-17 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch40_2025-11-18', 'T. Rhyman', 'Sweater Weather', 'The Neighbourhood', 'https://www.youtube.com/results?search_query=The+Neighbourhood+Sweater+Weather', '2025-11-18 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch41_2025-11-19', 'H. Faria', 'the man who can''t be moved', 'The Script', 'https://www.youtube.com/results?search_query=The+Script+the+man+who+cant+be+moved', '2025-11-19 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch42_2025-11-20', 'B. Henne', 'Echoes by Vkgoeswild', 'Pink floyd', 'https://www.youtube.com/results?search_query=Pink+Floyd+Echoes+Vkgoeswild', '2025-11-20 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch43_2025-11-21', 'K. Tang Sak Yuk', 'Ohne Dich', 'Rammstein', 'https://www.youtube.com/results?search_query=Rammstein+Ohne+Dich', '2025-11-21 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch44_2025-11-24', 'N. Whewell', 'Steppin'' Out', 'Joe JACKSON', 'https://www.youtube.com/results?search_query=Joe+Jackson+Steppin+Out', '2025-11-24 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch45_2025-11-25', 'V. Tomasso', 'Moose The Mooche', 'Charlie Parker', 'https://www.youtube.com/results?search_query=Charlie+Parker+Moose+The+Mooche', '2025-11-25 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch46_2025-11-26', 'A. Cenita', 'Yoko Shimomura (Final Fantasy 15)', 'Somnus', 'https://www.youtube.com/results?search_query=Somnus+Yoko+Shimomura+Final+Fantasy+15', '2025-11-26 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch47_2025-11-27', 'T. Maurel', 'Popular', 'Nada Surf', 'https://www.youtube.com/results?search_query=Nada+Surf+Popular', '2025-11-27 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch48_2025-11-28', 'N. Whewell', 'Love Like Blood', 'Killing Joke', 'https://www.youtube.com/results?search_query=Killing+Joke+Love+Like+Blood', '2025-11-28 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Décembre 2025
('ch49_2025-12-01', 'B. Henne', 'Feeling Good (Official Video)', 'Nina Simone', 'https://www.youtube.com/results?search_query=Nina+Simone+Feeling+Good', '2025-12-01 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch50_2025-12-02', 'S. Mooken', 'Wind Of Change (Official Music Video)', 'Scorpions', 'https://www.youtube.com/results?search_query=Scorpions+Wind+Of+Change', '2025-12-02 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch51_2025-12-03', 'V. Ordinario', 'Wonderwall', 'Oasis', 'https://www.youtube.com/results?search_query=Oasis+Wonderwall', '2025-12-03 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch52_2025-12-04', 'G. Luchmun', 'Un monde sans danger', 'Julien Lamassonne', 'https://www.youtube.com/results?search_query=Julien+Lamassonne+Un+monde+sans+danger', '2025-12-04 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch53_2025-12-05', 'V. Ordinario', 'Wellerman (Sea Shanty)', 'Nathan Evans', 'https://www.youtube.com/results?search_query=Nathan+Evans+Wellerman+Sea+Shanty', '2025-12-05 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch54_2025-12-08', 'A. Gautier', 'Homeless', 'Marina Kaye', 'https://www.youtube.com/results?search_query=Marina+Kaye+Homeless', '2025-12-08 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch55_2025-12-09', 'T. Rhyman', 'Матушка Земля, белая берёзонька', 'Татьяна Куртукова', 'https://www.youtube.com/results?search_query=%D0%A2%D0%B0%D1%82%D1%8C%D1%8F%D0%BD%D0%B0+%D0%9A%D1%83%D1%80%D1%82%D1%83%D0%BA%D0%BE%D0%B2%D0%B0', '2025-12-09 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch56_2025-12-10', 'V. Ordinario', 'Youth of the Nation', 'P.O.D', 'https://www.youtube.com/results?search_query=P.O.D+Youth+of+the+Nation', '2025-12-10 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ch57_2025-12-11', 'K. Tang Sak Yuk', 'Oceans', 'André Cavalcante', 'https://www.youtube.com/results?search_query=Andr%C3%A9+Cavalcante+Oceans', '2025-12-11 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Afficher le nombre d'entrées
SELECT 'Total entries in DJHistory: ' || COUNT(*) FROM DJHistory;
