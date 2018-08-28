'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Handlebars = require('handlebars');
const Good = require('good');
const HapiAuthCookie = require('hapi-auth-cookie');

const CardStore = require('./lib/cardStore');
const UserStore = require('./lib/userStore');

CardStore.initialize();
UserStore.initialize();

// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 3000
});

server.ext({
    type: 'onPreResponse',
    method: (request, h) => {
        if(request.response.isBoom) return h.view('error', request.response)
        return h.continue;
    }
});

const GoodOptions = {
    ops: {
        interval: 5000
    },
    reporters: {
        myFileReporter: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ ops: '*', response: '*', error: '*' }]
        }, {
            module: 'good-squeeze',
            name: 'SafeJson'
        },{
            module: 'good-file',
            args: ['./logs/awesome_log']
        }]
    }
};

const init = async () => {
    await server.register({
        plugin: Good,
        options: GoodOptions,
    });
    await server.register(HapiAuthCookie);
    await server.register(Inert);
    await server.register(Vision);

    server.route(require('./lib/routes'));

    server.auth.strategy('default', 'cookie', {
        password: '6>Cu3X2ii529319CO;368S)0^459(|8)|S?QdZ3613p56ih5<N', // min 32 characters required https://github.com/hapijs/hapi/issues/3040
        redirectTo: '/login',
        isSecure: false,
    });

    server.auth.default('default');

    server.views({
        engines: {
            html: Handlebars
        },
        path: './templates'
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

init();
