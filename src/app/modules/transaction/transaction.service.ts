/* eslint-disable @typescript-eslint/no-explicit-any */

import moment from 'moment';
import { Customer } from '../customer/customer.model';
import { Provider } from '../provider/provider.model';
import Transaction from './transaction.model';

const getMyTransaction = async (
    id: string,
    role: 'customer' | 'provider',
    query: any
) => {
    let myProfile;

    if (role === 'customer') {
        myProfile = await Customer.findById(id);
    } else if (role === 'provider') {
        myProfile = await Provider.findById(id);
    }

    if (!myProfile) {
        throw new Error('Profile not found');
    }

    const filter: any = { user: myProfile._id };

    // DAILY
    if (query.filterType === 'daily' && query.date) {
        const start = moment(query.date).startOf('day');
        const end = moment(query.date).endOf('day');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    // WEEKLY
    if (query.filterType === 'weekly' && query.week && query.year) {
        const start = moment()
            .year(query.year)
            .week(query.week)
            .startOf('week');
        const end = moment().year(query.year).week(query.week).endOf('week');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    // MONTHLY
    if (query.filterType === 'monthly' && query.month && query.year) {
        const start = moment()
            .year(query.year)
            .month(query.month - 1)
            .startOf('month');
        const end = moment()
            .year(query.year)
            .month(query.month - 1)
            .endOf('month');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    // YEARLY
    if (query.filterType === 'yearly' && query.year) {
        const start = moment().year(query.year).startOf('year');
        const end = moment().year(query.year).endOf('year');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    const result = await Transaction.find(filter).sort({ createdAt: -1 });

    return result;
};
const getAllTransaction = async (query: any) => {
    // eslint-disable-next-line prefer-const
    let filter: any = {};

    // DAILY FILTER
    if (query.filterType === 'daily' && query.date) {
        const start = moment(query.date).startOf('day');
        const end = moment(query.date).endOf('day');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    // WEEKLY FILTER
    if (query.filterType === 'weekly' && query.week && query.year) {
        const start = moment()
            .year(query.year)
            .week(query.week)
            .startOf('week');
        const end = moment().year(query.year).week(query.week).endOf('week');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    // MONTHLY FILTER
    if (query.filterType === 'monthly' && query.month && query.year) {
        const start = moment()
            .year(query.year)
            .month(query.month - 1)
            .startOf('month');
        const end = moment()
            .year(query.year)
            .month(query.month - 1)
            .endOf('month');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    // YEARLY FILTER
    if (query.filterType === 'yearly' && query.year) {
        const start = moment().year(query.year).startOf('year');
        const end = moment().year(query.year).endOf('year');
        filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    }

    const result = await Transaction.find(filter).sort({ createdAt: -1 });
    return result;
};

const TransactionServices = { getMyTransaction, getAllTransaction };
export default TransactionServices;
