const faker = require('faker');
const bcrypt = require('bcrypt');
const moment = require('moment-timezone');

const nbaGames = require('./NBA.json');
const nbaTeams = require('./NBAteams.json');
const mlbGames = require('./MLB.json');
const mlbTeams = require('./MLBteams.json');
const nhlGames = require('./NHL.json');
const nhlTeams = require('./NHLteams.json');

const date_time_zone = 'America/Los_Angeles';
const game_time_zone = 'America/New_York';

const config = {
  users: 3
};


function getTeams(teamlist) {
  return teamlist.overallteamstandings.teamstandingsentry.map(team => ({ id: Number(team.team.ID), city: team.team.City, name: team.team.Name, abbreviation: team.team.Abbreviation }));
}


function getNTeams(teamlist) {
  return teamlist.teams.map(team => ({ id: Number(team.ID), city: team.City, name: team.Name, abbreviation: team.Abbreviation }));
}

function mlb(game) {
  const startTime = moment.tz(`${game.date} ${game.time}`, 'YYYY-MM-DD hh:mmA', game_time_zone);
  const gameTime = startTime.tz(date_time_zone).format('hh:mmA');
  return { id: Number(game.id), league: 'MLB', away_team_id: Number(game.awayTeam.ID), home_team_id: Number(game.homeTeam.ID), time: gameTime, date: game.date };
}

function nba(game) {
  const startTime = moment.tz(`${game.date} ${game.time}`, 'YYYY-MM-DD hh:mmA', game_time_zone);
  const gameTime = startTime.tz(date_time_zone).format('hh:mmA');
  return { id: Number(game.id), league: 'NBA', away_team_id: Number(game.awayTeam.ID), home_team_id: Number(game.homeTeam.ID), time: gameTime, date: game.date };
}

function nhl(game) {
  const startTime = moment.tz(`${game.date} ${game.time}`, 'YYYY-MM-DD hh:mmA', game_time_zone);
  const gameTime = startTime.tz(date_time_zone).format('hh:mmA');
  return { id: Number(game.id), league: 'NHL', away_team_id: Number(game.awayTeam.ID), home_team_id: Number(game.homeTeam.ID), time: gameTime, date: game.date };
}


function empty(length) {
  return new Array(length).fill(undefined);
}

exports.seed = function (knex, Promise) {
  const users = () => {
    const users = empty(config.users).map(() => ({ username: faker.internet.userName(), email: faker.internet.email(), password: bcrypt.hashSync('1234', 10) }));

    return knex('users').del().then(() => knex('users').insert(users, 'id'));
  };

  const teams = () => {
    const nbaTeamList = getNTeams(nbaTeams);
    const teams0 = nbaTeamList.concat(getTeams(mlbTeams));
    const teams = teams0.concat(getNTeams(nhlTeams));
    return knex('teams').del().then(() => knex('teams').insert(teams, 'id'));
  };

  return teams().then(users);
};

