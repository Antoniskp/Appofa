// Migration file for adding poll vote restriction

exports.up = function (knex) {
    return knex.schema.table('polls', function(table) {
        table.enu('voteRestriction', ['any', 'voters', 'participants'])
            .defaultTo('any')
            .alter();
    }).then(function() {
        return knex.raw(`
            UPDATE polls
            SET voteRestriction = CASE
                WHEN condition1 THEN 'any'::enum_Polls_voteRestriction
                WHEN condition2 THEN 'voters'::enum_Polls_voteRestriction
                WHEN condition3 THEN 'participants'::enum_Polls_voteRestriction
                ELSE voteRestriction
            END
        `);
    });
};

exports.down = function (knex) {
    return knex.schema.table('polls', function(table) {
        table.dropColumn('voteRestriction');
    });
};