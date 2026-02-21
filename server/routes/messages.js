const User = require('../models/user.model');
const Message = require('../models/message.model')

// Helper function for case-insensitive username lookup
const normalizeUsernameForLookup = (username) => {
    return username ? username.toLowerCase() : username;
};

const buildUsernameQuery = (username) => {
    const normalized = normalizeUsernameForLookup(username);
    return {
        $or: [
            { username: normalized },
            { usernameLower: normalized }
        ]
    };
};

function messages(io){

    const messages = io.of('/api/messages');
    
    messages.on('connection', socket => {

        socket.on('clear-unread', data => {
            const { id, username } = data;
            const query = buildUsernameQuery(username);
            const idStr = String(id);
            User.findOne(query).then( user => {
                if (!user) return;
                const unread = user.unread.filter(el => String(el) !== idStr);
                User.findOneAndUpdate(query, { unread }).then( () => {
                    socket.broadcast.emit('unread')
                })
            })
        })

        socket.on('send-message', data => {
            const {sender, receiver , message, attachment, id} = data;

            // Block demo users from messaging real users
            if (sender === 'demo' || sender === 'Demo') {
                socket.emit('message-blocked', { 
                    error: 'Demo users cannot message real users. Please create an account.',
                    reason: 'demo_user_blocked'
                });
                return;
            }

            try{
                Message.findById({_id:id}).then( out => {
                    let newMessage; try{ newMessage = [...out.messages, {sender, message, attachment}]}catch{newMessage = [{sender, message, attachment}]}
                    Message.findOneAndUpdate({_id:id},{messages:newMessage}).then( out => {
                        const receiverQuery = buildUsernameQuery(receiver);
                        User.findOneAndUpdate(receiverQuery, { $addToSet: { unread: id } }).then( res => {
                            socket.broadcast.emit('unread');
                            messages.in(id).emit('receive-message',id)
                        })
                    })
                })

            }catch{

            }
        });

        socket.on('join-room', id => {
            socket.join(id)

        });

        socket.on('get-open', users => {
            // Block demo users from creating conversations with real users
            if (Array.isArray(users) && users.length === 2) {
                const sender = users[0];
                const receiver = users[1];
                
                // Allow demo user to message franklindesk (system user)
                if (sender === 'demo' && receiver !== 'franklindesk') {
                    socket.emit('message-blocked', { 
                        error: 'Demo users cannot message real users. Please create an account.',
                        reason: 'demo_user_blocked'
                    });
                    return;
                }
            }
            
            try{
                Message.findOne({users:users}, {users:1})
                .then(message => {
                    if(!message){
                        Message.findOne({users:users.reverse()}, {users:1}).then( message => {
                            if(!message){
                                _messageNaviagate(users)
                            }else{
                                socket.emit('message-navigate', message._id)
                            }
                        })
                    }else{
                        socket.emit('message-navigate', message._id)
                    }
                })
            }catch{

            }
            
        })

        socket.on('load', id => {
            try{
                Message.findById({_id:id}).then( value => socket.emit('allMessages', value) );

            }catch{

            }
            

        })

        const _messageNaviagate = (users) => { 
            // Block demo users from creating conversations with real users
            if (Array.isArray(users) && users.length === 2) {
                const sender = users[0];
                const receiver = users[1];
                
                // Allow demo user to message franklindesk (system user)
                if (sender === 'demo' && receiver !== 'franklindesk') {
                    socket.emit('message-blocked', { 
                        error: 'Demo users cannot message real users. Please create an account.',
                        reason: 'demo_user_blocked'
                    });
                    return;
                }
            }
            
            try{
                const message = new Message({users:users })
                message.save().then(out => {
                    users.map( user => {
                        const userQuery = buildUsernameQuery(user);
                        User.findOneAndUpdate(
                            userQuery,
                            {$addToSet: {chats:message}}
                        ).exec();
    
                    })
                    socket.emit('message-navigate', out._id)
                })
                
            }catch{

            }
        }

    })

}

module.exports = messages