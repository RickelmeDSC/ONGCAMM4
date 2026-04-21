import { ArgumentsHost, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function hostMock(path = '/api/v1/test') {
  const status = jest.fn().mockReturnThis();
  const json = jest.fn();
  const response = { status, json };
  const host: ArgumentsHost = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: path }),
    }),
  } as any;
  return { host, response };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('should respond with statusCode and message from the exception', () => {
    const { host, response } = hostMock();
    filter.catch(new NotFoundException('missing'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'missing',
        error: 'NotFoundException',
        path: '/api/v1/test',
      }),
    );
  });

  it('should extract message from complex exceptionResponse', () => {
    const { host, response } = hostMock();
    const exc = new HttpException(
      { message: ['nome must be a string'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exc, host);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['nome must be a string'],
      }),
    );
  });

  it('should include ISO timestamp', () => {
    const { host, response } = hostMock();
    filter.catch(new NotFoundException(), host);
    const payload = (response.json as jest.Mock).mock.calls[0][0];
    expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
