const moment = require('moment');

module.exports = function (knex) {
  return {

    insertFavouriteTeam: (user_id, team_id) => knex.returning('id')
      .insert({ user_id, team_id }).into('favourites'),
    getTeamsByUser: (user_id) => {
      console.log('favourite teams by user');
      return knex.select('*')
      .from('favourites')
      .where('user_d', '=', user_id);
    },
    getGamesByUser: user_id => knex.raw('select games.* from games join teams on games.away_team_id = teams.id or games.home_team_id = teams.id join favourites on favourites.team_id = teams.id where favourites.user_id = 21;')
      .then(games => games.rows.filter((game) => {
        const days = game.league === 'MLB' ? 3 : 7;
        const gameDate = moment(game.date, 'YYYY-MM-DD');
        return gameDate.isBetween(moment(), moment().add(days, 'days'), 'day', '[]');
      }))

      // .from('games')
      // .join('teams', function () {
      //   this.on('games.away_team_id', 'teams.id')
      //     .orOn('games.home_team_id', 'teams.id');
      // })
      // .join('favourites')
      // .on('favourites.team_id', 'teams.id')
      // .where('favourites.user_id', user_id)


  };
};
