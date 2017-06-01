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
    getFavoriteGamesByUser: user_id => knex.select('*')
        .from('games')
        .where('away_team_id', '=', teamId)
        .orWhere('home_team_id', '=', teamId)
        .then(games => games.filter((game) => {
          const days = game.league === 'MLB' ? 3 : 7;
          const gameDate = moment(game.date, 'YYYY-MM-DD');
          return gameDate.isBetween(moment(), moment().add(days, 'days'), 'day', '[]');
        }))
  };
};
