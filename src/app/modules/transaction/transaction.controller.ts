import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import transactionServices from './transaction.service';

const getMyTransaction = catchAsync(async (req, res) => {
    const result = await transactionServices.getMyTransaction(
        req.user.profileId,
        req.user.role,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Successfully retrieved your data',
        data: result,
    });
});

const getAllTransaction = catchAsync(async (req, res) => {
    const result = await transactionServices.getAllTransaction(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Successfully retrieved your data',
        data: result,
    });
});
const TransactionController = { getMyTransaction, getAllTransaction };
export default TransactionController;
