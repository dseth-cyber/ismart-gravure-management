import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';
import { ApiResponse } from '@shared/dto/auth/auth.dto';

export class SearchController {
  static async globalSearch(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const q = req.query.q as string | undefined;
      const results = await SearchService.globalSearch(q || '');
      const response: ApiResponse<any> = {
        status: 'success',
        statusCode: 200,
        data: results
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
