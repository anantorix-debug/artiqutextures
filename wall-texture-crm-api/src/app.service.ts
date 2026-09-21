import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'wall-texture-crm-api',
      timestamp: new Date().toISOString(),
    };
  }
}
