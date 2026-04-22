import httpStatus from 'http-status';
import AppError from '../error/appError';
import NormalUser from '../modules/normalUser/normalUser.model';

const updateStripeConnectedAccountStatus = async (accountId: string) => {
  if (!accountId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Account not found');
  }

  try {
    const updatedUser = await NormalUser.findOneAndUpdate(
      { stripeAccountId: accountId },
      { isStripeConnected: true },
      { new: true, runValidators: true },
    );
    console.log('updated user', updatedUser);
  } catch (err) {
    return {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'An error occurred while updating the client status.',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

export default updateStripeConnectedAccountStatus;
