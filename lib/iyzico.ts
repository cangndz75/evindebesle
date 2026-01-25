import Iyzipay from "iyzipay";

export const iyzico = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!,
    secretKey: process.env.IYZICO_SECRET_KEY!,
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
});

export function iyzicoCall<T>(fn: (req: any, cb: (err: any, res: T) => void) => void, req: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        fn.call(iyzico, req, (err: any, res: T) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}
