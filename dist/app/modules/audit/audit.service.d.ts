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
        logs: (import("./audit.interface.js").IAuditLog & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAuditLogById: (id: string) => Promise<import("./audit.interface.js").IAuditLog & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
};
export default AuditService;
