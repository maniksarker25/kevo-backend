/* eslint-disable @typescript-eslint/no-explicit-any */
import { Customer } from '../customer/customer.model';
import Payment from '../payment/payment.model';
import { Provider } from '../provider/provider.model';
import Report from '../report/report.model';

const getDashboardMetaData = async () => {
    const [totalCustomer, totalProvider, pendingReports] = await Promise.all([
        Customer.countDocuments(),
        Provider.countDocuments(),
        Report.countDocuments({ isResolved: false }),
    ]);

    return {
        totalCustomer,
        totalProvider,
        pendingReports,
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

const getActivities = async (query: Record<string, unknown>) => {
    try {
        const { frame } = query; // e.g., 'Last 24 Hours', 'Last Week', etc.
        const now = new Date();

        let currentStart: Date | null = null;
        let previousStart: Date | null = null;
        let previousEnd: Date | null = null;

        // Calculate current and previous periods
        switch (frame) {
            case 'Last 24 Hours':
                currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                previousStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
                previousEnd = currentStart;
                break;
            case 'Last Week':
                currentStart = new Date(
                    now.getTime() - 7 * 24 * 60 * 60 * 1000
                );
                previousStart = new Date(
                    now.getTime() - 14 * 24 * 60 * 60 * 1000
                );
                previousEnd = currentStart;
                break;
            case 'Last Fortnight':
                currentStart = new Date(
                    now.getTime() - 14 * 24 * 60 * 60 * 1000
                );
                previousStart = new Date(
                    now.getTime() - 28 * 24 * 60 * 60 * 1000
                );
                previousEnd = currentStart;
                break;
            case 'Last Month':
                currentStart = new Date();
                currentStart.setMonth(now.getMonth() - 1);
                previousStart = new Date();
                previousStart.setMonth(now.getMonth() - 2);
                previousEnd = currentStart;
                break;
            case 'Last Year':
                currentStart = new Date();
                currentStart.setFullYear(now.getFullYear() - 1);
                previousStart = new Date();
                previousStart.setFullYear(now.getFullYear() - 2);
                previousEnd = currentStart;
                break;
            default:
                currentStart = null; // All time
                previousStart = null;
                previousEnd = null;
        }

        // Helper function to calculate % difference
        const calcPercentage = (current: number, previous: number) => {
            if (previous === 0) return current === 0 ? 0 : 100;
            return ((current - previous) / previous) * 100;
        };

        // Build filters
        const currentFilter: any = currentStart
            ? { createdAt: { $gte: currentStart } }
            : {};
        const previousFilter: any =
            previousStart && previousEnd
                ? { createdAt: { $gte: previousStart, $lt: previousEnd } }
                : {};

        // Run counts in parallel
        const [
            currentCustomers,
            prevCustomers,
            currentProviders,
            prevProviders,
            currentReports,
            prevReports,
        ] = await Promise.all([
            Customer.countDocuments(currentFilter),
            previousStart ? Customer.countDocuments(previousFilter) : 0,
            Provider.countDocuments(currentFilter),
            previousStart ? Provider.countDocuments(previousFilter) : 0,
            Report.countDocuments(currentFilter),
            previousStart ? Report.countDocuments(previousFilter) : 0,
        ]);

        return {
            customers: {
                count: currentCustomers,
                changePercent: calcPercentage(currentCustomers, prevCustomers),
            },
            providers: {
                count: currentProviders,
                changePercent: calcPercentage(currentProviders, prevProviders),
            },
            report: {
                count: currentReports,
                changePercent: calcPercentage(currentReports, prevReports),
            },
        };
    } catch (err) {
        console.error(err);
    }
};
const MetaService = {
    getDashboardMetaData,
    getCustomerChartData,
    getProviderChartData,
    getEarningChartData,
    getActivities,
};

export default MetaService;
