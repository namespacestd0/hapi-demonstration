const fs = require('fs');

let CardStore = {};
CardStore.cards = {};

CardStore.initialize = function() {
    CardStore.cards = loadCards();
}

function loadCards() {
    const file = fs.readFileSync('./cards.json');
    return JSON.parse(file.toString());
};

module.exports = CardStore;
