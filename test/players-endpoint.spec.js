const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');

const { makePlayersArray } = require('./players.fixtures')

describe('Players Endpoints', function() {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })

        app.set('db', db)
    });
  
    after('disconnect from db', () => db.destroy());
  
    //before('clean the table', () => db('blogful_articles').truncate());
    //afterEach('cleanup', () => db('blogful_articles').truncate())
    before('clean the table', () => db.raw('TRUNCATE player_leaderboard RESTART IDENTITY CASCADE'))
    afterEach('cleanup',() => db.raw('TRUNCATE player_leaderboard RESTART IDENTITY CASCADE'))

    describe(`GET /api/players`, () => {
        context(`Given no players`, () => {
            it(`responds with 200 and an empty list`, () => {
            return supertest(app)
                .get('/api/players')
                .expect(200, [])
            })

        });

        context('Given there are players in the database', () => {
            const testUsers = makePlayersArray();
        
            beforeEach('insert players', () => {
                return db
                    .into('player_leaderboard')
                    .insert(testUsers)
            });
        
            it('responds with 200 and all of the players', () => {
                return supertest(app)
                    .get('/api/players')
                    .expect(200, testUsers)
            });
        })

        context(`Given an XSS attack user`, () => {
            const testUsers = makePlayersArray();

            const maliciousUser = {
                player_id: 911,
                player_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
                timer: 151,
                date_published: new Date().toLocaleString()
            }
        
            beforeEach('insert malicious user', () => {
                return db
                    .into('player_leaderboard')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('player_leaderboard')
                            .insert([ maliciousUser ])
                    })
            })
        
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/players`)
                    .expect(200)
                    .expect(res => {
                        const findUser = res.body[res.body.length - 1]
                        expect(findUser.player_name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    })
            })
        })
    });

    describe(`POST /api/players`, () => {
        it(`creates a player, responding with 201 and the new player`,  function() {
            this.retries(3)
            const newUser = {
                player_name: 'Test new user',
                timer: 77,
            }
            return supertest(app)
                .post('/api/players')
                .send(newUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.player_name).to.eql(newUser.player_name)
                    expect(res.body.timer).to.eql(newUser.timer)
                    expect(res.body).to.have.property('player_id')
                    expect(res.body).to.have.property('date_published')
                    expect(res.headers.location).to.eql(`/api/players/${res.body.id}`)
                })
        })

        const requiredFields = ['player_name', 'timer' ]
        
        requiredFields.forEach(field => {
            const newUser = {
            player_name: 'Test new article',
            timer: 81,
        }
        
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newUser[field]
            
                return supertest(app)
                    .post('/api/players')
                    .send(newUser)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })

    })

});