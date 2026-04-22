import { Schema, model } from 'mongoose';
import { IConversation } from './conversation.interface';

const conversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                required: true,
                refPath: 'participantsModel',
            },
        ],
        participantsModel: [
            {
                type: String,
                required: true,
                enum: ['Customer', 'Provider'],
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
    },
    { timestamps: true }
);

const Conversation = model<IConversation>('Conversation', conversationSchema);

export default Conversation;
