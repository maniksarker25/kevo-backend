import { z } from "zod";

export const updateTransactionData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const TransactionValidations = { updateTransactionData };
export default TransactionValidations;