import { model, Schema } from 'mongoose';
import { ENUM_REPORT_ROLE } from './report.enum';
import { IReport } from './report.interface';

const reportSchema = new Schema<IReport>(
    {
        reportBy: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'reportByRole',
        },

        reportByRole: {
            type: String,
            enum: Object.values(ENUM_REPORT_ROLE),
            required: true,
        },

        reportTo: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'reportToRole',
        },

        reportToRole: {
            type: String,
            enum: Object.values(ENUM_REPORT_ROLE),
            required: true,
        },

        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },

        reason: {
            type: String,
            required: true,
            trim: true,
        },

        evidence: [
            {
                type: String,
            },
        ],

        isResolved: {
            type: Boolean,
            default: false,
        },

        resolutionNote: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);
const ReportModel = model<IReport>('Report', reportSchema);
export default ReportModel;
