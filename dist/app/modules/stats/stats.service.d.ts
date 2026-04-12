declare const StatsService: {
    getUsersStats: () => Promise<any>;
    getWorkshopStats: () => Promise<any>;
    getEnrollmentStats: () => Promise<any>;
    getPaymentStats: () => Promise<any>;
};
export default StatsService;
