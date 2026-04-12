declare const OTPService: {
    sendOtp: (email: string, name: string) => Promise<void>;
    verifyOtp: (email: string, otp: string) => Promise<void>;
};
export default OTPService;
