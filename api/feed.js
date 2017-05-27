require('dotenv').config();
const nba = require('./play_filters/nba');
const mlb = require('./play_filters/mlb');
const nhl = require('./play_filters/nhl');
const axios = require('axios');
const moment = require('moment-timezone');
const api_key = process.env.GOOGLE_API_KEY;
const date_format = 'YYYYMMDD';
const date_time_zone = 'America/New_York';

const BASEBALL = 'MLB';
const BASKETBALL = 'NBA';
const AMERICAN_FOOTBALL = 'NFL';
const HOCKEY = 'NHL';

const config = {
  auth: {
    username: process.env.MY_SPORTS_FEED_USERNAME,
    password: process.env.MY_SPORTS_FEED_PASSWORD
  }
};

function gameSelector(id, json){
  return json.scoreboard.gameScore.find(obj => {
    return obj.game.ID === id;
  });
}

function addCard(game, res){
  console.log(game.league);
  const league = game.league;
  const game_id = game.gameId;
  const game_starting_time = moment(game.time,'hh:mmA');
  const now = moment().tz(date_time_zone);
  if(!game_starting_time.isBefore(now)){
    const date = game.date.replace(/-/g , '');
    const data = {};
    axios.get(`https://www.mysportsfeeds.com/api/feed/pull/${league}/latest/scoreboard.json?fordate=${date}`, config)
    .then(response => {
      const selectedGame = gameSelector(game.gameId, response.data);
      data.id = game.gameId;
      data.league = game.league;
      data.display = 'BASIC';
      data.awayTeam = game.awayTeam;
      data.homeTeam = game.homeTeam;
      data.homeScore = selectedGame.homeScore;
      data.awayScore = selectedGame.awayScore;
      data.date = game.date;
      data.gameStarted = true;
      data.gameCompleted = selectedGame.isCompleted;
      data.displayPlayByPlay = true;
      data.plays = [];

      console.log(`https://www.mysportsfeeds.com/api/feed/pull/${game.league}/latest/game_playbyplay.json?gameid=${game.gameId}`);
      axios.get(`https://www.mysportsfeeds.com/api/feed/pull/${game.league}/latest/game_playbyplay.json?gameid=${game.gameId}`, config)
        .then(response => {
          switch (game.league){
            case BASEBALL:
              data.plays = mlb(response.data);
              break;
            case BASKETBALL:
              data.plays = nba(response.data);
              break;
            case HOCKEY:
              data.plays = nhl(response.data);
              break;
            default:
              break;
          }
          res.json({ response: data });
        })
    }).catch(error => console.log(error));
  } else {
    const data = {
      id: game.gameId,
      league: game.league,
      display: 'BASIC',
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: 0,
      awayScore: 0,
      date: game.date,
      gameStarted: false,
      displayPlayByPlay: false,
      plays: []
    }
    switch(game.league){
      case BASEBALL:
          data.inning = 0;
          break;
        case BASKETBALL:
          data.quarter = 0;
          break;
        case HOCKEY:
          data.period = 0;
          break;
        default:
          break;
    }
    res.json({ response: data });
  }
}

module.exports = addCard;
