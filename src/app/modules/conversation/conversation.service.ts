import mongoose from 'mongoose';
import Conversation from './conversation.model';

const getConversation = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.aggregate([
        {
            $match: {
                participants: new mongoose.Types.ObjectId(profileId),
            },
        },
        {
            $addFields: {
                participantsPaired: {
                    $map: {
                        input: { $range: [0, { $size: '$participants' }] },
                        as: 'i',
                        in: {
                            id: { $arrayElemAt: ['$participants', '$$i'] },
                            model: {
                                $arrayElemAt: ['$participantsModel', '$$i'],
                            },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                other: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: '$participantsPaired',
                                as: 'p',
                                cond: {
                                    $ne: [
                                        '$$p.id',
                                        new mongoose.Types.ObjectId(profileId),
                                    ],
                                },
                            },
                        },
                        0,
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'other.id',
                foreignField: '_id',
                as: 'customerData',
            },
        },
        {
            $lookup: {
                from: 'providers',
                localField: 'other.id',
                foreignField: '_id',
                as: 'providerData',
            },
        },
        {
            $addFields: {
                userData: {
                    $cond: [
                        { $eq: ['$other.model', 'Customer'] },
                        { $arrayElemAt: ['$customerData', 0] },
                        { $arrayElemAt: ['$providerData', 0] },
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'messages',
                let: { conversationId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            '$conversationId',
                                            '$$conversationId',
                                        ],
                                    },
                                    { $eq: ['$seen', false] },
                                    {
                                        $ne: [
                                            '$msgByUserId',
                                            new mongoose.Types.ObjectId(
                                                profileId
                                            ),
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    { $count: 'unseenCount' },
                ],
                as: 'unseenCountData',
            },
        },
        {
            $addFields: {
                unseenMsg: {
                    $ifNull: [
                        { $arrayElemAt: ['$unseenCountData.unseenCount', 0] },
                        0,
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'messages',
                localField: 'lastMessage',
                foreignField: '_id',
                as: 'lastMessage',
            },
        },
        { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                createdAt: 1,
                updatedAt: 1,
                unseenMsg: 1,
                lastMessage: 1,
                userData: {
                    _id: '$userData._id',
                    name: '$userData.name',
                    profile_image: '$userData.profile_image',
                    email: '$userData.email',
                },
            },
        },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
    ]);

    return {
        meta: {
            page,
            limit,
            total: conversations.length,
            totalPage: Math.ceil(conversations.length / limit),
        },
        data: conversations,
    };
};

export default { getConversation };
