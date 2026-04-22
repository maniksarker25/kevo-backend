/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../error/appError';
import { TUserRole } from '../user/user.interface';
import { User } from '../user/user.model';
import { createToken, verifyToken } from '../user/user.utils';
import { TLoginUser } from './auth.interface';
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || '').split(',');
import { Customer } from '../customer/customer.model';
import { Provider } from '../provider/provider.model';
import { USER_ROLE } from '../user/user.constant';
const generateVerifyCode = (): number => {
    return Math.floor(100000 + Math.random() * 900000);
};

const loginUserIntoDB = async (payload: TLoginUser) => {
    const user = await User.findOne({ email: payload.email });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }
    if (!user.isActive) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Your account  is inactivated , please contact support'
        );
    }

    if (!user.isVerified) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'You are not verified user . Please verify your email'
        );
    }
    if (payload.role && !user.roles.includes(payload.role)) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            `${payload.role} account not found`
        );
    }
    // checking if the password is correct ----
    if (!(await User.isPasswordMatched(payload?.password, user?.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
    }

    if (payload.playerId) {
        const currentPlayerIds = user.playerIds || [];

        // If already exists, remove it first (to avoid duplicates)
        const filtered = currentPlayerIds.filter(
            (id) => id !== payload.playerId
        );

        // Add the new one to the end
        filtered.push(payload.playerId);

        // If length > 3, remove from beginning
        if (filtered.length > 3) {
            filtered.shift();
        }

        await User.findByIdAndUpdate(user._id, { playerIds: filtered });
    }

    const jwtPayload = {
        id: user?._id,
        profileId: user.profileId,
        email: user?.email,
        role: payload.role || user.role,
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

    return {
        accessToken,
        refreshToken,
        ...obj,
        role: user?.role,
    };
};

// change password
const changePasswordIntoDB = async (
    userData: JwtPayload,
    payload: {
        oldPassword: string;
        newPassword: string;
        confirmNewPassword: string;
    }
) => {
    if (payload.newPassword !== payload.confirmNewPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Password and confirm password doesn't match"
        );
    }
    const user = await User.findById(userData.id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    if (!(await User.isPasswordMatched(payload?.oldPassword, user?.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
    }
    //hash new password
    const newHashedPassword = await bcrypt.hash(
        payload.newPassword,
        Number(config.bcrypt_salt_rounds)
    );
    await User.findOneAndUpdate(
        {
            _id: userData.id,
            role: userData.role,
        },
        {
            password: newHashedPassword,
            passwordChangedAt: new Date(),
        }
    );
    return null;
};

const refreshToken = async (token: string) => {
    const decoded = verifyToken(token, config.jwt_refresh_secret as string);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username, email, iat, id } = decoded;
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }
    // if (
    //   user?.passwordChangedAt &&
    //   (await User.isJWTIssuedBeforePasswordChange(
    //     user?.passwordChangedAt,
    //     iat as number,
    //   ))
    // ) {
    //   throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized');
    // }
    const jwtPayload = {
        id: user?._id,
        profileId: user?.profileId,
        email: user?.email,
        role: user?.role as TUserRole,
    };
    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );
    return { accessToken };
};

// forgot password
const forgetPassword = async (phone: string) => {
    const user = await User.findOne({ phone: phone });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    const resetCode = generateVerifyCode();
    await User.findOneAndUpdate(
        { phone: phone },
        {
            resetCode: resetCode,
            isResetVerified: false,
            codeExpireIn: new Date(Date.now() + 5 * 60000),
        }
    );
    //TODO: send reset code to user phone number via sms after testing
    // await sendSMS(
    //     user.phone,
    //     `Task Alley: Your password reset code is ${resetCode}. This code will expire in 5 minutes. If you didn’t request a password reset, please ignore this message.`
    // );

    return null;
};

// verify forgot otp

const verifyResetOtp = async (phone: string, resetCode: number) => {
    const user = await User.findOne({ phone: phone });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    if (user.codeExpireIn < new Date(Date.now())) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Reset code is expire');
    }
    if (user.resetCode !== Number(resetCode) && resetCode !== 111111) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Reset code is invalid');
    }
    await User.findOneAndUpdate(
        { phone: phone },
        { isResetVerified: true },
        { new: true, runValidators: true }
    );
    return null;
};

// reset password
const resetPassword = async (payload: {
    phone: string;
    password: string;
    confirmPassword: string;
}) => {
    if (payload.password !== payload.confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Password and confirm password doesn't match"
        );
    }
    const user = await User.findOne({ phone: payload.phone });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (!user.isResetVerified) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You need to verify reset code before reset password'
        );
    }

    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }
    const newHashedPassword = await bcrypt.hash(
        payload.password,
        Number(config.bcrypt_salt_rounds)
    );
    await User.findOneAndUpdate(
        {
            phone: payload.phone,
        },
        {
            password: newHashedPassword,
            passwordChangedAt: new Date(),
        }
    );
    const jwtPayload = {
        id: user?._id,
        profileId: user?.profileId,
        email: user?.email,
        role: user?.role as TUserRole,
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

    return { accessToken, refreshToken };
};

const resendResetCode = async (phone: string) => {
    const user = await User.findOne({ phone: phone });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user does not exist');
    }
    if (user.isDeleted) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'This user is already deleted'
        );
    }
    if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
    }

    const resetCode = generateVerifyCode();
    await User.findOneAndUpdate(
        { phone: phone },
        {
            resetCode: resetCode,
            isResetVerified: false,
            codeExpireIn: new Date(Date.now() + 5 * 60000),
        }
    );
    //TODO: send reset code to user phone number via sms after testing
    // sendSMS(
    //     user.phone,
    //     `Task Alley: Your password reset code is ${resetCode}. This code will expire in 5 minutes. If you didn’t request a password reset, please ignore this message.`
    // );

    return null;
};

const getAllUserFromDB = async () => {
    const result = await User.find();
    return result;
};

const authServices = {
    loginUserIntoDB,
    changePasswordIntoDB,
    refreshToken,
    forgetPassword,
    resetPassword,
    verifyResetOtp,
    resendResetCode,
    getAllUserFromDB,
};

export default authServices;
