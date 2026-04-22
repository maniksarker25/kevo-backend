/* eslint-disable @typescript-eslint/no-explicit-any */
import { Customer } from '../customer/customer.model';
import Payment from '../payment/payment.model';
import { Provider } from '../provider/provider.model';
import { ENUM_TASK_STATUS } from '../task/task.enum';
import TaskModel from '../task/task.model';

const getDashboardMetaData = async () => {
    const [totalCustomer, totalProvider, activeTask] = await Promise.all([
        Customer.countDocuments(),
        Provider.countDocuments(),
        TaskModel.countDocuments({
            status: {
                $in: [
                    ENUM_TASK_STATUS.OPEN_FOR_BID,
                    ENUM_TASK_STATUS.IN_PROGRESS,
                ],
            },
        }),
    ]);

    return {
        totalCustomer,
        totalProvider,
        activeTask,
    };
};

const getCustomerChartData = async (year: number) => {
    const startOfYear = new Date(year, 0, 1);

    const endOfYear = new Date(year + 1, 0, 1);

    const chartData = await Customer.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                },
            },
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                totalUser: { $sum: 1 },
            },
        },
        {
            $project: {
                month: '$_id',
                totalUser: 1,
                _id: 0,
            },
        },
        {
            $sort: { month: 1 },
        },
    ]);

    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    const data = Array.from({ length: 12 }, (_, index) => ({
        month: months[index],
        totalUser:
            chartData.find((item) => item.month === index + 1)?.totalUser || 0,
    }));

    const yearsResult = await Customer.aggregate([
        {
            $group: {
                _id: { $year: '$createdAt' },
            },
        },
        {
            $project: {
                year: '$_id',
                _id: 0,
            },
        },
        {
            $sort: { year: 1 },
        },
    ]);

    const yearsDropdown = yearsResult.map((item: any) => item.year);

    return {
        chartData: data,
        yearsDropdown,
    };
};
const getProviderChartData = async (year: number) => {
    const startOfYear = new Date(year, 0, 1);

    const endOfYear = new Date(year + 1, 0, 1);

    const chartData = await Provider.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                },
            },
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                totalUser: { $sum: 1 },
            },
        },
        {
            $project: {
                month: '$_id',
                totalUser: 1,
                _id: 0,
            },
        },
        {
            $sort: { month: 1 },
        },
    ]);

    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    const data = Array.from({ length: 12 }, (_, index) => ({
        month: months[index],
        totalUser:
            chartData.find((item) => item.month === index + 1)?.totalUser || 0,
    }));

    const yearsResult = await Provider.aggregate([
        {
            $group: {
                _id: { $year: '$createdAt' },
            },
        },
        {
            $project: {
                year: '$_id',
                _id: 0,
            },
        },
        {
            $sort: { year: 1 },
        },
    ]);

    const yearsDropdown = yearsResult.map((item: any) => item.year);

    return {
        chartData: data,
        yearsDropdown,
    };
};

const getEarningChartData = async (year: number) => {
    // const startOfYear = new Date(year, 0, 1);
    // const endOfYear = new Date(year + 1, 0, 1);
    const selectedYear = year ?? new Date().getFullYear();

    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear + 1, 0, 1);

    // Aggregate transaction amounts per month
    const chartData = await Payment.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfYear,
                    $lt: endOfYear,
                },
            },
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                totalEarning: { $sum: '$platformEarningAmount' }, // sum of amounts
            },
        },
        {
            $project: {
                month: '$_id',
                totalEarning: 1,
                _id: 0,
            },
        },
        {
            $sort: { month: 1 },
        },
    ]);

    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    // Prepare chart data with 0 for months with no transactions
    const data = Array.from({ length: 12 }, (_, index) => ({
        month: months[index],
        totalEarning:
            chartData.find((item) => item.month === index + 1)?.totalEarning ||
            0,
    }));

    // Calculate total earning for the year
    const totalEarning = data.reduce((sum, item) => sum + item.totalEarning, 0);

    // Get available years from organizers
    const yearsResult = await Payment.aggregate([
        {
            $group: {
                _id: { $year: '$createdAt' },
            },
        },
        {
            $project: {
                year: '$_id',
                _id: 0,
            },
        },
        {
            $sort: { year: 1 },
        },
    ]);

    const yearsDropdown = yearsResult.map((item: any) => item.year);

    return {
        chartData: data,
        totalEarning,
        yearsDropdown,
    };
};
const MetaService = {
    getDashboardMetaData,
    getCustomerChartData,
    getProviderChartData,
    getEarningChartData,
};

export default MetaService;
