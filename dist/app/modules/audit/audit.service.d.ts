interface AuditQueryParams {
    page?: number;
    limit?: number;
    collectionName?: string;
    action?: string;
    performedBy?: string;
    documentId?: string;
    startDate?: string;
    endDate?: string;
}
declare const AuditService: {
    getAuditLogs: (params: AuditQueryParams) => Promise<{
        data: (import("./audit.interface.js").IAuditLog & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPage: number;
        };
    }>;
    getAuditLogById: (id: string) => Promise<import("./audit.interface.js").IAuditLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
};
export default AuditService;
