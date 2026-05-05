/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../error/appError';
import { ENUM_SUPPORT_STATUS } from './support.enum';
import { ISupport } from './support.interface';
import { Support } from './support.model';

const createSupport = async (userData: JwtPayload, payload: ISupport) => {
  const userModel =
    userData.role === 'customer'
      ? 'Customer'
      : userData.role === 'bartender'
        ? 'Bartender'
        : 'VenueOwner';

  const supportData = {
    ...payload,
    user: userData.profileId,
    userModel,
  };

  const result = await Support.create(supportData);

  return result;
};

const getAllSupport = async (query: Record<string, unknown>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const searchTerm = (query.searchTerm as string) || '';

  const filters: Record<string, unknown> = {};
  Object.keys(query).forEach((key) => {
    if (!['searchTerm', 'page', 'limit'].includes(key)) {
      filters[key] = query[key];
    }
  });

  const pipeline: any[] = [
    {
      $match: filters,
    },

    {
      $lookup: {
        from: 'customers',
        localField: 'user',
        foreignField: '_id',
        as: 'customer',
      },
    },
    {
      $lookup: {
        from: 'bartenders',
        localField: 'user',
        foreignField: '_id',
        as: 'bartender',
      },
    },
    {
      $lookup: {
        from: 'venueowners',
        localField: 'user',
        foreignField: '_id',
        as: 'venueOwner',
      },
    },

    {
      $addFields: {
        userDetails: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$userModel', 'Customer'] },
                then: { $arrayElemAt: ['$customer', 0] },
              },
              {
                case: { $eq: ['$userModel', 'Bartender'] },
                then: { $arrayElemAt: ['$bartender', 0] },
              },
              {
                case: { $eq: ['$userModel', 'VenueOwner'] },
                then: { $arrayElemAt: ['$venueOwner', 0] },
              },
            ],
            default: null,
          },
        },
      },
    },
  ];

  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { contactReason: { $regex: searchTerm, $options: 'i' } },
          { message: { $regex: searchTerm, $options: 'i' } },
          { 'userDetails.name': { $regex: searchTerm, $options: 'i' } },
          { 'userDetails.email': { $regex: searchTerm, $options: 'i' } },
        ],
      },
    });
  }

  pipeline.push({
    $project: {
      customer: 0,
      bartender: 0,
      venueOwner: 0,
    },
  });

  pipeline.push({
    $facet: {
      result: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: 'total' }],
    },
  });

  const aggResult = await Support.aggregate(pipeline);

  const result = aggResult?.[0]?.result || [];
  const total = aggResult?.[0]?.totalCount?.[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    result,
  };
};

const updateStatus = async (id: string, status: string) => {
  const validStatuses = Object.values(ENUM_SUPPORT_STATUS);
  if (
    !validStatuses.includes(
      status as (typeof ENUM_SUPPORT_STATUS)[keyof typeof ENUM_SUPPORT_STATUS],
    )
  ) {
    throw new AppError(
      400,
      `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
    );
  }

  const support = await Support.findByIdAndUpdate(
    id,
    {
      status,
    },
    { new: true, runValidators: true },
  );

  return support;
};

const getSingle = async (id: string) => {
  const result = await Support.findById(id);
  return result;
};
const SupportService = {
  createSupport,
  getAllSupport,
  updateStatus,
  getSingle,
};

export default SupportService;
