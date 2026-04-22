/* eslint-disable @typescript-eslint/no-explicit-any */
import appleSigninAuth from 'apple-signin-auth';
import axios from 'axios';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';

import AppError from '../../error/appError';
import { Customer } from '../customer/customer.model';
import { Provider } from '../provider/provider.model';
import { USER_ROLE } from '../user/user.constant';
import { TUserRole } from '../user/user.interface';
import { User } from '../user/user.model';
import { createToken } from '../user/user.utils';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
dotenv.config();

const loginWithOAuth = async (
    provider: string,
    token: string,
    role: TUserRole,
    deviceType?: string,
    playerId?: string
) => {
    let email, id, name, picture;

    let clientId = process.env.WEB_CLIENT_ID;
    if (deviceType && deviceType == 'ios') {
        clientId = process.env.IOS_CLIENT_ID;
    } else if (deviceType && deviceType == 'android') {
        clientId = process.env.ANDROID_CLIENT_ID;
    }

    const googleClient = new OAuth2Client(clientId);
    try {
        if (provider === 'google') {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    audience: clientId,
                });

                const payload = ticket.getPayload();
                if (!payload) {
                    throw new AppError(400, 'Invalid Google token payload');
                }

                email = payload.email!;
                id = payload.sub;
                name = payload.name!;
                picture = payload.picture!;
            } catch (err: any) {
                if (
                    err.message &&
                    err.message.includes('Wrong recipient, payload audience')
                ) {
                    throw new AppError(
                        401,
                        `Google token audience mismatch. Please check your client ID. ${err.message}`
                    );
                }
                throw new AppError(
                    401,
                    `Google token verification failed: ${err.message}`
                );
            }
        } else if (provider === 'facebook') {
            try {
                const response: any = await axios.get(
                    `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${token}`
                );

                if (!response.data || !response.data.id) {
                    throw new AppError(
                        400,
                        'Invalid Facebook token or response'
                    );
                }

                email = response.data.email;
                id = response.data.id;
                name = response.data.name;
                picture = response.data.picture?.data?.url || '';
            } catch (err: any) {
                throw new AppError(
                    401,
                    `Facebook token verification failed: ${
                        err.response?.data?.error?.message || err.message
                    }`
                );
            }
        } else if (provider === 'apple') {
            try {
                const appleUser = await appleSigninAuth.verifyIdToken(token, {
                    audience: process.env.APPLE_CLIENT_ID!,
                    ignoreExpiration: false,
                });

                if (!appleUser || !appleUser.sub) {
                    throw new AppError(400, 'Invalid Apple token payload');
                }

                email = appleUser?.email || ' ';
                id = appleUser.sub;
                name = 'Apple User';
                picture = '';
            } catch (err: any) {
                throw new AppError(
                    401,
                    `Apple token verification failed: ${err.message}`
                );
            }
        } else {
            throw new AppError(400, 'Unsupported OAuth provider');
        }
        // Find or create user
        let user = await User.findOne({ [`${provider}Id`]: id });

        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                user = new User({
                    email,
                    [`${provider}Id`]: id,
                    name,
                    profilePic: picture,
                    role,
                    isVerified: true,
                    playerIds: playerId ? [playerId] : [],
                });

                await user.save({ session });

                const nameParts = name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts[1] || '';
                const username = email.split('@')[0];

                if (role == USER_ROLE.customer) {
                    const result = await Customer.create(
                        [
                            {
                                name: firstName + ' ' + lastName,
                                user: user._id,
                                email,
                                profile_image: picture,
                                username,
                            },
                        ],
                        { session }
                    );

                    user = await User.findByIdAndUpdate(
                        user._id,
                        { profileId: result[0]._id },
                        { new: true, runValidators: true, session }
                    );

                    await session.commitTransaction();
                    session.endSession();
                } else {
                    const result = await Provider.create(
                        [
                            {
                                name: firstName + ' ' + lastName,
                                user: user._id,
                                email,
                                profile_image: picture,
                                username,
                            },
                        ],
                        { session }
                    );

                    user = await User.findByIdAndUpdate(
                        user._id,
                        { profileId: result[0]._id },
                        { new: true, runValidators: true, session }
                    );

                    await session.commitTransaction();
                    session.endSession();
                }
                //
            } catch (error: any) {
                await session.abortTransaction();
                session.endSession();
                throw new AppError(
                    httpStatus.SERVICE_UNAVAILABLE,
                    error.message ||
                        'Something went wrong please try again letter'
                );
            }
        } else {
            if (playerId) {
                const currentPlayerIds = user.playerIds || [];

                // If already exists, remove it first (to avoid duplicates)
                const filtered = currentPlayerIds.filter(
                    (id) => id !== playerId
                );

                // Add the new one to the end
                filtered.push(playerId);

                // If length > 3, remove from beginning
                if (filtered.length > 3) {
                    filtered.shift();
                }

                user.playerIds = filtered;
                await user.save();
            }
        }

        if (!user) {
            throw new AppError(404, 'User not found after creation');
        }

        // Prepare JWT tokens
        const jwtPayload = {
            id: user._id,
            profileId: user.profileId,
            email: user.email,
            role: user.role as TUserRole,
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
        return { accessToken, refreshToken, isNewUser, role: user.role };
    } catch (error: any) {
        console.error('OAuth login error:', error);

        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(500, 'Internal server error during OAuth login');
    }
};

const linkSocialAccount = async (
    provider: string,
    token: string,
    userId: string
) => {
    let id;
    try {
        if (provider === 'google') {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    audience: process.env.WEB_CLIENT_ID,
                });

                const payload = ticket.getPayload();
                if (!payload) {
                    throw new AppError(400, 'Invalid Google token payload');
                }

                id = payload.sub;
            } catch (err: any) {
                if (
                    err.message &&
                    err.message.includes('Wrong recipient, payload audience')
                ) {
                    throw new AppError(
                        401,
                        `Google token audience mismatch. Please check your client ID. ${err.message}`
                    );
                }
                throw new AppError(
                    401,
                    `Google token verification failed: ${err.message}`
                );
            }
        } else if (provider === 'facebook') {
            try {
                const response: any = await axios.get(
                    `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${token}`
                );

                if (!response.data || !response.data.id) {
                    throw new AppError(
                        400,
                        'Invalid Facebook token or response'
                    );
                }

                id = response.data.id;
            } catch (err: any) {
                throw new AppError(
                    401,
                    `Facebook token verification failed: ${
                        err.response?.data?.error?.message || err.message
                    }`
                );
            }
        } else if (provider === 'apple') {
            try {
                const appleUser = await appleSigninAuth.verifyIdToken(token, {
                    audience: process.env.APPLE_CLIENT_ID!,
                    ignoreExpiration: false,
                });

                if (!appleUser || !appleUser.sub) {
                    throw new AppError(400, 'Invalid Apple token payload');
                }

                id = appleUser.sub;
            } catch (err: any) {
                throw new AppError(
                    401,
                    `Apple token verification failed: ${err.message}`
                );
            }
        } else {
            throw new AppError(400, 'Unsupported OAuth provider');
        }

        const user: any = await User.findById(userId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'User not found');
        }

        const existingUser = await User.findOne({ [`${provider}Id`]: id });
        if (existingUser && existingUser._id.toString() !== userId) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "'This social account is already linked to another user.'"
            );
        }

        user[`${provider}Id`] = id;
        await user.save();
        return user;
    } catch (error: any) {
        console.error('OAuth login error:', error);

        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(500, 'Internal server error during OAuth login');
    }
};

const oAuthService = {
    loginWithOAuth,
    linkSocialAccount,
};

export default oAuthService;
