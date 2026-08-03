import { Response } from 'express';

interface SuccessResponseData {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: any;
}

export const sendSuccessResponse = ({
  res,
  statusCode = 200,
  message = 'Success',
  data = null
}: SuccessResponseData) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

interface ErrorResponseData {
  res: Response;
  statusCode?: number;
  message?: string;
  errors?: any;
}

export const sendErrorResponse = ({
  res,
  statusCode = 400,
  message = 'Error',
  errors = null
}: ErrorResponseData) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
