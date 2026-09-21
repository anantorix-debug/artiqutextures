export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  frontendUrl: string;
  corsOrigin: string;
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    resetSecret: string;
    resetExpiresIn: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
    fromName: string;
    fromEmail?: string;
  };
  upload: {
    dir: string;
    maxFileSizeMb: number;
  };
  whatsapp: {
    sessionDir: string;
    sessionName: string;
  };
  backup: {
    dir: string;
    mysqldumpPath: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
}

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      name: parsed.pathname.replace(/^\//, '') || 'walltextures',
    };
  } catch {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      name: 'walltextures',
    };
  }
}

export default (): { app: AppConfig } => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3001', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      resetSecret: process.env.JWT_RESET_SECRET ?? 'reset-secret',
      resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN ?? '30m',
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    },
    smtp: {
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || undefined,
      password: process.env.SMTP_PASSWORD || undefined,
      fromName: process.env.SMTP_FROM_NAME ?? 'Wall Texture CRM',
      fromEmail: process.env.SMTP_FROM_EMAIL || undefined,
    },
    upload: {
      dir: process.env.UPLOAD_DIR ?? 'uploads',
      maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10),
    },
    whatsapp: {
      sessionDir: process.env.WHATSAPP_SESSION_DIR ?? 'whatsapp-sessions',
      sessionName: process.env.WHATSAPP_SESSION_NAME ?? 'default',
    },
    backup: {
      dir: process.env.BACKUP_DIR ?? 'backups',
      mysqldumpPath: process.env.MYSQLDUMP_PATH ?? 'mysqldump',
    },
    database: parseDatabaseUrl(
      process.env.DATABASE_URL ?? 'mysql://root:@localhost:3306/walltextures',
    ),
  },
});
