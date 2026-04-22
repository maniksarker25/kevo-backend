/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import Conversation from '../conversation/conversation.model';
import Message from './message.model';

const getMessages = async (
    profileId: string,
    otherUserId: string,
    query: Record<string, unknown>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = (query?.searchTerm as string) || '';

    // Find conversation between the two users
    const conversation = await Conversation.findOne({
        participants: {
            $all: [
                new mongoose.Types.ObjectId(profileId),
                new mongoose.Types.ObjectId(otherUserId),
            ],
        },
    }).select('_id');

    if (!conversation) {
        return {
            meta: { page, limit, total: 0, totalPages: 0 },
            result: [],
        };
    }

    const conversationId = conversation._id;

    const messages = await Message.aggregate([
        {
            $match: {
                conversationId: new mongoose.Types.ObjectId(conversationId),
                text: { $regex: searchTerm, $options: 'i' },
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'msgByUserId',
                foreignField: '_id',
                as: 'customerDetails',
            },
        },
        {
            $lookup: {
                from: 'providers',
                localField: 'msgByUserId',
                foreignField: '_id',
                as: 'providerDetails',
            },
        },
        {
            $addFields: {
                userDetails: {
                    $let: {
                        vars: {
                            customer: { $arrayElemAt: ['$customerDetails', 0] },
                            provider: { $arrayElemAt: ['$providerDetails', 0] },
                        },
                        in: {
                            _id: {
                                $cond: [
                                    { $ifNull: ['$$customer', false] },
                                    '$$customer._id',
                                    '$$provider._id',
                                ],
                            },
                            name: {
                                $cond: [
                                    { $ifNull: ['$$customer', false] },
                                    '$$customer.name',
                                    '$$provider.name',
                                ],
                            },
                            profile_image: {
                                $cond: [
                                    { $ifNull: ['$$customer', false] },
                                    '$$customer.profile_image',
                                    '$$provider.profile_image',
                                ],
                            },
                            email: {
                                $cond: [
                                    { $ifNull: ['$$customer', false] },
                                    '$$customer.email',
                                    '$$provider.email',
                                ],
                            },
                        },
                    },
                },
                isMyMessage: {
                    $eq: [
                        '$msgByUserId',
                        new mongoose.Types.ObjectId(profileId),
                    ],
                },
            },
        },
        {
            $project: {
                text: 1,
                imageUrl: 1,
                videoUrl: 1,
                pdfUrl: 1,
                seen: 1,
                msgByUserId: 1,
                msgByUserModel: 1,
                conversationId: 1,
                createdAt: 1,
                updatedAt: 1,
                userDetails: 1,
                isMyMessage: 1,
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ]);

    const result = messages[0]?.result || [];
    const total = messages[0]?.totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        meta: { page, limit, total, totalPages },
        result,
    };
};

const MessageService = { getMessages };
export default MessageService;
