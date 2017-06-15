require('dotenv').config();
const axios = require('axios');
const express = require('express');
const moment = require('moment-timezone');

const apiRouter = express.Router();
const ENV = process.env.NODE_ENV || 'development';

const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig[ENV]);
const dbGames = require('../db/games')(knex);

const { addCard } = require('../api/feed');

const config = {
  auth: {
    username: process.env.MY_SPORTS_FEED_USERNAME,
    password: process.env.MY_SPORTS_FEED_PASSWORD
  }
};

const dateFormat = 'YYYY-MM-DD';
const dateTimeZone = 'America/Los_Angeles';
const gameTimeZone = 'America/New_York';

const getGamesByDate = (league, date) => dbGames.findByLeagueAndDate(league, date).then((result) => {
  if (result[0]) {
    return result.map(game => ({
      gameId: game.id,
      awayTeam: { Abbreviation: game.awayteam, ID: game.away_team_id },
      homeTeam: { Abbreviation: game.hometeam, ID: game.home_team_id },
      date: game.date,
      time: game.time,
      league: game.league
    }));
  }

  const apiDate = date.replace(/-/g, '');
  const apiPath = `https://www.mysportsfeeds.com/api/feed/pull/${league}/latest/daily_game_schedule.json?fordate=${apiDate}`;
  return axios.get(apiPath, config).then((json) => {
    if (json.data.dailygameschedule.gameentry) {
      let startTime;
      return json.data.dailygameschedule.gameentry.map((game) => {
        game.gameId = parseInt(game.id, 10);
        game.league = league;
        startTime = moment.tz(`${game.date} ${game.time}`, 'YYYY-MM-DD hh:mmA', gameTimeZone);
        game.time = startTime.tz(dateTimeZone).format('hh:mmA');
        return game;
      });
    }
    return [];
  })
  .then((games) => {
    if (games.length) {
      const gamesForDb = games.map(game => ({
        id: game.gameId,
        league: game.league,
        away_team_id: game.awayTeam.ID,
        home_team_id: game.homeTeam.ID,
        time: game.time,
        date: game.date
      }));
      dbGames.insertGames(gamesForDb).catch(error => console.log(error));
    }
    return games;
  });
})
.then(values => values);

module.exports = (function () {
  apiRouter.get('/:league', (req, res) => {
    const league = req.params.league;
    const date = moment().tz(dateTimeZone).format(dateFormat);

    const days = league === 'MLB' ? 3 : 7;
    const gameSchedule = [];
    for (let i = 0; i < days; i++) {
      const newDate = moment(date).add(i, 'days').format(dateFormat);
      gameSchedule.push(getGamesByDate(league, newDate));
    }
    Promise.all(gameSchedule)
      .then((values) => {
        res.json({ response: values });
      }).catch((error) => {
        res.status(500);
        res.json({ message: 'Error fetching game schedule. Please try again later.' });
      });
  });

  apiRouter.post('/:league/games/:id', (req, res) => {
    const user_id = req.session.user_id;
    addCard(user_id, req.body, res);
  });

  return apiRouter;
}());
