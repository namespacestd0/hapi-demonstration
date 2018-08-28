const Bcrypt = require('bcrypt');
const Boom = require('boom');

let UserStore = {};

UserStore.users = {};

UserStore.initialize = () => {
    UserStore.createUser('jerry', 'xiz170@ucsd.edu', 'password');
};

UserStore.createUser = async (name, email, password) => {
    const salt = await Bcrypt.genSalt(10);
    const hash = await Bcrypt.hash(password, salt);

    const user = {
        name, email,
        passwordHash: hash
    };

    if(UserStore.users[email]) return false;
    UserStore.users[email] = user;
    return true;
};

UserStore.validateUser = async (email, password) => {
    const user = UserStore.users[email];
    if(user === undefined) return Boom.notFound('User does not exist');
    const compare = await Bcrypt.compare(password, user.passwordHash);
    if(!compare) return Boom.unauthorized('Password does not match');
    return user;
};

module.exports = UserStore;
