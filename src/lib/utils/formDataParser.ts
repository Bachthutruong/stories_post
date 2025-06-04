import { IncomingForm } from 'formidable';
import type { NextApiRequest } from 'next';

interface ParsedFormData {
    fields: { [key: string]: string | string[] };
    files: { [key: string]: any }; // Adjust 'any' to a more specific type if needed
}

export async function parseFormData(req: NextApiRequest): Promise<ParsedFormData> {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm();

        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({
                fields: Object.entries(fields).reduce((acc, [key, value]) => {
                    acc[key] = Array.isArray(value) ? value.map(v => String(v)) : String(value);
                    return acc;
                }, {} as { [key: string]: string | string[] }),
                files: Object.entries(files).reduce((acc, [key, value]) => {
                    // If there are multiple files with the same name, formidable returns an array.
                    // We'll just take the first file for simplicity in this example.
                    // For multiple files, you'd iterate or adjust based on your needs.
                    acc[key] = Array.isArray(value) ? value[0] : value;
                    return acc;
                }, {} as { [key: string]: any }),
            });
        });
    });
}
