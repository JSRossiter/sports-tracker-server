require('dotenv').config();
const nba = require('./play_filters/nba');
const mlb = require('./play_filters/mlb');
const nhl = require('./play_filters/nhl');
const axios = require('axios');
const moment = require('moment-timezone');
const api_key = process.env.GOOGLE_API_KEY;
const date_format = 'YYYYMMDD';
const date_time_zone = 'America/Los_Angeles';

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
  const league = game.league;
  const game_id = game.gameId;
  const game_starting_time = moment.tz(`${game.date} ${game.time}`,'YYYY-MM-DD hh:mmA', date_time_zone);
  const now = moment().tz(date_time_zone);
  if(game_starting_time.diff(now) < 0){
    const date = game.date.replace(/-/g , '');
    const data = {};
    axios.get(`https://www.mysportsfeeds.com/api/feed/pull/${league}/latest/scoreboard.json?fordate=${date}`, config)
    .then(response => {
      const selectedGame = gameSelector(game.gameId, response.data);
      data.gameId = game.gameId;
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
      axios.get(`https://www.mysportsfeeds.com/api/feed/pull/${game.league}/latest/game_playbyplay.json?gameid=${game.gameId}`, config)
        .then(response => {
          switch (game.league){
            case BASEBALL:
              data.plays = mlb(response.data);
              data.currentInning = selectedGame.currentInning;
              data.currentInningHalf = selectedGame.currentInningHalf;
              data.innings = selectedGame.inningSummary.inning;
              break;
            case BASKETBALL:
              data.plays = nba(response.data);
              data.quarter = selectedGame.quarterSummary.quarter[selectedGame.quarterSummary.quarter.length - 1]['@number'];
              data.timeRemaining = selectedGame.timeRemaining;
              break;
            case HOCKEY:
              data.plays = nhl(response.data);
              console.log(data.plays);
              data.period = selectedGame.periodSummary.period[selectedGame.periodSummary.period.length - 1]['@number'];
              data.timeRemaining = selectedGame.timeRemaining;
              data.periods = selectedGame.periodSummary.period;
              break;
            default:
              break;
          }
          res.json({ response: data });
        })
    }).catch(error => console.log(error));
  } else {
    const data = {
      gameId: game.gameId,
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
          data.currentInning = 0;
          data.currentInningHalf = '';
          data.innings = [];
          break;
        case BASKETBALL:
          data.quarter = 0;
          data.timeRemaining = 0;
          break;
        case HOCKEY:
          data.period = 0;
          data.timeRemaining = 0;
          data.periods = [];
          break;
        default:
          break;
    }
    res.json({ response: data });
  }
}


function updateDashboard(){
  const games = [];
  const league = 'MLB';
  const today = moment().tz(date_time_zone);
  console.log(`https://www.mysportsfeeds.com/api/feed/pull/${league}/latest/scoreboard.json?fordate=${today.format('YYYYMMDD')}`);
  axios.get(`https://www.mysportsfeeds.com/api/feed/pull/${league}/latest/scoreboard.json?fordate=${today.format('YYYYMMDD')}`, config)
  .then(response => {
    response.data.scoreboard.gameScore.forEach(game => {
      const time = game.game.time;
      const date = game.game.date;
      const game_starting_time = moment.tz(`${date} ${time}`,'YYYY-MM-DD hh:mmA', date_time_zone);
      const now = moment().tz(date_time_zone);
      if(game_starting_time.diff(now) < 0){
        const date = game.game.date.replace(/-/g , '');
        const data = {};
        data.gameId = game.game.ID;
        data.league = league;
        data.display = 'BASIC';
        data.awayTeam = game.game.awayTeam;
        data.homeTeam = game.game.homeTeam;
        data.homeScore = game.game.homeScore;
        data.awayScore = game.game.awayScore;
        data.date = game.game.date;
        data.gameStarted = true;
        data.gameCompleted = game.game.isCompleted;
        data.displayPlayByPlay = true;
        data.plays = [];
        axios.get(`https://www.mysportsfeeds.com/api/feed/pull/${data.league}/latest/game_playbyplay.json?gameid=${data.gameId}`, config)
          .then(response => {
            switch (data.league){
              case BASEBALL:
                data.plays = mlb(response.data);
                data.currentInning = game.currentInning;
                data.currentInningHalf = game.currentInningHalf;
                data.innings = game.inningSummary.inning;
                break;
              case BASKETBALL:
                data.plays = nba(response.data);
                data.quarter = game.quarterSummary.quarter[game.quarterSummary.quarter.length - 1]['@number'];
                data.timeRemaining = game.timeRemaining;
                break;
              case HOCKEY:
                data.plays = nhl(response.data);

                data.period = game.periodSummary.period[game.periodSummary.period.length - 1]['@number'];
                data.timeRemaining = game.timeRemaining;
                data.periods = game.periodSummary.period;
                break;
              default:
                break;
            }
          games.push(data);
          console.log('inisde',games);
        }).catch(error => console.log(error));
      }
    })
  }).then(dfjlkdf =>  console.log('outside',games));
}

module.exports = {addCard, updateDashboard};
