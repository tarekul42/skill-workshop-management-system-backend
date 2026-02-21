import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import PaymentService from "./payment.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";

const initPayment = catchAsync(async (req: Request, res: Response) => {
  const enrollmentId = req.params.enrollmentId;

  const result = await PaymentService.initPayment(enrollmentId as string);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Payment initiated successfully",
    data: result,
  });
});

const successPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await PaymentService.successPayment(
    query as Record<string, string>,
  );

  if (result.success) {
    const params = new URLSearchParams({
      transactionId: String(query.transactionId ?? ""),
      message: result.message ?? "",
      amount: String(query.amount ?? ""),
      status: String(query.status ?? ""),
    });

    res.redirect(
      `${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`,
    );
  } else {
    res.redirect(
      `${envVariables.SSL.SSL_FAIL_FRONTEND_URL}?message=${encodeURIComponent(result.message ?? "Payment verification failed")}`,
    );
  }
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await PaymentService.failPayment(
    query as Record<string, string>,
  );

  const params = new URLSearchParams({
    transactionId: String(query.transactionId ?? ""),
    message: result.message ?? "",
    amount: String(query.amount ?? ""),
    status: String(query.status ?? ""),
  });

  if (!result.success) {
    res.redirect(
      `${envVariables.SSL.SSL_FAIL_FRONTEND_URL}?${params.toString()}`,
    );
  } else {
    res.redirect(
      `${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`,
    );
  }
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await PaymentService.cancelPayment(
    query as Record<string, string>,
  );

  const params = new URLSearchParams({
    transactionId: String(query.transactionId ?? ""),
    message: result.message ?? "",
    amount: String(query.amount ?? ""),
    status: String(query.status ?? ""),
  });

  if (!result.success) {
    res.redirect(
      `${envVariables.SSL.SSL_CANCEL_FRONTEND_URL}?${params.toString()}`,
    );
  } else {
    res.redirect(
      `${envVariables.SSL.SSL_SUCCESS_FRONTEND_URL}?${params.toString()}`,
    );
  }
});

const PaymentController = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
};

export default PaymentController;
