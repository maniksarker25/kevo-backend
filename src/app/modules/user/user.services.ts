/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import cron from 'node-cron';
import config from '../../config';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import registrationSuccessEmailBody from '../../mailTemplate/registrationSuccessEmailBody';
import sendEmail from '../../utilities/sendEmail';
import Admin from '../admin/admin.model';
import { ICustomer } from '../customer/customer.interface';
import { Customer } from '../customer/customer.model';
import { Provider } from '../provider/provider.model';
import SuperAdmin from '../superAdmin/superAdmin.model';
import { USER_ROLE } from './user.constant';
import { TUser, TUserRole } from './user.interface';
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

    const emailExist = await User.findOne({ email: userData.email });
    if (emailExist) {
        throw new AppError(httpStatus.BAD_REQUEST, 'This email already exists');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const verifyCode = generateVerifyCode();

        const userDataPayload: Partial<TUser> = {
            email: userData?.email,
            phone: userData?.phone,
            password,
            role,
            roles: [role],
            verifyCode,
            codeExpireIn: new Date(Date.now() + 5 * 60000), 
        };

        if (playerId) {
            userDataPayload.playerIds = [playerId];
        }

        // Create user
        const [user] = await User.create([userDataPayload], { session });

        let profile;
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

        const smsMessage = `Thank you for registering with Task Alley. Your verification code is ${verifyCode}. It expires in 5 minutes. Please verify in time to complete registration.`;
        // await sendSMS(userData.phone, smsMessage);

        // If SMS sent successfully, commit transaction
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
    //TODO: remove 111111 after testing
    if (verifyCode !== user.verifyCode && verifyCode !== 111111) {
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
        obj.isBankNumberVerified = provider?.isBankVerificationNumberApproved;
        obj.isIdentificationDocumentVerified =
            provider?.isIdentificationDocumentApproved;
        obj.isAddressProvided = provider?.isAddressProvided;
    } else {
        const customer = await Customer.findById(user.profileId);
        obj.isAddressProvided = customer?.isAddressProvided;
    }
    const name = user.role == USER_ROLE.provider ? 'Freelancer' : 'Tasker';
    sendEmail({
        email: user.email,
        subject: 'Welcome to Task Alley!',
        html: registrationSuccessEmailBody(name),
    });

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
    const smsMessage = `Thank you for registering with Task Alley. Your verification code is ${verifyCode}. It expires in 5 minutes. Please verify in time to complete registration.`;
    //TODO: need to enable sendSMS after testing
    // await sendSMS(user.phone, smsMessage);
    return null;
};

const getMyProfile = async (userData: JwtPayload) => {
    let result = null;
    if (userData.role === USER_ROLE.customer) {
        result = await Customer.findOne({ email: userData.email }).populate({
            path: 'user',
            select: 'isMultiRole',
        });
    }
    if (userData.role === USER_ROLE.provider) {
        result = await Provider.findOne({ email: userData.email }).populate({
            path: 'user',
            select: 'isMultiRole',
        });
    } else if (userData.role === USER_ROLE.superAdmin) {
        result = await SuperAdmin.findOne({ email: userData.email });
    } else if (userData.role === USER_ROLE.admin) {
        result = await Admin.findOne({ email: userData.email });
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
const updateUserProfile = async (userData: JwtPayload, payload: any) => {
    if (payload.email || payload.phone) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You can not change the email or phone number'
        );
    }
    if (userData.role == USER_ROLE.customer) {
        const user = await Customer.findById(userData.profileId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        if (payload.city || payload.address) {
            payload.isAddressProvided = true;
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
        if (payload.address_document && user.address_document) {
            deleteFileFromS3(user.address_document);
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
        if (payload.city || payload.address) {
            payload.isAddressProvided = true;
        }

        const result = await Provider.findByIdAndUpdate(
            userData.profileId,
            payload,
            { new: true, runValidators: true }
        );
        if (payload.profile_image && provider.profile_image) {
            deleteFileFromS3(provider.profile_image);
        }
        if (payload.address_document && provider.address_document) {
            deleteFileFromS3(provider.address_document);
        }
        return result;
    }
};
// all cron jobs for users

cron.schedule('*/2 * * * *', async () => {
    try {
        const now = new Date();

        const expiredUsers = await User.find({
            isVerified: false,
            codeExpireIn: { $lte: now },
        });

        if (expiredUsers.length > 0) {
            const expiredUserIds = expiredUsers.map((user) => user._id);

            // Delete corresponding Customer documents
            const CustomerDeleteResult = await Customer.deleteMany({
                user: { $in: expiredUserIds },
            });
            const ProviderDeleteResult = await Provider.deleteMany({
                user: { $in: expiredUserIds },
            });

            // Delete the expired User documents
            const userDeleteResult = await User.deleteMany({
                _id: { $in: expiredUserIds },
            });

            console.log(
                `Deleted ${userDeleteResult.deletedCount} expired inactive users`
            );
            console.log(
                `Deleted ${CustomerDeleteResult.deletedCount} associated Customer documents`
            );
            console.log(
                `Deleted ${ProviderDeleteResult.deletedCount} associated Customer documents`
            );
        }
    } catch (error) {
        console.log('Error deleting expired users and associated data:', error);
    }
});

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
    console.log('user', user);
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
                    isAddressProvided: provider.isAddressProvided,
                    isIdentificationDocumentVerified:
                        provider.isIdentificationDocumentApproved,
                    isBankNumberVerified:
                        provider.isBankVerificationNumberApproved,
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
                    isAddressProvided: customer.isAddressProvided,
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
                city: customer?.city,
                street: customer?.street,
                address_document: customer?.address_document,
                address: customer?.address,
                isAddressProvided: customer?.isAddressProvided,
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
                city: provider?.city,
                street: provider?.street,
                address_document: provider?.address_document,
                address: provider?.address,
                isAddressProvided: provider?.isAddressProvided,
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
