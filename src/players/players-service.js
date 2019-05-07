const PlayersService = {
    getAllPlayers(knex) {
        return knex.select('*').from('player_leaderboard')
    },
    getOrderedPlayers(knex) {
        return knex
            .select('*')
            .from('player_leaderboard')
            .orderBy([
                { column: 'timer', order: 'ASC' },
            ])
    },
    insertPlayer(knex, newPlayer) {
        return knex
            .insert(newPlayer)
            .into('player_leaderboard')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('player_leaderboard').select('*').where('id', id).first()
    },
    deleteArticle(knex, id) {
        return knex('player_leaderboard')
            .where({ id }) // or .where('id', id)
            .delete()
    },
    updateArticle(knex, id, newArticleFields) {
        return knex('player_leaderboard')
            .where({ id })
            .update(newArticleFields)
    },
};

module.exports = PlayersService;