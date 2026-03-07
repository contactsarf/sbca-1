"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
    currentPage: number;
    hasMore: boolean;
}

export default function Pagination({ currentPage, hasMore }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    if (currentPage === 1 && !hasMore) return null;

    return (
        <div className="flex items-center justify-center gap-2 pt-6">
            <Link
                href={currentPage > 1 ? createPageUrl(currentPage - 1) : "#"}
                className={`flex items-center gap-2 px-4 h-10 rounded-xl border border-primary/10 bg-white font-bold text-xs transition-all ${currentPage > 1 ? "text-primary hover:bg-primary/5 active:scale-95" : "text-tertiary/40 pointer-events-none opacity-50"
                    }`}
            >
                <ChevronLeft className="w-4 h-4" /> Previous
            </Link>

            <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-xs font-black text-primary min-w-[3rem] text-center">
                {currentPage}
            </div>

            <Link
                href={hasMore ? createPageUrl(currentPage + 1) : "#"}
                className={`flex items-center gap-2 px-4 h-10 rounded-xl border border-primary/10 bg-white font-bold text-xs transition-all ${hasMore ? "text-primary hover:bg-primary/5 active:scale-95" : "text-tertiary/40 pointer-events-none opacity-50"
                    }`}
            >
                Next <ChevronRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
