/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import express, { Application } from 'express';
import sendContactUsEmail from './app/helper/sendContactUsEmail';

import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import router from './app/routes';
const app: Application = express();
// parser----------------
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: [
            'http://localhost:3007',
            'http://localhost:3008',
            'http://localhost:3000',
            'http://10.10.20.60:3008',
            'https://taskalley-deploy.vercel.app',
            'https://taskalley-landing-page.vercel.app',
            'https://taskalley.com',
            'https://www.taskalley.com',
            'http://localhost:3001',
            'http://10.10.20.48:3000',
            'https://taskora-website-beryl.vercel.app',
            'https://task-master-dashboard-two.vercel.app',
        ],
        credentials: true,
    })
);
app.use('/uploads', express.static('uploads'));
// application routers ----------------
app.use('/api/v1', router);
app.post('/contact-us', sendContactUsEmail);

app.get('/', async (req, res) => {
    res.send({ message: 'nice to meet you 2' });
});

function getSmileTimestamp() {
    const date = new Date();

    const yyyy = date.getUTCFullYear();
    const MM = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const HH = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    const fff = String(date.getUTCMilliseconds()).padStart(3, '0');

    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${fff}+0000`;
}

export function generateSignature(
    partnerId: string,
    apiKey: string,
    timestamp: string
) {
    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(partnerId + timestamp);
    return hmac.digest('base64');
}

// global error handler
app.use(globalErrorHandler);
// not found
app.use(notFound);

export default app;
