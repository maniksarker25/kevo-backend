/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { registrationSuccessEmail } from '../../mailTemplate/registerSucessEmail';
import sendEmail from '../../utilities/sendEmail';
import Admin from '../admin/admin.model';
import { ICustomer } from '../customer/customer.interface';
import { Customer } from '../customer/customer.model';
import { Provider } from '../provider/provider.model';
import SuperAdmin from '../superAdmin/superAdmin.model';
import { USER_ROLE } from './user.constant';
import { UpdateUserProfileDTO } from './user.dto';
import { TUserRole } from './user.interface';
import { User } from './user.model';
import { createToken } from './user.utils';
const generateVerifyCode = (): number => {
    return Math.floor(100000 + Math.random() * 900000);
};

const registerUser = async (
    payload: ICustomer & {
        password: string;
        confirmPassword: string;
        role: 'provider' | 'customer';
        playerId?: string;
    }
) => {
    const { password, confirmPassword, playerId, role, ...userData } = payload;

    if (password !== confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Password and confirm password doesn't match"
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ email: userData.email });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const verifyCode = generateVerifyCode();

        let user: any;
        let profile: any;

        if (existingUser && existingUser.isVerified) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'This email already exists and is verified'
            );
        }

        if (existingUser && !existingUser.isVerified) {
            user = await User.findByIdAndUpdate(
                existingUser._id,
                {
                    password: hashedPassword,
                    role,
                    roles: [role],
                    verifyCode,
                    codeExpireIn: new Date(Date.now() + 5 * 60000),
                },
                { new: true, session }
            );

            if (existingUser.profileId) {
                if (existingUser.role === 'customer') {
                    await Customer.deleteOne({
                        _id: existingUser.profileId,
                    }).session(session);
                } else {
                    await Provider.deleteOne({
                        _id: existingUser.profileId,
                    }).session(session);
                }
            }
        }

        if (!existingUser) {
            const userPayload = {
                email: userData.email,
                phone: userData.phone,
                password: hashedPassword,
                role,
                roles: [role],
                verifyCode,
                codeExpireIn: new Date(Date.now() + 5 * 60000),
            };

            [user] = await User.create([userPayload], { session });
        }

        if (role === 'customer') {
            const customerPayload = {
                ...userData,
                user: user._id,
            };
            [profile] = await Customer.create([customerPayload], { session });
        } else {
            const providerPayload = {
                ...userData,
                user: user._id,
            };
            [profile] = await Provider.create([providerPayload], { session });
        }

        await User.findByIdAndUpdate(
            user._id,
            { profileId: profile._id },
            { session }
        );

        sendEmail({
            email: userData.email,
            subject: 'Activate Your Account',
            html: registrationSuccessEmail(
                profile.name,
                parseInt(user.verifyCode.toString())
            ),
        });

        await session.commitTransaction();
        session.endSession();

        return profile;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const verifyCode = async (email: string, verifyCode: number) => {
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (user.codeExpireIn < new Date(Date.now())) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Verify code is expired');
    }
    if (verifyCode !== user.verifyCode) {
        throw new AppError(httpStatus.BAD_REQUEST, "Code doesn't match");
    }
    const result = await User.findOneAndUpdate(
        { email: email },
        { isVerified: true },
        { new: true, runValidators: true }
    );

    if (!result) {
        throw new AppError(
            httpStatus.SERVICE_UNAVAILABLE,
            'Server temporary unable please try again letter'
        );
    }

    // Create JWT tokens
    const jwtPayload = {
        id: result?._id,
        profileId: result?.profileId,
        email: result?.email,
        role: result?.role as TUserRole,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );
    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
    );

    const obj: any = {};
    if (user.role == USER_ROLE.provider) {
        const provider = await Provider.findById(user.profileId);
        obj.isIdentificationDocumentVerified =
            provider?.isIdentificationDocumentApproved;
    }

    return {
        accessToken,
        refreshToken,
        ...obj,
        role: user?.role,
    };
};

const resendVerifyCode = async (email: string) => {
    const user = await User.findOne({ email: email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    const verifyCode = generateVerifyCode();
    const updateUser = await User.findOneAndUpdate(
        { email: email },
        {
            verifyCode: verifyCode,
            codeExpireIn: new Date(Date.now() + 5 * 60000),
        },
        { new: true, runValidators: true }
    );
    if (!updateUser) {
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Something went wrong . Please again resend the code after a few second'
        );
    }
    sendEmail({
        email: email,
        subject: 'Activate Your Account',
        html: registrationSuccessEmail('User', parseInt(verifyCode.toString())),
    });

    return null;
};

const getMyProfile = async (userData: JwtPayload) => {
    let result = null;
    if (userData.role === USER_ROLE.customer) {
        result = await Customer.findOne({ email: userData.email }).populate({
            path: 'user',
            select: 'isBlocked isActive isAdminVerified',
        });
    }
    if (userData.role === USER_ROLE.provider) {
        result = await Provider.aggregate([
            {
                $match: {
                    email: userData.email,
                },
            },

            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$user' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$userId'] },
                            },
                        },
                        {
                            $project: {
                                isBlocked: 1,
                                isActive: 1,
                            },
                        },
                    ],
                    as: 'user',
                },
            },

            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $lookup: {
                    from: 'tasks',
                    let: { providerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$provider', '$$providerId'] },
                                        {
                                            $eq: [
                                                '$isMarkCompletedByProvider',
                                                true,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'completedTasks',
                },
            },

            {
                $lookup: {
                    from: 'ratings',
                    let: { providerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$provider', '$$providerId'] },
                            },
                        },
                    ],
                    as: 'ratings',
                },
            },

            {
                $addFields: {
                    totalJobComplete: { $size: '$completedTasks' },
                    totalRatingCount: { $size: '$ratings' },

                    avgRating: {
                        $cond: [
                            { $gt: [{ $size: '$ratings' }, 0] },
                            { $avg: '$ratings.rating' },
                            0,
                        ],
                    },
                },
            },

            {
                $project: {
                    completedTasks: 0,
                    ratings: 0,
                },
            },
        ]);
    } else if (userData.role === USER_ROLE.superAdmin) {
        result = await SuperAdmin.findOne({ email: userData.email }).populate({
            path: 'user',
            select: 'isBlocked isActive ',
        });
    } else if (userData.role === USER_ROLE.admin) {
        result = await Admin.findOne({ email: userData.email }).populate({
            path: 'user',
            select: 'isBlocked isActive ',
        });
    }
    return result;
};

const deleteUserAccount = async (user: JwtPayload, password: string) => {
    const userData = await User.findById(user.id);

    if (!userData) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (!(await User.isPasswordMatched(password, userData?.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
    }

    await Customer.findByIdAndDelete(user.profileId);
    await User.findByIdAndDelete(user.id);

    return null;
};

// update user
const updateUserProfile = async (
    userData: JwtPayload,
    payload: UpdateUserProfileDTO
) => {
    if (userData.role == USER_ROLE.customer) {
        const user = await Customer.findById(userData.profileId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await Customer.findByIdAndUpdate(
            userData.profileId,
            payload,
            {
                new: true,
                runValidators: true,
            }
        );
        if (payload.profile_image && user.profile_image) {
            deleteFileFromS3(user.profile_image);
        }

        return result;
    } else if (userData.role == USER_ROLE.superAdmin) {
        const admin = await SuperAdmin.findById(userData.profileId);
        if (!admin) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await SuperAdmin.findByIdAndUpdate(
            userData.profileId,
            payload,
            { new: true, runValidators: true }
        );
        if (payload.profile_image && admin.profile_image) {
            deleteFileFromS3(admin.profile_image);
        }

        return result;
    } else if (userData.role == USER_ROLE.admin) {
        const admin = await Admin.findById(userData.profileId);
        if (!admin) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await Admin.findByIdAndUpdate(
            userData.profileId,
            payload,
            { new: true, runValidators: true }
        );
        if (payload.profile_image && admin.profile_image) {
            deleteFileFromS3(admin.profile_image);
        }

        return result;
    } else if (userData.role == USER_ROLE.provider) {
        const provider = await Provider.findById(userData.profileId);
        if (!provider) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await Provider.findByIdAndUpdate(
            userData.profileId,
            payload,
            { new: true, runValidators: true }
        );
        if (payload.profile_image && provider.profile_image) {
            deleteFileFromS3(provider.profile_image);
        }

        return result;
    }
};

const changeUserStatus = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    const result = await User.findByIdAndUpdate(
        id,
        { isBlocked: !user.isBlocked },
        { new: true, runValidators: true }
    );
    return result;
};

const adminVerifyUserFromDB = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    const result = await User.findByIdAndUpdate(
        id,
        { isAdminVerified: true },
        { new: true, runValidators: true }
    );
    return result;
};

// upgrade account
const upgradeAccount = async (userData: JwtPayload) => {
    const user = await User.findById(userData.id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (user?.roles && user.roles.length == 2) {
        if (userData.role == USER_ROLE.customer) {
            const provider = await Provider.findOne({
                user: userData.id,
            });
            if (!provider) {
                throw new AppError(httpStatus.NOT_FOUND, 'Provider not found');
            }
            const jwtPayload = {
                id: user?._id,
                profileId: provider._id.toString(),
                email: user?.email,
                role: USER_ROLE.provider,
            };
            const accessToken = createToken(
                jwtPayload,
                config.jwt_access_secret as string,
                config.jwt_access_expires_in as string
            );
            const refreshToken = createToken(
                jwtPayload,
                config.jwt_refresh_secret as string,
                config.jwt_refresh_expires_in as string
            );

            return {
                data: {
                    accessToken,
                    refreshToken,
                    role: USER_ROLE.provider,
                    isIdentificationDocumentVerified:
                        provider.isIdentificationDocumentApproved,
                },
                message: 'Your account switched to provider',
            };
        } else if (userData.role == USER_ROLE.provider) {
            const customer = await Customer.findOne({
                user: userData.id,
            }).select('_id');
            if (!customer) {
                throw new AppError(httpStatus.NOT_FOUND, 'Provider not found');
            }
            const jwtPayload = {
                id: user?._id,
                profileId: customer._id.toString(),
                email: user?.email,
                role: USER_ROLE.customer,
            };
            const accessToken = createToken(
                jwtPayload,
                config.jwt_access_secret as string,
                config.jwt_access_expires_in as string
            );
            const refreshToken = createToken(
                jwtPayload,
                config.jwt_refresh_secret as string,
                config.jwt_refresh_expires_in as string
            );

            return {
                data: {
                    accessToken,
                    refreshToken,
                    role: USER_ROLE.customer,
                },
                message: 'Your account switched to customer',
            };
        } else {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'You are not able to switch account'
            );
        }
    } else {
        if (userData.role == USER_ROLE.customer) {
            const customer = await Customer.findById(userData.profileId);

            const providerData = {
                user: user?._id,
                name: customer?.name,
                email: customer?.email,
                phone: customer?.phone,
                address: customer?.address,
            };

            const result = await Provider.create(providerData);

            await User.findByIdAndUpdate(
                userData.id,
                {
                    isMultiRole: true,
                    roles: [USER_ROLE.customer, USER_ROLE.provider],
                },
                { new: true }
            );

            const jwtPayload = {
                id: user?._id,
                profileId: result._id.toString(),
                email: user?.email,
                role: USER_ROLE.provider,
            };
            const accessToken = createToken(
                jwtPayload,
                config.jwt_access_secret as string,
                config.jwt_access_expires_in as string
            );
            const refreshToken = createToken(
                jwtPayload,
                config.jwt_refresh_secret as string,
                config.jwt_refresh_expires_in as string
            );

            return {
                data: {
                    accessToken,
                    refreshToken,
                    role: USER_ROLE.provider,
                    isAddressProvided: true,
                    isIdentificationDocumentVerified: false,
                    isBankNumberVerified: false,
                },
                message: 'Your account successfully upgrade to provider',
            };
        } else if (userData.role == USER_ROLE.provider) {
            const provider = await Provider.findById(userData.profileId);

            const customerData = {
                user: user?._id,
                name: provider?.name,
                email: provider?.email,
                phone: provider?.phone,
                address: provider?.address,
            };

            const result = await Customer.create(customerData);

            await User.findByIdAndUpdate(
                userData.id,
                {
                    isMultiRole: true,
                    roles: [USER_ROLE.provider, USER_ROLE.customer],
                },
                { new: true }
            );

            const jwtPayload = {
                id: user?._id,
                profileId: result._id.toString(),
                email: user?.email,
                role: USER_ROLE.customer,
            };
            const accessToken = createToken(
                jwtPayload,
                config.jwt_access_secret as string,
                config.jwt_access_expires_in as string
            );
            const refreshToken = createToken(
                jwtPayload,
                config.jwt_refresh_secret as string,
                config.jwt_refresh_expires_in as string
            );

            return {
                data: {
                    accessToken,
                    refreshToken,
                    role: USER_ROLE.customer,
                    isAddressProvided: true,
                },
                message: 'Your account successfully upgrade to customer',
            };
        } else {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'You are not able to upgrade your account'
            );
        }
    }
};

const userServices = {
    registerUser,
    verifyCode,
    resendVerifyCode,
    getMyProfile,
    changeUserStatus,
    deleteUserAccount,
    updateUserProfile,
    adminVerifyUserFromDB,
    upgradeAccount,
};

export default userServices;
