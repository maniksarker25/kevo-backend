/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import oAuthService from './oAuth.service';

const oAuthLogin = catchAsync(async (req, res) => {
  const { provider, token, role } = req.body;
  if (!['google', 'apple', 'facebook'].includes(provider)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid provider');
  }
  const result = await oAuthService.loginWithOAuth(provider, token, role);
  res.cookie('refresh-token', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User login successfully',
    data: result,
  });
});
const oAuthLink = catchAsync(async (req, res) => {
  const { provider, token } = req.body;
  if (!['google', 'apple', 'facebook'].includes(provider)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid provider');
  }
  const result = await oAuthService.loginWithOAuth(
    provider,
    token,
    req.user.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Social link successfully',
    data: result,
  });
});

const oAuthController = {
  oAuthLogin,
  oAuthLink,
};

export default oAuthController;
