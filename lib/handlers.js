const fs = require('fs');
const Joi = require('joi');
const Boom = require('boom');
const Uuid = require('uuid');
const Util = require('util');

const CardStore = require('./cardStore');
const UserStore = require('./userStore');
const Handlers = {};

const cardSchema = Joi.object().keys({
    name: Joi.string().min(3).max(50).required(),
    link: Joi.string().min(3).max(150).required(),
    descritpion: Joi.string().required(),
    card_image: Joi.string().regex(/.+\.(jpg|bmp|png|gif)\b/).required()
});

const loginSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(32).required()
});

const registerSchema = Joi.object().keys({
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).max(32).required()
});

Handlers.newCardHandler = (request, h) => {
    if(request.method === 'get') return h.view('new', { card_images: mapImages() });

    const result = Joi.validate(request.payload, cardSchema);
    const card = {
        name: request.payload.name,
        link: request.payload.link,
        level: request.payload.level,
        descritpion: request.payload.descritpion,
        card_image: request.payload.card_image
    };
    // save new card if no error found
    if(result.error === null) {
        saveCard(card);
        return h.redirect('/cards');
    } else {
        // throw fancy error if validation failed
        return Boom.badRequest(result.error.details[0].message);
    };
};

Handlers.loginHandler = async (request, h) => {
    const result = Joi.validate(request.payload, loginSchema);
    const validateUser = await UserStore.validateUser(request.payload.email, request.payload.password);
    if(result.error === null && validateUser.data !== null) {
        request.cookieAuth.set(validateUser);
        return h.redirect('/cards');
    } else {
        return Boom.unauthorized('Credentials did not validate');
    };
};

Handlers.registerHandler = async (request, h) => {
    const result = Joi.validate(request.payload, registerSchema);
    if(result.error === null) {
        const createUser = await UserStore.createUser(request.payload.name, request.payload.email, request.payload.password);
        if(!createUser) return Boom.conflict('Email already exists. Please login');
        return h.redirect('/cards');
    } else {
        return Boom.unauthorized('Credentials did not validate');
    };
};

Handlers.logoutHandler = (request, h) => {
    request.cookieAuth.clear();
    return h.redirect('/');
};

Handlers.cardsHandler = (request, h) => {
    return h.view('cards', { cards: getCards(request.auth.credentials.email) })
};

Handlers.deleteCardHandler = (request, h) => {
    delete CardStore.cards[request.params.id];
    return {};
};

Handlers.cardHandler = function(request, h) {
    const card = CardStore.cards[request.params.id];
    return h.view('card', card);
}

Handlers.uploadHandler = async (request, h) => {
    const image = request.payload.upload_image;
    if(image.bytes) {
        const fsPromises = fs.promises;
        await fsPromises.link(image.path, 'public/images/cards/' + image.filename);
        await fsPromises.unlink(image.path);
        return h.redirect('/cards');
    } else {
        return Boom.badRequest();
    };
};

function saveCard(card) {
    const id = Uuid.v1();
    card.id = id;
    CardStore.cards[id] = card;
};

function getCards(email) {
    let cards = [];
    for(let key in CardStore.cards) {
        cards.push(CardStore.cards[key]);
    };
    return cards;
};

function mapImages() {
    return fs.readdirSync('./public/images/cards');
};

module.exports = Handlers;
