export interface ISubscriber {
    name: string;
    email: string;
    phone: string;
    role: 'Provider' | 'Customer';
}
