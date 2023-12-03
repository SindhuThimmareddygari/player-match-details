const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is Running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertingToCamelCase = (playerObj) => {
  return {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  };
};
const convertMatchDetails = (matchObj) => {
  return {
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  };
};
// API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
  SELECT 
    *
  FROM 
    player_details;`;
  const playerArray = await db.all(getPlayersQuery);
  response.send(
    playerArray.map((eachPlayer) => convertingToCamelCase(eachPlayer))
  );
});
// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
     *
    FROM
       player_details
    WHERE
       player_id=${playerId};`;
  const playerArr = await db.get(getPlayerQuery);
  response.send(convertingToCamelCase(playerArr));
});
// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `UPDATE player_details
  SET 
  
      player_name='${playerName}'
    

  WHERE player_id=${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    *
    FROM
       match_details
    WHERE
       match_id=${matchId};`;
  const MatchArr = await db.get(getMatchQuery);
  response.send(convertMatchDetails(MatchArr));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT
     *
    FROM
       player_match_score  NATURAL JOIN match_details 
    WHERE
       player_id=${playerId};`;

  const MatchArr = await db.all(getMatchQuery);

  response.send(MatchArr.map((eachMatch) => convertMatchDetails(eachMatch)));
});

// API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
        FROM 
        player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;

  const dbResponse = await db.all(getMatchPlayersQuery);
  response.send(dbResponse);
});

//API 7
const convertToMatchScores = (matchScores) => {
  return {
    playerId: matchScores.player_id,
    playerName: matchScores.player_name,
    totalScore: matchScores.score,
    totalFours: matchScores.fours,
    totalSixes: matchScores.sixes,
  };
};
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getQuery = `
        SELECT
          player_id,
          player_name,
         SUM(score) as score,
         SUM(fours) as fours,
         Sum(sixes) as  sixes 
           FROM player_match_score NATURAL JOIN player_details
        WHERE player_id=${playerId};`;

  const playerScores = await db.get(getQuery);
  response.send(convertToMatchScores(playerScores));
});

module.exports = app;
