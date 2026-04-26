import { z } from "zod";

export const updateReportData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const ReportValidations = { updateReportData };
export default ReportValidations;