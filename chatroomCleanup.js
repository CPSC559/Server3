const cron = require('node-cron');
const Chatroom = require('./models/Chatroom');
const Message = require('./models/Message');

module.exports = function chatroomCleanup() {
    // Scheduled to run every minute
    cron.schedule('* * * * *', async () =>
    {
        try
        {
            console.log('Cleaning up inactive chatrooms...');
            const chatrooms = await Chatroom.find({});
            const messages = await Message.find({});
            
            // Delete messages associated with chat rooms that no longer exist
            for (const message of messages)
            {
                const chatroomExists = chatrooms.some(chatroom => chatroom.Password === message.ChatroomID);
                if (!chatroomExists)
                {
                    await Message.findByIdAndDelete(message._id);
                    console.log(`Message ${message._id} was deleted as its chat room no longer exists.`);
                }
            }

            // Delete inactive chat rooms
            for (const chatroom of chatrooms)
            {
                const lastMessage = await Message.findOne({ ChatroomID: chatroom._id }).sort({ createdAt: -1 });
                if (lastMessage)
                {
                    const timeDifference = Date.now() - lastMessage.createdAt.getTime();
                    const minutesDifference = Math.floor(timeDifference / (1000 * 60));
                    if (minutesDifference > 10)
                    {
                        // Delete chatroom if the last message is from more than 10 minutes ago
                        await Message.deleteMany({ ChatroomID: chatroom._id });
                        await Chatroom.findByIdAndDelete(chatroom._id);
                        console.log(`Chatroom ${chatroom._id} was deleted for inactivity.`);
                    }
                }
            }
        }
        catch (error)
        {
            console.error('An error occurred while trying to cleanup chatrooms and messages:', error);
        }
    })
}