/**
 * Canadian Tax Rates by Province/Territory
 * Updated as of 2026
 * 
 * Tax Types:
 * - GST: Goods and Services Tax (Federal)
 * - PST: Provincial Sales Tax
 * - HST: Harmonized Sales Tax (replaces GST + PST)
 * - QST: Quebec Sales Tax
 */

export interface TaxRate {
    province: string;
    provinceCode: string;
    gst: number;
    pst: number;
    hst: number;
    qst: number;
    total: number;
    taxType: 'GST+PST' | 'HST' | 'GST+QST' | 'GST';
    description: string;
}

export const TAX_RATES: Record<string, TaxRate> = {
    ON: {
        province: 'Ontario',
        provinceCode: 'ON',
        gst: 0,
        pst: 0,
        hst: 13,
        qst: 0,
        total: 13,
        taxType: 'HST',
        description: '13% HST'
    },
    BC: {
        province: 'British Columbia',
        provinceCode: 'BC',
        gst: 5,
        pst: 7,
        hst: 0,
        qst: 0,
        total: 12,
        taxType: 'GST+PST',
        description: '5% GST + 7% PST'
    },
    AB: {
        province: 'Alberta',
        provinceCode: 'AB',
        gst: 5,
        pst: 0,
        hst: 0,
        qst: 0,
        total: 5,
        taxType: 'GST',
        description: '5% GST'
    },
    QC: {
        province: 'Quebec',
        provinceCode: 'QC',
        gst: 5,
        pst: 0,
        hst: 0,
        qst: 9.975,
        total: 14.975,
        taxType: 'GST+QST',
        description: '5% GST + 9.975% QST'
    },
    MB: {
        province: 'Manitoba',
        provinceCode: 'MB',
        gst: 5,
        pst: 7,
        hst: 0,
        qst: 0,
        total: 12,
        taxType: 'GST+PST',
        description: '5% GST + 7% PST'
    },
    SK: {
        province: 'Saskatchewan',
        provinceCode: 'SK',
        gst: 5,
        pst: 6,
        hst: 0,
        qst: 0,
        total: 11,
        taxType: 'GST+PST',
        description: '5% GST + 6% PST'
    },
    NS: {
        province: 'Nova Scotia',
        provinceCode: 'NS',
        gst: 0,
        pst: 0,
        hst: 15,
        qst: 0,
        total: 15,
        taxType: 'HST',
        description: '15% HST'
    },
    NB: {
        province: 'New Brunswick',
        provinceCode: 'NB',
        gst: 0,
        pst: 0,
        hst: 15,
        qst: 0,
        total: 15,
        taxType: 'HST',
        description: '15% HST'
    },
    NL: {
        province: 'Newfoundland and Labrador',
        provinceCode: 'NL',
        gst: 0,
        pst: 0,
        hst: 15,
        qst: 0,
        total: 15,
        taxType: 'HST',
        description: '15% HST'
    },
    PE: {
        province: 'Prince Edward Island',
        provinceCode: 'PE',
        gst: 0,
        pst: 0,
        hst: 15,
        qst: 0,
        total: 15,
        taxType: 'HST',
        description: '15% HST'
    },
    NT: {
        province: 'Northwest Territories',
        provinceCode: 'NT',
        gst: 5,
        pst: 0,
        hst: 0,
        qst: 0,
        total: 5,
        taxType: 'GST',
        description: '5% GST'
    },
    NU: {
        province: 'Nunavut',
        provinceCode: 'NU',
        gst: 5,
        pst: 0,
        hst: 0,
        qst: 0,
        total: 5,
        taxType: 'GST',
        description: '5% GST'
    },
    YT: {
        province: 'Yukon',
        provinceCode: 'YT',
        gst: 5,
        pst: 0,
        hst: 0,
        qst: 0,
        total: 5,
        taxType: 'GST',
        description: '5% GST'
    }
};

/**
 * Calculate tax amounts for a given subtotal and province
 * @param subtotal - Price before tax
 * @param provinceCode - Two-letter province code (e.g., 'ON', 'BC')
 * @returns Object with tax breakdown and total
 */
export function calculateTax(subtotal: number, provinceCode: string) {
    const taxRate = TAX_RATES[provinceCode] || TAX_RATES.ON; // Default to Ontario
    
    const gstAmount = taxRate.gst > 0 ? (subtotal * taxRate.gst) / 100 : 0;
    const pstAmount = taxRate.pst > 0 ? (subtotal * taxRate.pst) / 100 : 0;
    const hstAmount = taxRate.hst > 0 ? (subtotal * taxRate.hst) / 100 : 0;
    const qstAmount = taxRate.qst > 0 ? (subtotal * taxRate.qst) / 100 : 0;
    
    const totalTax = gstAmount + pstAmount + hstAmount + qstAmount;
    const total = subtotal + totalTax;

    return {
        subtotal: Number(subtotal.toFixed(2)),
        gst: Number(gstAmount.toFixed(2)),
        pst: Number(pstAmount.toFixed(2)),
        hst: Number(hstAmount.toFixed(2)),
        qst: Number(qstAmount.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        total: Number(total.toFixed(2)),
        taxRate: taxRate.total,
        taxType: taxRate.taxType,
        description: taxRate.description
    };
}

/**
 * Get tax rate information for a province
 * @param provinceCode - Two-letter province code
 * @returns TaxRate object or null if not found
 */
export function getTaxRate(provinceCode: string): TaxRate | null {
    return TAX_RATES[provinceCode] || null;
}

/**
 * Get all province codes
 * @returns Array of province codes
 */
export function getProvinceCodes(): string[] {
    return Object.keys(TAX_RATES);
}

/**
 * Format tax breakdown for display
 * @param calculation - Result from calculateTax()
 * @returns Array of tax line items for display
 */
export function formatTaxBreakdown(calculation: ReturnType<typeof calculateTax>) {
    const items = [];
    
    if (calculation.gst > 0) {
        items.push({ label: 'GST (5%)', amount: calculation.gst });
    }
    
    if (calculation.pst > 0) {
        const taxRate = TAX_RATES[Object.keys(TAX_RATES).find(
            code => TAX_RATES[code].pst === (calculation.pst / calculation.subtotal) * 100
        ) || 'BC'];
        items.push({ label: `PST (${taxRate?.pst}%)`, amount: calculation.pst });
    }
    
    if (calculation.hst > 0) {
        const taxRate = TAX_RATES[Object.keys(TAX_RATES).find(
            code => TAX_RATES[code].hst === (calculation.hst / calculation.subtotal) * 100
        ) || 'ON'];
        items.push({ label: `HST (${taxRate?.hst}%)`, amount: calculation.hst });
    }
    
    if (calculation.qst > 0) {
        items.push({ label: 'QST (9.975%)', amount: calculation.qst });
    }
    
    return items;
}
