/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../error/appError';
import getAdminNotificationCount from '../../helper/getAdminNotification';
import getNotificationCount from '../../helper/getUnseenNotification';
import { getIO } from '../../socket/socket';
import { USER_ROLE } from '../user/user.constant';
import Notification from './notification.model';

// const getAllNotificationFromDB = async (
//     query: Record<string, any>,
//     user: JwtPayload
// ) => {
//     if (user?.role === USER_ROLE.superAdmin) {
//         const notificationQuery = new QueryBuilder(
//             Notification.find({
//                 $or: [{ receiver: USER_ROLE.superAdmin }, { receiver: 'all' }],
//                 deleteBy: { $ne: user.profileId },
//             }),
//             query
//         )
//             .search(['name'])
//             .filter()
//             .sort()
//             .paginate()
//             .fields();
//         const result = await notificationQuery.modelQuery;
//         const meta = await notificationQuery.countTotal();
//         return { meta, result };
//     } else {
//         const notificationQuery = new QueryBuilder(
//             Notification.find({
//                 $or: [{ receiver: user?.profileId }, { receiver: 'all' }],
//                 deleteBy: { $ne: user?.profileId },
//             }),

//             query
//         )
//             .search(['title'])
//             .filter()
//             .sort()
//             .paginate()
//             .fields();
//         const result = await notificationQuery.modelQuery;
//         const meta = await notificationQuery.countTotal();
//         return { meta, result };
//     }
// };
const getAllNotificationFromDB = async (
    query: Record<string, unknown>,
    user: JwtPayload
) => {
    const matchStage: any = {
        deleteBy: { $ne: user.profileId },
        $or: [{ receiver: 'all' }],
    };

    if (user?.role === USER_ROLE.superAdmin) {
        matchStage.$or.push({ receiver: USER_ROLE.superAdmin });
    } else {
        matchStage.$or.push({ receiver: user.profileId });
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const pipeline: any[] = [
        { $match: matchStage },
        {
            $addFields: {
                isSeen: { $in: [user.profileId, '$seenBy'] },
            },
        },
        {
            $project: {
                seenBy: 0,
                deleteBy: 0,
                __v: 0,
            },
        },
        { $sort: { createdAt: -1 } }, // default descending sort
        {
            $facet: {
                result: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ];

    const aggResult = await Notification.aggregate(pipeline);

    const result = aggResult[0].result;
    const total = aggResult[0].totalCount[0]?.total || 0;

    const meta = {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
    };

    return { meta, result };
};

const seeNotification = async (user: JwtPayload) => {
    console.log('user', user);
    let result;
    const io = getIO();
    if (user?.role === USER_ROLE.superAdmin) {
        result = await Notification.updateMany(
            { $or: [{ receiver: USER_ROLE.superAdmin }, { receiver: 'all' }] },
            { $addToSet: { seenBy: user.profileId } },
            { runValidators: true, new: true }
        );
        const adminUnseenNotificationCount = await getAdminNotificationCount();
        const notificationCount = await getNotificationCount();
        io.emit('admin-notifications', adminUnseenNotificationCount);
        io.emit('notifications', notificationCount);
    } else if (user?.role === USER_ROLE.admin) {
        result = await Notification.updateMany(
            { $or: [{ receiver: USER_ROLE.admin }, { receiver: 'all' }] },
            { $addToSet: { seenBy: user.profileId } },
            { runValidators: true, new: true }
        );
    } else {
        result = await Notification.updateMany(
            { $or: [{ receiver: user.profileId }, { receiver: 'all' }] },
            { $addToSet: { seenBy: user.profileId } },
            { runValidators: true, new: true }
        );
        console.log('result', result);
    }
    const notificationCount = await getNotificationCount(user.profileId);
    io.to(user.profileId.toString()).emit('notifications', notificationCount);
    return result;
};

const deleteNotification = async (id: string, profileId: string) => {
    const notification = await Notification.findById(id);
    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
    }
    if (notification.receiver == profileId) {
        const reusult = await Notification.findByIdAndDelete(id);
        return reusult;
    } else if (notification.receiver == 'all') {
        const result = await Notification.findByIdAndUpdate(id, {
            $addToSet: { deleteBy: profileId },
        });
        return result;
    } else {
        return null;
    }
};

const notificationService = {
    getAllNotificationFromDB,
    seeNotification,
    deleteNotification,
};

export default notificationService;
