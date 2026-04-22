/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as IOServer, Socket } from 'socket.io';
import { getSingleConversation } from '../helper/getSingleConversation';
import Conversation from '../modules/conversation/conversation.model';
import Message from '../modules/message/message.model';
import { USER_ROLE } from '../modules/user/user.constant';
import { emitError } from './helper';

const handleChat = async (
    io: IOServer,
    socket: Socket,
    currentUserId: string,
    role: string
): Promise<void> => {
    // new message -----------------------------------
    socket.on('send-message', async (data) => {
        if (!data.receiver) {
            emitError(socket, {
                code: 400,
                message: 'Receiver is required',
                type: 'general',
                details: 'You must provide either a receiverId ',
            });
            return;
        }

        if (data?.receiver) {
            let conversation = await Conversation.findOne({
                $and: [
                    { participants: currentUserId },
                    { participants: data.receiver },
                ],
            });
            let participantsModel: any[] = [];
            if (role == USER_ROLE.customer) {
                participantsModel = ['Customer', 'Provider'];
            } else if (role == USER_ROLE.provider) {
                participantsModel = ['Provider', 'Customer'];
            }

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [currentUserId, data.receiver],
                    participantsModel: participantsModel,
                });
            }

            const messageData = {
                text: data.text || '',
                imageUrl: data.imageUrl || [],
                videoUrl: data.videoUrl || [],
                pdfUrl: data.pdfUrl || [],
                msgByUserId: currentUserId,
                msgByUserModel:
                    role == USER_ROLE.customer ? 'Customer' : 'Provider',
                conversationId: conversation?._id,
            };
            const saveMessage = await Message.create(messageData);
            const populatedMessage = await saveMessage.populate({
                path: 'msgByUserId',
                select: 'name profile_image',
            });
            await Conversation.updateOne(
                { _id: conversation?._id },
                {
                    lastMessage: saveMessage._id,
                }
            );
            // send to the frontend only new message data ---------------
            io.to(currentUserId.toString()).emit(
                `message-${data?.receiver}`,
                populatedMessage
            );
            io.to(data?.receiver.toString()).emit(
                `message-${currentUserId}`,
                populatedMessage
            );

            //send conversation
            const conversationSender = await getSingleConversation(
                conversation._id.toString(),
                currentUserId
            );
            const conversationReceiver = await getSingleConversation(
                conversation._id.toString(),
                data?.receiver
            );
            io.to(currentUserId.toString()).emit(
                'conversation',
                conversationSender
            );
            io.to(data?.receiver).emit('conversation', conversationReceiver);
        } else {
            console.log('nice to meet you in group chat');
        }
    });

    // send---------------------------------
    socket.on('seen', async ({ conversationId, msgByUserId }) => {
        await Message.updateMany(
            { conversationId: conversationId, msgByUserId: msgByUserId },
            { $set: { seen: true } }
        );

        //send conversation --------------
        const conversationSender = await getSingleConversation(
            conversationId,
            msgByUserId
        );
        const conversationReceiver = await getSingleConversation(
            conversationId,
            currentUserId
        );
        io.to(currentUserId as string).emit('conversation', conversationSender);
        io.to(msgByUserId).emit('conversation', conversationReceiver);
    });
};

export default handleChat;
