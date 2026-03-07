import { TAX_RATES, ProvinceCode } from "@/constants/taxes";

export interface TaxBreakdown {
    gst: number;
    hst: number;
    pst: number;
    qst?: number;
    totalTax: number;
    totalWithTax: number;
    province: string;
    taxRate: number;
    taxType: string;
    description: string;
}

export { type ProvinceCode };

/**
 * Calculates tax for a given amount and province
 */
export function calculateTax(amount: number, provinceCode: string = 'ON'): TaxBreakdown {
    const province = (provinceCode.toUpperCase() as ProvinceCode) || 'ON';
    const rateInfo = TAX_RATES[province] || TAX_RATES['ON'];

    const gst = rateInfo.gst > 0 ? (amount * rateInfo.gst) / 100 : 0;
    const hst = rateInfo.hst > 0 ? (amount * rateInfo.hst) / 100 : 0;
    const pst = rateInfo.pst > 0 ? (amount * rateInfo.pst) / 100 : 0;
    const qst = rateInfo.qst > 0 ? (amount * rateInfo.qst) / 100 : 0;

    const totalTax = gst + hst + pst + qst;

    return {
        gst: Number(gst.toFixed(2)),
        hst: Number(hst.toFixed(2)),
        pst: Number(pst.toFixed(2)),
        qst: Number(qst.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        totalWithTax: Number((amount + totalTax).toFixed(2)),
        province,
        taxRate: rateInfo.total,
        taxType: rateInfo.taxType,
        description: rateInfo.description
    };
}
