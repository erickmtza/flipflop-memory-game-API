const express = require('express');
const xss = require('xss');
const PlayersService = require('./players-service');
const path = require('path');

const playersRouter = express.Router();
const jsonParser = express.json();

playersRouter
    .route('/players')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        PlayersService.getAllPlayers(knexInstance)
            .then(players => {
                // res.json(articles)
                res.json(players.map(player => ({
                        ...player,
                        player_name: xss(player.player_name),
                        date_published: new Date(player.date_published).toLocaleString(),  
                }))) //For Windows newDate().. The TZ setting in setup.js doesn't work on Windows. 
            })
            .catch(err => {
                next(err);
            });
    })
    .post(jsonParser, (req, res, next) => {
        const { player_name, timer } = req.body
        const newPlayer = { player_name, timer }

        for (const [key, value] of Object.entries(newPlayer)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        PlayersService.insertPlayer(req.app.get('db'), newPlayer)
            .then(player => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl + `/${player.id}`)) // req.originalUrl contains a string of the full request URL of request
                    .json(player)
            })
            .catch(next)
    })

playersRouter
    .route('/playerOrder')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        PlayersService.getOrderedPlayers(knexInstance)
            .then(players => {
                // res.json(articles)
                res.json(players.map(player => ({
                        ...player,
                        player_name: xss(player.player_name),
                        date_published: new Date(player.date_published).toLocaleString('en-US', {timeZone: 'UTC'}),  
                }))) //For Windows newDate().. The TZ setting in setup.js doesn't work on Windows. 
            })
            .catch(err => {
                next(err);
            });
    })

module.exports = playersRouter