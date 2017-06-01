module.exports = function(knex) {
  return {
    findByLeagueAndDate: (league, date) => {
      return knex.select('games.*', 'games.away_team_id', 'games.home_team_id', 'awayteam.abbreviation AS awayteam', 'hometeam.abbreviation AS hometeam')
      .from('games')
      .join('teams AS awayteam', 'games.away_team_id', 'awayteam.id')
      .join('teams AS hometeam', 'games.home_team_id', 'hometeam.id')
      .where('games.league', '=', league).andWhere('games.date', '=', date)
      .orderBy('games.time', 'asc');
    },
    findGame: (id) => {
      return knex.select('*')
      .from('games')
      .where('id','=', id);
    },
    insertGame: (game) => {
      return knex('games').insert({id: game.gameId, league: game.league, away_team_id: game.awayTeamId, home_team_id: game.homeTeamId, time: game.time, date: game.date});
    },
    insertTeam:(id, abbr) => {
      return knex('teams').insert({ id: id, abbreviation: abbr });
    },
    findTeam: (id) => {
      return knex.select('id')
      .from('teams')
      .where('id','=', id);
    }
  };
};