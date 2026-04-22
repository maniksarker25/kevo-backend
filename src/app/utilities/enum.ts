export const ENUM_PRODUCT_STATUS = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
} as const;

export const ENUM_PAYMENT_STATUS = {
    PAID: 'PAID',
    UNPAID: 'UNPAID',
    REFUNDED: 'REFUNDED',
    PAID_BY_CUSTOMER: 'PAID_BY_CUSTOMER',
    PAID_TO_PROVIDER: 'PAID_TO_PROVIDER',
};

export const ENUM_PAYMENT_PURPOSE = {
    BID_ACCEPT: 'BID_ACCEPT',
    SUCCESS: 'Success',
};

export const ENUM_TIP_BY = {
    PROFILE_BALANCE: 'Profile balance',
    CREDIT_CARD: 'Credit card',
    PAYPAL: 'Paypal',
};

export const ENUM_USER_STATUS = {
    IN_PROGRESS: 'in-progress',
    BLOCKED: 'blocked',
};

export const ENUM_PlACE_STATUS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
};
