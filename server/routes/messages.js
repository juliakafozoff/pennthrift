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
            User.findOneAndUpdate(query, { $pull: { unread: id } }).then(() => {
                socket.broadcast.emit('unread');
            }).catch(err => console.error('[CLEAR-UNREAD] Error:', err));
        })

        socket.on('send-message', data => {
            const {sender, receiver , message, attachment, id} = data;

            if (sender === 'demo' || sender === 'Demo') {
                socket.emit('message-blocked', { 
                    error: 'Demo users cannot message real users. Please create an account.',
                    reason: 'demo_user_blocked'
                });
                return;
            }

            if (!id || !sender || !receiver) {
                console.error('[SEND-MESSAGE] Missing required fields:', { id, sender, receiver });
                socket.emit('send-error', { error: 'Missing required fields' });
                return;
            }

            Message.findById({_id:id}).then( out => {
                if (!out) {
                    console.error('[SEND-MESSAGE] Conversation not found:', id);
                    socket.emit('send-error', { error: 'Conversation not found' });
                    return;
                }
                const newMsg = {sender, message, attachment, timestamp: new Date().toISOString()};
                let newMessages;
                try { newMessages = [...(out.messages || []), newMsg]; }
                catch { newMessages = [newMsg]; }
                Message.findOneAndUpdate({_id:id},{messages:newMessages}).then( () => {
                    const receiverQuery = buildUsernameQuery(receiver);
                    User.findOneAndUpdate(receiverQuery, { $addToSet: { unread: id } }).then( () => {
                        socket.broadcast.emit('unread');
                        messages.in(id).emit('receive-message',id)
                    }).catch(err => console.error('[SEND-MESSAGE] Error updating receiver unread:', err));
                }).catch(err => {
                    console.error('[SEND-MESSAGE] Error saving message:', err);
                    socket.emit('send-error', { error: 'Failed to save message' });
                });
            }).catch(err => {
                console.error('[SEND-MESSAGE] Error finding conversation:', err);
                socket.emit('send-error', { error: 'Failed to find conversation' });
            });
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